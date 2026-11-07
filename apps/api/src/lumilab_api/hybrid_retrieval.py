"""Deterministic BM25/RRF over a fingerprinted build artifact; no runtime upserts."""
import json
import math
from collections import Counter
from pathlib import Path

from .bm25_index import BM25Index
from .data_pipeline import Registry, digest
from .retrieval import Document, Hit, RetrievalQuery, RetrievalResponse
from .retrieval_terms import PROFILE
from .vector_index import (
    HashEmbedding,
    MemoryVectorStore,
    VectorUnavailable,
    normalized,
)


def bm25(query: str, documents: dict[str, str]) -> list[tuple[float, str]]:
    return BM25Index.build(documents).rank(query, set(documents))


class CompiledIndex:
    def __init__(self, artifact: dict, registry: Registry, *, provider=None, chroma_path: Path | None = None,
                 min_cosine: float = .12, min_bm25: float = .05):
        artifact = json.loads(json.dumps(artifact, allow_nan=False))
        fingerprint = artifact.pop("fingerprint")
        if digest(artifact) != fingerprint or artifact["schema_version"] != "retrieval-artifact-1.0":
            raise ValueError("Index artifact integrity mismatch")
        if artifact["registry_hash"] != digest(registry.model_dump(mode="json")):
            raise ValueError("Stale source rights registry; rebuild index")
        if not 0 <= min_cosine <= 1 or min_bm25 < 0:
            raise ValueError("Invalid retrieval threshold")
        if not isinstance(artifact["chunks"], list) or not isinstance(artifact["vectors"], list):
            raise ValueError("Artifact arrays required")
        self.fingerprint, self.registry, self.artifact = fingerprint, registry, artifact
        self.provider = provider or HashEmbedding()
        if self.provider.id != artifact["embedding_id"] or self.provider.semantic != artifact["semantic"]:
            raise ValueError("Query/index embedding model revision mismatch")
        self.docs = {}
        vectors = {}
        if len(artifact["chunks"]) != len(artifact["vectors"]) or len(artifact["chunks"]) > 10000:
            raise ValueError("Invalid artifact chunk/vector count")
        for chunk, vector in zip(artifact["chunks"], artifact["vectors"], strict=True):
            key = chunk["chunk_id"]
            doc = Document.model_validate(chunk["document"])
            if key in self.docs or digest(doc.text) != chunk["content_hash"] or doc.provenance is None:
                raise ValueError("Duplicate, missing metadata or changed artifact chunk")
            source = registry.source(doc.provenance.source_id)
            if (doc.origin != source.kind or doc.provenance.commit != source.commit
                    or doc.provenance.license != source.license):
                raise ValueError("Artifact source identity mismatch")
            self.docs[key] = doc
            vectors[key] = normalized(vector)
        self.store = MemoryVectorStore(vectors)
        # Old artifacts require an explicit rebuild; no lazy indexing on requests.
        if "bm25" not in artifact:
            raise ValueError("BM25 build artifact required; rebuild index")
        self.bm25 = BM25Index(artifact["bm25"])
        if self.bm25.profile != PROFILE:
            raise ValueError('Stale lexical profile; rebuild index')
        if set(self.bm25.lengths) != set(self.docs):
            raise ValueError("BM25/vector document IDs differ")
        self.collection = None
        if chroma_path is not None:
            import chromadb
            self.client = chromadb.PersistentClient(path=str(chroma_path),
                settings=chromadb.config.Settings(anonymized_telemetry=False))
            # Read existing collection only: never get_or_create/upsert at runtime.
            self.collection = self.client.get_collection(name="lumilab-" + fingerprint[:32], embedding_function=None)
        self.min_cosine, self.min_bm25 = min_cosine, min_bm25

    @classmethod
    def load(cls, path: Path, registry: Registry, **kwargs):
        if path.stat().st_size > 32_000_000:
            raise ValueError("Oversized index")
        return cls(json.loads(path.read_text(encoding="utf-8")), registry, **kwargs)

    def eligible(self, query: RetrievalQuery) -> dict:
        candidates = {}
        for key, doc in self.docs.items():
            meta = doc.provenance
            if (doc.lab_id != query.lab_id or meta.level != query.level
                    or (not query.include_drafts and doc.review_status != "reviewed")):
                continue
            if self.registry.source(meta.source_id).permits("index", query.commercial, query.include_drafts):
                candidates[key] = doc
        return candidates

    def retrieve(self, query: RetrievalQuery) -> RetrievalResponse:
        candidates = self.eligible(query)
        lexical = self.bm25.rank(query.query, set(candidates))
        lexical_scores = dict((key, score) for score, key in lexical)
        semantic = []
        if candidates:
            vector = getattr(self.provider, "encode_query", self.provider.encode)([query.query])
            if len(vector) != 1:
                raise VectorUnavailable("Query embedding count mismatch")
            if self.collection is None:
                semantic = self.store.rank(vector[0], set(candidates), len(candidates))
            else:
                result = self.collection.query(query_embeddings=[normalized(vector[0])],
                    n_results=len(candidates), where={"chunk_id": {"$in": sorted(candidates)}}, include=["distances"])
                semantic = [(1 - d, key) for key, d in zip(result["ids"][0], result["distances"][0], strict=True)
                            if key in candidates and math.isfinite(d)]
        vector_scores = dict((key, score) for score, key in semantic)
        fused = Counter()
        lexical = [(score, key) for score, key in lexical if score >= self.min_bm25 and
            self.bm25.coverage(query.query, key) >= .4]
        # A generic word or high cosine alone cannot establish topic relevance.
        # The same bilingual vocabulary is used for query and build-time postings.
        # Hash cosine is lexical similarity, not semantic evidence. It must not
        # reintroduce a document rejected for insufficient lexical coverage.
        semantic = [(score, key) for score, key in semantic if score >= self.min_cosine
            and (self.bm25.coverage(query.query, key) > 0 if self.provider.semantic
                 else self.bm25.coverage(query.query, key) >= .4)]
        for ranking in (lexical, semantic):
            for rank, (_, key) in enumerate(ranking):
                if (lexical_scores.get(key, 0) >= self.min_bm25 or
                        (self.provider.semantic and vector_scores.get(key, 0) >= self.min_cosine)):
                    fused[key] += 1 / (60 + rank + 1)
        hits = [Hit(chunk_id=key, document=candidates[key], score=round(score, 8))
                for key, score in sorted(fused.items(), key=lambda row: (-row[1], row[0]))[:3]]
        return RetrievalResponse(corpus_revision=self.artifact["corpus_revision"],
            retrieval_method="local-hybrid-semantic" if self.provider.semantic else "local-hybrid-hash",
            embedding_id=self.provider.id, index_revision=self.fingerprint,
            threshold=self.min_cosine, status="FOUND" if hits else "NO_MATCH", hits=hits)
