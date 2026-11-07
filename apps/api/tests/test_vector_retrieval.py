"""Offline vector foundation checks. Optional adapters use fakes, not downloaded models."""

import json
import math
import sys
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from lumilab_api.retrieval import retrieval_router
from lumilab_api.vector_index import (
    HashEmbedding,
    LocalVectorIndex,
    MemoryVectorStore,
    SentenceTransformerEmbedding,
    VectorConfig,
    VectorUnavailable,
)


def card(key, text, *, lab="circuit", reviewed=False):
    return {
        "id": key, "lab_id": lab, "title": "Thẻ học tập", "text": text,
        "keywords": [], "review_status": "reviewed" if reviewed else "draft",
        "reviewer": "Fixture reviewer" if reviewed else None,
        "reviewed_at": "2026-11-04" if reviewed else None,
        "origin": "project-authored", "external_material_use": "reference-only",
        "references": [{"label": "Fixture reference", "url": "https://example.org/reference"}],
        "assumptions": ["Test fixture, not scientific evidence"],
    }


def client_for(tmp_path, cards, config=None):
    folder = tmp_path / "retrieval"
    folder.mkdir(exist_ok=True)
    (folder / "documents.json").write_text(json.dumps({
        "revision": "test-v1", "documents": cards,
    }), encoding="utf-8")
    app = FastAPI()
    app.include_router(retrieval_router(tmp_path, {"circuit", "pendulum"}, config))
    return TestClient(app)


def test_hash_vectors_are_deterministic_normalized_and_accent_insensitive():
    first = HashEmbedding().encode(["Điện trở", "dien tro", "la va"])
    assert first == HashEmbedding().encode(["Điện trở", "dien tro", "la va"])
    assert first[0] == first[1]
    assert math.sqrt(sum(value * value for value in first[0])) == pytest.approx(1)
    assert not any(first[2])


def test_memory_store_uses_cosine_and_filters_before_top_k():
    store = MemoryVectorStore({"other": [1, 0], "allowed": [1, 1], "far": [0, 1]})
    rows = store.rank([10, 0], {"allowed", "far"}, 1)
    assert rows[0][1] == "allowed"
    assert rows[0][0] == pytest.approx(1 / math.sqrt(2))
    with pytest.raises(VectorUnavailable):
        store.rank([1, 0, 0], {"allowed"}, 1)
    with pytest.raises(VectorUnavailable):
        MemoryVectorStore({"broken": [float("nan")]})


def test_vector_query_preserves_sources_filters_and_never_verifies(tmp_path):
    cards = [
        card("draft", "Điện trở và dòng điện."),
        card("reviewed", "Điện trở của dây dẫn.", reviewed=True),
        card("other", "Điện trở", lab="pendulum"),
    ]
    with client_for(tmp_path, cards) as client:
        query = {"lab_id": "circuit", "query": "điện trở", "retrieval_method": "vector"}
        result = client.post("/api/v1/retrieval/query", json=query).json()
        assert result["retrieval_method"] == "local-hash-vector"
        assert result["embedding_id"] == "token-hash-v1-512"
        assert result["index_revision"]
        assert {hit["document"]["id"] for hit in result["hits"]} == {"draft", "reviewed"}
        draft = next(hit for hit in result["hits"] if hit["document"]["id"] == "draft")
        assert draft["document"]["review_status"] == "draft"
        assert draft["document"]["references"][0]["url"] == "https://example.org/reference"
        assert "VERIFIED" not in json.dumps(result)
        reviewed = client.post("/api/v1/retrieval/query", json=query | {
            "include_drafts": False,
        }).json()
        assert [hit["document"]["id"] for hit in reviewed["hits"]] == ["reviewed"]
        empty = client.post("/api/v1/retrieval/query", json=query | {"query": "xyzunknown"})
        assert empty.json()["status"] == "NO_MATCH"
        assert client.post("/api/v1/retrieval/query", json=query | {
            "lab_id": "absent",
        }).status_code == 404
        assert client.post("/api/v1/retrieval/query", json=query | {
            "retrieval_method": "remote",
        }).status_code == 422


