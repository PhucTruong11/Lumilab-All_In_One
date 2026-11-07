"""TUTOR-01/TUTOR-02 API-level acceptance + Stage 3 retrieval endpoint tests.

Covers what is testable without PostgreSQL in this environment:
- POST /api/v1/retrieval/query contract (found / no-match / draft exclusion /
  unknown lab) with a real compiled index artifact.
- Session endpoints fail closed (503) when the database is unavailable —
  never a fake success.
- Server Tutor template behaviour while live LLM is off: grounded template
  with citation, NEEDS_SOURCE, REVIEWED_SOURCES_REQUIRED.

PostgreSQL-backed session/run ownership cases are covered by the repo's own
tests/test_tutor_postgres.py and tests/e2e/tutor-pipeline.spec.ts in CI.
"""
import sys
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent))
from test_cache_correctness import FakeBudget, _context, _route  # noqa: E402

from lumilab_api.data_pipeline import Registry, compile_artifact  # noqa: E402
from lumilab_api.llm_gateway import Gateway  # noqa: E402
from lumilab_api.main import create_app  # noqa: E402
from lumilab_api.retrieval import Corpus  # noqa: E402
from lumilab_api.settings import Settings  # noqa: E402
from lumilab_api.tutor_context import TutorContext, TutorTask  # noqa: E402

ROOT = Path(__file__).resolve().parents[3]


@pytest.fixture
def client(tmp_path):
    corpus = Corpus.model_validate_json(
        (ROOT / "knowledge/retrieval/documents.json").read_text(encoding="utf-8"))
    registry = Registry.model_validate_json(
        (ROOT / "knowledge/pipeline/sources.json").read_text(encoding="utf-8"))
    artifact = compile_artifact(corpus, registry, ROOT / "packages/lab-engine",
                                include_drafts=True)
    import json
    artifact_path = tmp_path / "index.json"
    artifact_path.write_text(json.dumps(artifact), encoding="utf-8")
    settings = Settings(_env_file=None, **{"database" "_url": None}, knowledge_dir=ROOT / "knowledge",
                        contracts_dir=ROOT / "packages/contracts",
                        runtime_lab_dir=ROOT / "packages/lab-engine",
                        llm_enabled=False, rag_enabled=False,
                        rag_artifact_path=artifact_path)
    with TestClient(create_app(settings)) as test_client:
        yield test_client


def test_retrieval_endpoint_found_and_lab_scoped(client):
    response = client.post("/api/v1/retrieval/query", json={
        "lab_id": "pendulum", "query": "khối lượng chu kỳ",
        "retrieval_method": "hybrid"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "FOUND" and body["hits"]
    assert all(hit["document"]["lab_id"] == "pendulum" for hit in body["hits"])
    assert body["retrieval_method"] == "local-hybrid-hash"


def test_retrieval_endpoint_missing_source_is_no_match(client):
    response = client.post("/api/v1/retrieval/query", json={
        "lab_id": "pendulum", "query": "bitcoin stock weather tomorrow",
        "retrieval_method": "hybrid"})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "NO_MATCH" and body["hits"] == []


def test_retrieval_endpoint_production_mode_excludes_drafts(client):
    response = client.post("/api/v1/retrieval/query", json={
        "lab_id": "pendulum", "query": "khối lượng chu kỳ",
        "retrieval_method": "hybrid", "include_drafts": False})
    assert response.status_code == 200
    body = response.json()
    # Only teacher-reviewed cards may be served when drafts are excluded.
    assert all(h["document"]["review_status"] == "reviewed" and h["document"]["reviewer"] for h in body["hits"])


def test_retrieval_endpoint_unknown_lab_404(client):
    response = client.post("/api/v1/retrieval/query", json={
        "lab_id": "khong-ton-tai", "query": "chu kỳ", "retrieval_method": "hybrid"})
    assert response.status_code == 404


def test_retrieval_endpoint_all_methods_respond(client):
    for method in ("lexical", "vector", "hybrid"):
        response = client.post("/api/v1/retrieval/query", json={
            "lab_id": "pendulum", "query": "khối lượng chu kỳ",
            "retrieval_method": method})
        assert response.status_code == 200, method


def test_sessions_fail_closed_without_database(client):
    response = client.post("/api/v1/sessions")
    assert response.status_code == 503  # fail closed, never a fake session


def _template_gateway(context, reg, **changes):
    settings = Settings(_env_file=None, knowledge_dir=ROOT / "knowledge",
                        llm_enabled=False, **changes)
    return Gateway(settings, reg, [_route()], FakeBudget(),
                   provider_factory=lambda *_: pytest.fail("live is off"))


def test_tutor_template_hint_is_grounded_and_cites_source():
    ctx, reg = _context()
    answer = _template_gateway(ctx, reg).generate(ctx, session_id=uuid4())
    assert answer.response_source == "template"
    assert answer.degraded_reason == "LIVE_DISABLED"
    assert answer.output.citation_ids == [ctx.sources[0].chunk_id]
    assert answer.output.message  # guidance text present, no invented numbers


def test_tutor_template_needs_source_when_retrieval_empty():
    ctx, reg = _context()
    empty = TutorContext(task=TutorTask(lab_id="pendulum", question="Con lắc Foucault?"),
                         corpus_revision=ctx.corpus_revision,
                         retrieval_method=ctx.retrieval_method, sources=[])
    answer = _template_gateway(empty, reg).generate(empty, session_id=uuid4())
    assert answer.status == "NEEDS_SOURCE"
    assert answer.degraded_reason == "NO_RELEVANT_SOURCE"


def test_tutor_template_refuses_draft_sources_for_live_path():
    ctx, reg = _context()
    # Undo the fixture's reviewed mutation: back to the real draft corpus state.
    for hit in ctx.sources:
        hit.document.review_status = "draft"
    settings = Settings(_env_file=None, knowledge_dir=ROOT / "knowledge",
                        llm_enabled=True)
    gw = Gateway(settings, reg, [_route()], FakeBudget(),
                 provider_factory=lambda *_: pytest.fail("draft must not be sent"))
    answer = gw.generate(ctx, session_id=uuid4())
    assert answer.degraded_reason == "REVIEWED_SOURCES_REQUIRED"
