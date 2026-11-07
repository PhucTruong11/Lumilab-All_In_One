import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

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
    for key, value in case["expected"].items():
        assert result["preview"][key] == (pytest.approx(value, abs=1e-9) if isinstance(value, (int, float)) else value)


def test_pulley_rejects_unsupported_strands(client):
    response = client.post("/api/v1/verification/labs/pulley", json={
        "model_version": "vertical-ideal-pulley-v1", "dataset_version": "lumilab-nine-draft-v1",
        "parameters": {"mass_kg": 10, "strands": 3, "lift_m": 1},
    })
    assert response.json()["status"] == "INVALID"
    assert response.json()["preview"] is None


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
