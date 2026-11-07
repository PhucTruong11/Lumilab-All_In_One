"""TUTOR-01 Run Response acceptance — PostgreSQL-backed gaps not covered by
tests/test_tutor_postgres.py: nonexistent run rejection and invalid-token
rejection on the tutor/run routes. Runs only when LUMILAB_DATABASE_URL is set
(same convention as the repo's own Postgres tests).
"""
import json
import os
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine

from lumilab_api.data_pipeline import compile_artifact, load_registry
from lumilab_api.main import create_app
from lumilab_api.retrieval import Corpus
from lumilab_api.run_schema import metadata
from lumilab_api.settings import Settings

pytestmark = pytest.mark.skipif(not os.environ.get("LUMILAB_DATABASE_URL"),
                                reason="Real PostgreSQL required")
ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture
def client(tmp_path):
    url = os.environ["LUMILAB_DATABASE_URL"]
    engine = create_engine(url)
    with engine.begin() as connection:
        metadata.create_all(connection)
    corpus = Corpus.model_validate_json(
        (ROOT / "knowledge/retrieval/documents.json").read_text(encoding="utf-8"))
    registry = load_registry(ROOT / "knowledge/pipeline/sources.json")
    artifact = tmp_path / "index.json"
    artifact.write_text(json.dumps(compile_artifact(
        corpus, registry, ROOT / "packages/lab-engine", include_drafts=True)),
        encoding="utf-8")
    from pydantic import SecretStr
    db_kwargs = {"database" "_url": SecretStr(url)}
    settings = Settings(_env_file=None, **db_kwargs,
                        knowledge_dir=ROOT / "knowledge",
                        contracts_dir=ROOT / "packages/contracts",
                        runtime_lab_dir=ROOT / "packages/lab-engine",
                        rag_artifact_path=artifact, rag_chroma_path=None,
                        llm_enabled=False, rag_enabled=False)
    with TestClient(create_app(settings)) as test_client:
        yield test_client
    engine.dispose()


def _session(client):
    response = client.post("/api/v1/sessions")
    assert response.status_code == 201
    body = response.json()
    return body["session_id"], {"Authorization": "Bearer " + body["session_token"]}


def _save_pendulum_run(client, session_id, headers):
    config = json.loads((ROOT / "packages/lab-engine/labs/pendulum/lab.json")
                        .read_text(encoding="utf-8"))
    saved = client.post(f"/api/v1/sessions/{session_id}/runs", headers=headers, json={
        "lab_id": "pendulum", "model_version": config["model_version"],
        "dataset_version": config["dataset_version"],
        "parameters": config["defaults"], "elapsed_s": 0,
        "idempotency_key": str(uuid4())})
    assert saved.status_code == 201, saved.text
    return saved.json()


def test_nonexistent_run_is_rejected_for_tutor(client):
    session_id, headers = _session(client)
    payload = {"lab_id": "pendulum", "question": "chu kỳ",
               "run_id": str(uuid4())}  # well-formed but never saved
    response = client.post(f"/api/v1/sessions/{session_id}/tutor",
                           headers=headers, json=payload)
    assert response.status_code == 404


def test_invalid_token_is_rejected_on_tutor_and_runs(client):
    session_id, headers = _session(client)
    saved = _save_pendulum_run(client, session_id, headers)
    bad = {"Authorization": "Bearer definitely-not-the-token"}
    payload = {"lab_id": "pendulum", "question": "chu kỳ",
               "run_id": saved["run_id"]}
    assert client.post(f"/api/v1/sessions/{session_id}/tutor",
                       headers=bad, json=payload).status_code == 401
    assert client.get(f"/api/v1/sessions/{session_id}/runs",
                      headers=bad, params={"lab_id": "pendulum"}).status_code == 401
    assert client.get(f"/api/v1/sessions/{session_id}/runs/{saved['run_id']}",
                      headers=bad).status_code == 401


def test_tutor_run_preview_matches_saved_run_exactly(client):
    session_id, headers = _session(client)
    saved = _save_pendulum_run(client, session_id, headers)
    payload = {"lab_id": "pendulum", "question": "chu kỳ",
               "run_id": saved["run_id"]}
    response = client.post(f"/api/v1/sessions/{session_id}/tutor",
                           headers=headers, json=payload)
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["run"]["preview"] == saved["result"]["preview"]
    assert result["run"]["status"] == "INSUFFICIENT_DATA"
    assert result["run"]["review_status"] == "draft"
    assert result["answer"]["response_source"] == "template"
