"""Lab-scope isolation regression tests (RAG-02 audit, main 8f18b041).

The audit verified that lab isolation is enforced by construction, not by
prompt instructions:

- `CompiledIndex.eligible` and both fallback paths in the retrieval router
  filter candidates by `lab_id` BEFORE ranking, for every method.
- `build_tutor_context` revalidates every hit and rejects a response whose
  document lab differs from the task lab.

These tests pin that behavior at the HTTP boundary for all three retrieval
methods, plus the poisoned-context rejection, so a future refactor cannot
silently turn lab scope into a ranking preference.
"""
from pathlib import Path
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from lumilab_api.data_pipeline import Registry, compile_artifact
from lumilab_api.hybrid_retrieval import CompiledIndex
from lumilab_api.retrieval import (
    Corpus,
    RetrievalQuery,
    RetrievalResponse,
    retrieval_router,
)
from lumilab_api.tutor_context import TutorContextError, TutorTask, build_tutor_context

ROOT = Path(__file__).resolve().parents[3]

# (requested lab, question whose topic belongs to another lab)
PROBES = [
    ("pendulum", "Độ cứng lò xo k ảnh hưởng chu kỳ dao động lò xo ra sao?"),
    ("chemistry", "Ampe kế mắc nối tiếp hay song song với đoạn mạch cần đo?"),
    ("spring", "Chiều dài dây con lắc tăng gấp bốn thì chu kỳ tăng mấy lần?"),
    ("circuit", "Chu kỳ con lắc phụ thuộc khối lượng không?"),
]


def _corpus_and_registry():
    corpus = Corpus.model_validate_json(
        (ROOT / "knowledge/retrieval/documents.json").read_text(encoding="utf-8"))
    registry = Registry.model_validate_json(
        (ROOT / "knowledge/pipeline/sources.json").read_text(encoding="utf-8"))
    return corpus, registry


def _index() -> CompiledIndex:
    corpus, registry = _corpus_and_registry()
    artifact = compile_artifact(corpus, registry, ROOT / "packages/lab-engine",
                                include_drafts=True)
    return CompiledIndex(artifact, registry)


def _client(index: CompiledIndex) -> TestClient:
    corpus, registry = _corpus_and_registry()
    app = FastAPI()
    app.include_router(retrieval_router(
        ROOT / "knowledge", {doc.lab_id for doc in corpus.documents},
        compiled_index=index, source_registry=registry))
    return TestClient(app)


@pytest.mark.parametrize("lab_id, question", PROBES)
@pytest.mark.parametrize("method", ["lexical", "vector", "hybrid"])
def test_query_never_returns_another_labs_documents(lab_id, question, method):
    client = _client(_index())
    response = client.post("/api/v1/retrieval/query", json={
        "lab_id": lab_id, "query": question, "retrieval_method": method})
    assert response.status_code == 200
    hit_labs = {hit["document"]["lab_id"] for hit in response.json()["hits"]}
    assert hit_labs <= {lab_id}, f"cross-lab leak via {method}: {hit_labs}"


def test_unknown_lab_is_rejected():
    client = _client(_index())
    response = client.post("/api/v1/retrieval/query", json={
        "lab_id": "no-such-lab", "query": "chu kỳ", "retrieval_method": "hybrid"})
    assert response.status_code == 404


class _NoRuns:
    def read_owned_run(self, session_id, run_id):
        return None


def test_context_assembly_rejects_foreign_lab_hit():
    index = _index()
    foreign = index.retrieve(RetrievalQuery(
        lab_id="spring", query="Độ cứng lò xo k ảnh hưởng chu kỳ dao động lò xo ra sao?",
        retrieval_method="hybrid"))
    assert foreign.hits, "probe needs at least one spring hit to poison the context"
    poisoned = RetrievalResponse(
        corpus_revision=foreign.corpus_revision,
        retrieval_method=foreign.retrieval_method, status="FOUND", hits=foreign.hits)
    with pytest.raises(TutorContextError, match="Source lab differs"):
        build_tutor_context(TutorTask(lab_id="pendulum", question="probe"),
                            poisoned, session_id=uuid4(), repository=_NoRuns())
