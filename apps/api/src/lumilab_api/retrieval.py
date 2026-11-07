"""Local lexical/vector retrieval over authored cards with explicit provenance."""

import json
from datetime import date
from pathlib import Path
from threading import Lock
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

from .vector_index import LocalVectorIndex, VectorConfig, VectorUnavailable, tokens


class Reference(BaseModel):
    model_config = ConfigDict(extra="forbid")
    label: str = Field(min_length=1, max_length=300)
    url: HttpUrl
    authority: str | None = None

    @model_validator(mode="after")
    def https_only(self):
        if self.url.scheme != "https":
            raise ValueError("Reference requires HTTPS")
        return self


class Provenance(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    source_id: str
    book: str
    chapter: str
    section: str
    pages: str | None = None
    license: str
    commit: str | None
    source_language: str = "vi"
    level: Literal["THPT", "THCS"] = "THPT"
    curriculum_series: str = "Chân trời sáng tạo"
    curriculum_status: Literal["pending", "reviewed"] = "pending"
    curriculum_edition: str | None = None
    constants: dict[str, float] = Field(default_factory=dict)
    units: dict[str, str] = Field(default_factory=dict)
    conditions: dict[str, str] = Field(default_factory=dict)
    equation: dict[str, dict[str, int]] | None = None
    academic_review_role: Literal["teacher"] | None = None


class Document(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1, max_length=100)
    lab_id: str = Field(min_length=1, max_length=32)
    title: str = Field(min_length=1, max_length=200)
    text: str = Field(min_length=1, max_length=4000)
    keywords: list[str] = Field(max_length=30)
    review_status: Literal["draft", "cross_checked", "reviewed"]
    provenance: Provenance | None = None
    cross_checked_by: str | None = None
    cross_checked_at: date | None = None
    reviewer: str | None
    reviewed_at: date | None
    origin: Literal["project-authored", "external"]
    external_material_use: Literal["reference-only", "licensed-excerpt"]
    references: list[Reference] = Field(min_length=1, max_length=8)
    assumptions: list[str] = Field(min_length=1, max_length=12)

    @model_validator(mode="after")
    def reviewed_requires_signature(self):
        if self.review_status == "reviewed" and (
            not self.reviewer or not self.reviewer.strip() or not self.reviewed_at
        ):
            raise ValueError("Reviewed card needs reviewer and review date")
        if self.review_status == "cross_checked" and (
            not self.cross_checked_by or not self.cross_checked_by.strip() or not self.cross_checked_at):
            raise ValueError("Cross-check needs a reviewer and date")
        if self.review_status == "reviewed" and self.provenance and self.provenance.academic_review_role != "teacher":
            raise ValueError("New reviewed cards require teacher review")
        return self


class Corpus(BaseModel):
    model_config = ConfigDict(extra="forbid")
    revision: str = Field(min_length=1, max_length=100)
    documents: list[Document] = Field(max_length=1000)

    @model_validator(mode="after")
    def unique_ids(self):
        if len({doc.id for doc in self.documents}) != len(self.documents):
            raise ValueError("Duplicate document ID")
        return self


class RetrievalQuery(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    lab_id: str = Field(min_length=1, max_length=32)
    query: str = Field(min_length=1, max_length=800)
    include_drafts: bool = True
    retrieval_method: Literal["lexical", "vector", "hybrid"] = "lexical"
    level: Literal["THPT", "THCS"] = "THPT"
    commercial: bool = False


class Hit(BaseModel):
    chunk_id: str
    document: Document
    score: float | None = None


class RetrievalResponse(BaseModel):
    corpus_revision: str
    retrieval_method: Literal[
        "local-lexical", "local-hash-vector", "local-semantic-vector", "local-hybrid-hash", "local-hybrid-semantic",
    ] = "local-lexical"
    embedding_id: str | None = None
    index_revision: str | None = None
    threshold: float | None = None
    status: Literal["FOUND", "NO_MATCH"]
    hits: list[Hit]


def retrieval_router(
    knowledge_dir: Path, lab_ids: set[str], vector_config: VectorConfig | None = None,
    compiled_index=None, source_registry=None,
) -> APIRouter:
    corpus = Corpus.model_validate(json.loads(
        (knowledge_dir / "retrieval/documents.json").read_text(encoding="utf-8"),
    ))
    if any(doc.lab_id not in lab_ids for doc in corpus.documents):
        raise ValueError("Retrieval document refers to unknown lab")
    chunks = []
    for doc in corpus.documents:
        for index, paragraph in enumerate(doc.text.split("\n\n")):
            text = paragraph.strip()
            if text:
                chunks.append((f"{doc.id}:{index}", doc.model_copy(update={"text": text}),
                               tokens(" ".join([doc.title, text, *doc.keywords]))))

    router = APIRouter(prefix="/api/v1/retrieval", tags=["local retrieval"])
    vector_index: LocalVectorIndex | None = None
    vector_lock = Lock()
    config = vector_config or VectorConfig.from_env()

    def get_vector_index() -> LocalVectorIndex:
        nonlocal vector_index
        with vector_lock:
            if vector_index is None:
                texts = {key: " ".join([doc.title, doc.text, *doc.keywords])
                         for key, doc, _ in chunks}
                vector_index = LocalVectorIndex(texts, corpus.revision, config)
            return vector_index

    def usable(doc, payload):
        if doc.provenance is None:
            return doc.origin == "project-authored" and not payload.commercial
        if source_registry is None:
            return doc.origin == "project-authored" and not payload.commercial
        try:
            source = source_registry.source(doc.provenance.source_id)
        except StopIteration:
            return False
        return (source.commit == doc.provenance.commit and source.license == doc.provenance.license
                and source.kind == doc.origin and source.permits("index", payload.commercial, payload.include_drafts))

    @router.post("/query", response_model=RetrievalResponse)
    def query(payload: RetrievalQuery):
        if payload.lab_id not in lab_ids:
            raise HTTPException(404)
        if payload.retrieval_method == "hybrid":
            if compiled_index is None:
                raise HTTPException(503, detail="LOCAL_INDEX_UNAVAILABLE")
            return compiled_index.retrieve(payload)
        terms = tokens(payload.query)
        candidates = [(chunk_id, doc, words) for chunk_id, doc, words in chunks
                      if doc.lab_id == payload.lab_id and usable(doc, payload)
                      and (doc.provenance is None or doc.provenance.level == payload.level)
                      and (payload.include_drafts or doc.review_status == "reviewed")
                      and (doc.provenance is None or doc.provenance.level == payload.level)
                      and (not payload.commercial or (doc.provenance is not None and "NC" not in doc.provenance.license))]
        if payload.retrieval_method == "vector":
            try:
                index = get_vector_index()
                # Hash collisions cannot introduce hits lacking exact normalized overlap.
                allowed = {key for key, _, words in candidates
                           if terms and (index.provider.semantic or terms & words)}
                ranked_vectors = index.rank(payload.query, allowed)
                documents = {key: doc for key, doc, _ in candidates}
                hits = [Hit(chunk_id=key, document=documents[key], score=round(score, 8))
                        for score, key in ranked_vectors if score > 0.0 and key in documents]
            except (VectorUnavailable, OSError, RuntimeError, ValueError) as exc:
                # Do not silently claim vector results when a configured adapter fails.
                raise HTTPException(503, detail="LOCAL_VECTOR_UNAVAILABLE") from exc
            return RetrievalResponse(
                corpus_revision=corpus.revision, retrieval_method=index.method,
                embedding_id=index.provider.id, index_revision=index.fingerprint,
                status="FOUND" if hits else "NO_MATCH", hits=hits,
            )
        ranked = sorted(
            [(len(terms & words), chunk_id, doc) for chunk_id, doc, words in candidates],
            key=lambda row: (-row[0], row[1]),
        )
        hits = [Hit(chunk_id=chunk_id, document=doc)
                for score, chunk_id, doc in ranked[:3] if score > 0]
        return RetrievalResponse(
            corpus_revision=corpus.revision, status="FOUND" if hits else "NO_MATCH", hits=hits,
        )

    return router
