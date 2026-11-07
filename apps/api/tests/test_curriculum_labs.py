import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from lumilab_api import recompute as recompute_module
from lumilab_api.main import create_app

ROOT = Path(__file__).resolve().parents[3]
CASES = json.loads((ROOT / "tests/golden/curriculum-labs.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def client():
    with TestClient(create_app()) as instance:
        yield instance


@pytest.mark.parametrize("case", CASES, ids=[case["lab_id"] for case in CASES])
def test_curriculum_preview_matches_reference_case(client, case):
    lab = case["lab_id"]
    config = json.loads((ROOT / f"packages/lab-engine/labs/{lab}/lab.json").read_text(encoding="utf-8"))
    response = client.post(f"/api/v1/verification/labs/{lab}", json={
        "model_version": config["model_version"], "dataset_version": config["dataset_version"],
        "parameters": case["parameters"], "elapsed_s": case["elapsed_s"],
    })
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "INSUFFICIENT_DATA"
    assert result["code"] == "REVIEWED_EVIDENCE_REQUIRED"
    assert result["facts"] == {}
    assert {"server_recompute", "schema"} <= set(result["checks_passed"])
    if lab in {"alkali-water", "copper-nitric", "chlorine-bleach"}:
        assert "simulation" in result["checks_passed"]
        assert "quantitative" in result["checks_skipped"]
    for key, value in case["expected"].items():
        assert result["preview"][key] == (pytest.approx(value, abs=1e-9) if isinstance(value, (int, float)) else value)


@pytest.mark.parametrize("simulation_status", [None, "skipped"])
def test_qualitative_preview_requires_passing_simulation(client, monkeypatch, simulation_status):
    checks = [{"stage": "quantitative", "status": "skipped", "code": "QUALITATIVE_MODEL",
               "reason": "No quantities are inferred."}]
    if simulation_status is not None:
        checks.append({"stage": "simulation", "status": simulation_status, "code": "SKIPPED",
                       "reason": "The scenario was not checked."})
    monkeypatch.setattr(recompute_module, "check_science", lambda *_: checks)
    config = json.loads((ROOT / "packages/lab-engine/labs/alkali-water/lab.json")
                        .read_text(encoding="utf-8"))
    response = client.post("/api/v1/verification/labs/alkali-water", json={
        "model_version": config["model_version"], "dataset_version": config["dataset_version"],
        "parameters": config["defaults"],
    })
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "INSUFFICIENT_DATA"
    assert result["code"] == "SCIENTIFIC_CHECKS_INCOMPLETE"
    assert result["preview"] is None and result["facts"] == {} and result["evidence"] == []


def test_pulley_rejects_unsupported_strands(client):
    response = client.post("/api/v1/verification/labs/pulley", json={
        "model_version": "vertical-ideal-pulley-v1", "dataset_version": "lumilab-nine-draft-v1",
        "parameters": {"mass_kg": 10, "strands": 3, "lift_m": 1},
    })
    assert response.json()["status"] == "INVALID"
    assert response.json()["preview"] is None


@pytest.mark.parametrize(("lab", "elapsed", "changes"), [
    ("spring-damped", 1, {"time_s": 0.5}),
    ("spring-damped", 1, {"displacement_m": 0.1}),
    ("spring-damped", 1, {"envelope_m": 0.4}),
    ("inclined-plane", 1, {"time_s": 0.5}),
    ("inclined-plane", 1, {"state": "Đến cuối dốc"}),
    ("pulley", 0, {"pull_N": 1, "work_J": 1}),
    ("alkali-water", 0, {"detail": "Phản ứng tạo chất khác."}),
    ("copper-nitric", 0, {"detail": "Khí không xuất hiện."}),
    ("chlorine-bleach", 0, {"detail": "Giấy khô tẩy màu rõ."}),
])
def test_tampered_curriculum_reading_cannot_be_saved_as_preview(client, monkeypatch, lab, elapsed, changes):
    config = json.loads((ROOT / f"packages/lab-engine/labs/{lab}/lab.json")
                        .read_text(encoding="utf-8"))
    original = recompute_module.MODELS[lab]
    monkeypatch.setitem(recompute_module.MODELS, lab,
                        (original[0], lambda parameters, time: original[1](parameters, time) | changes))
    response = client.post(f"/api/v1/verification/labs/{lab}", json={
        "model_version": config["model_version"], "dataset_version": config["dataset_version"],
        "parameters": config["defaults"], "elapsed_s": elapsed,
    })
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "INVALID"
    assert result["preview"] is None
    assert result["facts"] == {} and result["evidence"] == []


@pytest.mark.parametrize("lab", ["spring-damped", "inclined-plane", "pulley", "alkali-water",
                                 "copper-nitric", "chlorine-bleach"])
def test_new_labs_retrieve_authored_drafts_only_when_enabled(client, lab):
    corpus = json.loads((ROOT / "knowledge/retrieval/documents.json").read_text(encoding="utf-8"))
    doc = next(doc for doc in corpus["documents"] if doc["lab_id"] == lab)
    body = {"lab_id": lab, "query": doc["keywords"][0], "include_drafts": True}
    found = client.post("/api/v1/retrieval/query", json=body).json()
    assert found["status"] == "FOUND"
    assert found["hits"][0]["document"]["review_status"] == "draft"
    assert client.post("/api/v1/retrieval/query", json=body | {"include_drafts": False}).json()["hits"] == []