def test_lexical_remains_available_with_missing_optional_vector_config(tmp_path):
    config = VectorConfig(embedder="sentence-transformers", model_path=tmp_path / "missing")
    with client_for(tmp_path, [card("one", "Điện trở")], config) as client:
        query = {"lab_id": "circuit", "query": "điện trở"}
        assert client.post("/api/v1/retrieval/query", json=query).json()[
            "retrieval_method"
        ] == "local-lexical"
        assert client.post("/api/v1/retrieval/query", json=query | {
            "retrieval_method": "vector",
        }).status_code == 503


def test_index_revision_includes_corpus_content_revision_and_embedder():
    config = VectorConfig()
    first = LocalVectorIndex({"a": "Điện trở"}, "v1", config)
    changed = LocalVectorIndex({"a": "Điện áp"}, "v1", config)
    revised = LocalVectorIndex({"a": "Điện trở"}, "v2", config)
    dimension = LocalVectorIndex({"a": "Điện trở"}, "v1", config, HashEmbedding(1024))
    assert len({obj.fingerprint for obj in [first, changed, revised, dimension]}) == 4
    with pytest.raises(VectorUnavailable):
        LocalVectorIndex({"a": "x", "b": "y"}, "v1", VectorConfig(max_chunks=1))


def test_semantic_provider_is_pluggable_without_lexical_overlap():
    class FakeSemanticEmbedding:
        id = "fixture-semantic-v1"
        semantic = True

        def encode(self, texts):
            return [[1.0, 0.0] if text in {"heavy", "mass"} else [0.0, 1.0] for text in texts]

    index = LocalVectorIndex(
        {"mass": "mass", "other": "voltage"}, "v1", VectorConfig(), FakeSemanticEmbedding(),
    )
    assert index.method == "local-semantic-vector"
    assert index.rank("heavy", {"mass", "other"}, 1) == [(1.0, "mass")]


def test_sentence_transformer_adapter_is_local_only(tmp_path, monkeypatch):
    observed = {}

    class FakeModel:
        def __init__(self, path, **kwargs):
            observed.update(path=path, **kwargs)

        def encode(self, texts, **kwargs):
            observed["encode"] = kwargs
            return [SimpleNamespace(tolist=lambda: [3.0, 4.0]) for _ in texts]

    monkeypatch.setitem(sys.modules, "sentence_transformers", SimpleNamespace(
        SentenceTransformer=FakeModel,
    ))
    provider = SentenceTransformerEmbedding(tmp_path, "fixture-v1")
    assert provider.encode(["test"])[0] == pytest.approx([0.6, 0.8])
    assert observed["local_files_only"] is True
    assert observed["trust_remote_code"] is False
    assert observed["device"] == "cpu"
    assert observed["encode"]["normalize_embeddings"] is True
    with pytest.raises(VectorUnavailable):
        SentenceTransformerEmbedding(tmp_path, "")


def test_chroma_adapter_uses_explicit_vectors_and_prefilter(tmp_path, monkeypatch):
    observed = {}

    class FakeCollection:
        def upsert(self, **kwargs):
            observed["upsert"] = kwargs

        def query(self, **kwargs):
            observed["query"] = kwargs
            return {"ids": [["allowed"]], "distances": [[0.25]]}

    class FakeClient:
        def __init__(self, **kwargs):
            observed["client"] = kwargs

        def get_or_create_collection(self, **kwargs):
            observed["collection"] = kwargs
            return FakeCollection()

    monkeypatch.setitem(sys.modules, "chromadb", SimpleNamespace(
        PersistentClient=FakeClient, config=SimpleNamespace(Settings=lambda **kwargs: kwargs),
    ))
    index = LocalVectorIndex({"allowed": "điện trở", "excluded": "con lắc"}, "v1", VectorConfig(
        store="chroma", chroma_path=tmp_path,
    ))
    assert index.rank("điện trở", {"allowed"}) == [(0.75, "allowed")]
    assert observed["collection"]["embedding_function"] is None
    assert observed["collection"]["name"].endswith(index.fingerprint)
    assert observed["query"]["where"] == {"chunk_id": {"$in": ["allowed"]}}
    assert "query_embeddings" in observed["query"] and "query_texts" not in observed["query"]
    assert observed["client"]["settings"]["anonymized_telemetry"] is False
