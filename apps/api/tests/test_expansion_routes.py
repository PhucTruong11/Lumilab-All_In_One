"""HTTP contract regressions for draft calculation and retrieval integration."""
import json
from dataclasses import replace
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from lumilab_api.main import create_app
from lumilab_api.settings import Settings

ROOT = Path(__file__).resolve().parents[3]
CASES = json.loads((ROOT / "tests/golden/additional-labs.json").read_text(encoding="utf-8"))["cases"]


def app():
    return create_app(Settings(_env_file=None, knowledge_dir=ROOT / "knowledge",
        contracts_dir=ROOT / "packages/contracts", runtime_lab_dir=ROOT / "packages/lab-engine",
        database_url=None, llm_enabled=False, rag_enabled=False))


@pytest.mark.parametrize("case", CASES)
def test_new_lab_routes_recompute_shared_golden_values_without_approval(case):
    lab_id = case["lab_id"]
    config = json.loads((ROOT / f"packages/lab-engine/labs/{lab_id}/lab.json").read_text(encoding="utf-8"))
    payload = {key: config[key] for key in ("model_version", "dataset_version")}
    payload.update(parameters=case["parameters"], elapsed_s=case["elapsed_s"])
    with TestClient(app()) as client:
        response = client.post("/api/v1/verification/labs/" + lab_id, json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "INSUFFICIENT_DATA"
    assert data["code"] == "REVIEWED_EVIDENCE_REQUIRED"
    assert data["facts"] == {} and data["evidence"] == []
    assert data["stage_checks"]
    assert all(check["status"] in {"pass", "skipped"} for check in data["stage_checks"])
    for key, value in case["expected"].items():
        if type(value) in (int, float):
            assert data["preview"][key] == pytest.approx(value, rel=1e-10, abs=1e-12)
        else:
            assert data["preview"][key] == value


@pytest.mark.parametrize("method", ["lexical", "vector"])
@pytest.mark.parametrize("lab_id,question", [
    ("parallel-circuit", "dòng nhánh song song"), ("capacitor", "tụ điện nạp xả"),
    ("precipitation", "kết tủa chất giới hạn"), ("gas-reaction", "bicarbonat khí CO2"),
])
def test_new_cards_filter_by_lab_and_review_before_ranking(lab_id, question, method):
    with TestClient(app()) as client:
        payload = dict(lab_id=lab_id, query=question, retrieval_method=method)
        data = client.post("/api/v1/retrieval/query", json=payload).json()
        assert data["status"] == "FOUND"
        assert all(hit["document"]["lab_id"] == lab_id for hit in data["hits"])
        assert all(hit["document"]["review_status"] == "draft" for hit in data["hits"])
        filtered = client.post("/api/v1/retrieval/query", json=payload | {"include_drafts": False}).json()
        assert filtered["hits"] == []


def test_inconsistent_model_output_is_not_eligible_for_preview(monkeypatch):
    from lumilab_api.readings import MODELS
    version, calculate = MODELS["precipitation"]
    monkeypatch.setitem(MODELS, "precipitation", (version, lambda p, t: calculate(p, t) | {"precipitateMass_g": 999}))
    config = json.loads((ROOT / "packages/lab-engine/labs/precipitation/lab.json").read_text(encoding="utf-8"))
    payload = {key: config[key] for key in ("model_version", "dataset_version")}
    with TestClient(app()) as client:
        result = client.post("/api/v1/verification/labs/precipitation", json=payload | {"parameters": config["defaults"]}).json()
    assert result["status"] == "INVALID"
    assert result["preview"] is None and result["facts"] == {}


@pytest.mark.parametrize("lab_id", ["pendulum", "chemistry"])
@pytest.mark.parametrize("checks", [[], [
    {"stage": "physics_invariants", "status": "pass", "code": "OK", "reason": "test"},
    {"stage": "physics_invariants", "status": "skipped", "code": "SKIP", "reason": "test"},
]])
def test_missing_or_duplicate_science_stages_cannot_produce_preview(monkeypatch, lab_id, checks):
    import lumilab_api.recompute as recompute_module

    monkeypatch.setattr(recompute_module, "check_science", lambda *_: checks)
    config = json.loads((ROOT / f"packages/lab-engine/labs/{lab_id}/lab.json").read_text(encoding="utf-8"))
    payload = {key: config[key] for key in ("model_version", "dataset_version")}
    with TestClient(app()) as client:
        response = client.post("/api/v1/verification/labs/" + lab_id,
                               json=payload | {"parameters": config["defaults"]})
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "INSUFFICIENT_DATA"
    assert result["code"] == "SCIENTIFIC_CHECKS_INCOMPLETE"
    assert result["preview"] is None and result["facts"] == {} and result["evidence"] == []


def test_every_runtime_model_has_complete_science_stages_at_defaults():
    catalog = json.loads((ROOT / "packages/lab-engine/labs/catalog.json").read_text(encoding="utf-8"))
    with TestClient(app()) as client:
        for lab_id in catalog["active"] + catalog["archived"]:
            config = json.loads((ROOT / f"packages/lab-engine/labs/{lab_id}/lab.json")
                                .read_text(encoding="utf-8"))
            payload = {key: config[key] for key in ("model_version", "dataset_version")}
            response = client.post("/api/v1/verification/labs/" + lab_id,
                                   json=payload | {"parameters": config["defaults"]})
            assert response.status_code == 200, lab_id
            result = response.json()
            if lab_id == "pendulum":
                assert result["status"] == "VERIFIED", lab_id
                assert result["code"] == "VERIFIED", lab_id
                assert result["preview"] is not None and result["facts"], lab_id
                assert result["evidence"] == [
                    "VL-CONLAC-01:period-agm",
                    "VL-CONLAC-01:length-ratio",
                    "VL-CONLAC-01:small-angle-learning",
                ], lab_id
            else:
                assert result["code"] == "REVIEWED_EVIDENCE_REQUIRED", lab_id
                assert result["preview"] is not None and result["facts"] == {}, lab_id
                assert result["evidence"] == [], lab_id


def test_pendulum_dataset_length_comparison_stays_draft():
    config = json.loads((ROOT / "packages/lab-engine/labs/pendulum/lab.json")
                        .read_text(encoding="utf-8"))
    payload = {key: config[key] for key in ("model_version", "dataset_version")}
    with TestClient(app()) as client:
        periods = []
        for length_m in (0.4, 1.6):
            parameters = config["defaults"] | {"length_m": length_m, "angle_deg": 10}
            response = client.post("/api/v1/verification/labs/pendulum",
                                   json=payload | {"parameters": parameters})
            assert response.status_code == 200
            result = response.json()
            assert result["status"] == "VERIFIED"
            assert result["code"] == "VERIFIED"
            assert result["facts"]["period_s"] == result["preview"]["period_s"]
            assert "VL-CONLAC-01:length-ratio" in result["evidence"]
            periods.append(result["preview"]["period_s"])
    assert periods[1] / periods[0] == pytest.approx(2, rel=2e-9)


@pytest.mark.parametrize("overrides", [
    {"verified_eligible": False},
    {"status": "draft"},
    {"source_review": "draft"},
    {"rights_review": "pending"},
    {"reviewed_by": None},
    {"dataset_version": "2026-01-01-stale"},
])
def test_unapproved_or_mismatched_claim_record_stays_insufficient_data(overrides):
    from lumilab_api.recompute import RecomputeInput, load_runtime_definitions, recompute

    runtime = load_runtime_definitions(ROOT / "packages/lab-engine", ROOT / "knowledge")
    lab = runtime["pendulum"]
    modified_claim = lab.claim.model_copy(update=overrides)
    unapproved_lab = replace(lab, claim=modified_claim)
    result = recompute(
        "pendulum",
        unapproved_lab,
        RecomputeInput(
            model_version=lab.model_version,
            dataset_version=lab.dataset_version,
            parameters=lab.configuration["defaults"],
        ),
        "test-req",
    )
    assert result.status == "INSUFFICIENT_DATA"
    assert result.code == "REVIEWED_EVIDENCE_REQUIRED"
    assert result.facts == {} and result.evidence == []
    assert "reviewed_evidence" in result.checks_skipped


def test_runtime_catalog_keeps_archived_models_out_of_default_list():
    with TestClient(app()) as client:
        active = client.get("/api/v1/runtime-labs").json()["items"]
        all_labs = client.get("/api/v1/runtime-labs?include_archived=true").json()["items"]
    assert len(active) == 14 and len(all_labs) == 17
    assert {lab["id"] for lab in all_labs} - {lab["id"] for lab in active} == {
        "alkali-water", "copper-nitric", "chlorine-bleach",
    }
    assert all(lab["review_status"] == "draft" and lab["server_recompute"] for lab in active)
    assert all(lab["sources"] and lab["parameter_schema"] and lab["defaults"] for lab in active)


def test_optional_vector_failure_has_a_clear_error_and_lexical_still_works(monkeypatch, tmp_path):
    monkeypatch.setenv("LUMILAB_RETRIEVAL_EMBEDDER", "sentence-transformers")
    monkeypatch.setenv("LUMILAB_RETRIEVAL_MODEL_PATH", str(tmp_path / "missing-local-model"))
    with TestClient(app()) as client:
        query = {"lab_id": "precipitation", "query": "kết tủa AgCl"}
        response = client.post("/api/v1/retrieval/query", json=query | {"retrieval_method": "vector"})
        assert response.status_code == 503
        assert response.json()["error"]["code"] == "LOCAL_VECTOR_UNAVAILABLE"
        assert client.post("/api/v1/retrieval/query", json=query).json()["status"] == "FOUND"


def test_rc_reading_time_is_bound_to_the_requested_snapshot(monkeypatch):
    from lumilab_api.readings import MODELS
    version, calculate = MODELS["capacitor"]
    monkeypatch.setitem(MODELS, "capacitor", (version, lambda p, t: calculate(p, t + 0.1)))
    config = json.loads((ROOT / "packages/lab-engine/labs/capacitor/lab.json").read_text(encoding="utf-8"))
    payload = {key: config[key] for key in ("model_version", "dataset_version")}
    with TestClient(app()) as client:
        result = client.post("/api/v1/verification/labs/capacitor", json=payload | {"parameters": config["defaults"], "elapsed_s": 1}).json()
    assert result["status"] == "INVALID" and result["code"] == "SIMULATION_TIME_MISMATCH"
    assert result["preview"] is None and result["facts"] == {}
