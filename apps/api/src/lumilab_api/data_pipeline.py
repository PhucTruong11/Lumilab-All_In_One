"""Source rights, reproducible conversion and build-time retrieval artifacts.

No URL fetching or reviewer fabrication. External input is converted only after
an explicit source-use decision in the repository's registry.
"""
import hashlib
import json
import re
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, model_validator

from .retrieval import Corpus


class Source(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(pattern=r"^[a-z0-9-]+$")
    title: str
    url: HttpUrl
    license: str
    license_url: HttpUrl | None
    commit: str | None = Field(pattern=r"^[0-9a-f]{40}$")
    accessed_at: date
    kind: Literal["external", "project-authored"]
    rights_status: Literal["pending", "internal", "approved", "rejected"]
    allowed_uses: list[Literal["convert", "index", "send_llm", "commercial"]]
    reviewer: str | None
    reviewed_at: date | None
    purpose: str
    restrictions: list[str]

    @model_validator(mode="after")
    def approval(self):
        if self.rights_status == "approved" and (
            not self.reviewer or not self.reviewer.strip() or not self.reviewed_at
        ):
            raise ValueError("Rights approval needs a real reviewer and date")
        if self.kind == "external" and not self.commit:
            raise ValueError("External source needs a pinned commit")
        if self.rights_status in {"pending", "rejected"} and self.allowed_uses:
            raise ValueError("Pending/rejected sources cannot authorize ingestion")
        return self

    def permits(self, operation: str, commercial: bool = False, draft: bool = False) -> bool:
        accepted = self.rights_status == "approved" or (
            draft and self.kind == "project-authored" and self.rights_status == "internal"
        )
        return accepted and operation in self.allowed_uses and (
            not commercial or ("commercial" in self.allowed_uses and "NC" not in self.license)
        )


class Registry(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: Literal["source-registry-1.0"]
    revision: str
    curriculum: dict
    mvp_lab_ids: list[str]
    sources: list[Source]

    @model_validator(mode="after")
    def unique(self):
        if len({s.id for s in self.sources}) != len(self.sources):
            raise ValueError("Duplicate source IDs")
        return self

    def source(self, source_id: str) -> Source:
        return next(s for s in self.sources if s.id == source_id)


def load_registry(path: Path) -> Registry:
    return Registry.model_validate_json(path.read_text(encoding="utf-8"))


def digest(value) -> str:
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                    separators=(",", ":")).encode()).hexdigest()


def convert_section(text: str, *, source: Source, metadata: dict, cnxml: bool = False) -> str:
    if not source.permits("convert"):
        raise ValueError("SOURCE_CONVERSION_NOT_APPROVED")
    if len(text) > 2_000_000 or "<!ENTITY" in text or "<!DOCTYPE" in text:
        raise ValueError("Unsupported or oversized source document")
    if cnxml:
        root = ET.fromstring(text)
        parts = []
        for element in root.iter():
            tag = element.tag.split("}")[-1]
            if tag in {"title", "para", "equation"}:
                content = " ".join("".join(element.itertext()).split())
                if content:
                    parts.append(("## " if tag == "title" else "") + content)
        text = "\n\n".join(parts)
    header = {**metadata, "source_id": source.id, "source_url": str(source.url),
              "license": source.license, "commit": source.commit, "content_sha256": digest(text.strip())}
    # JSON front matter is unambiguous and escapes untrusted metadata/newlines.
    return "<!-- lumilab-metadata " + json.dumps(header, ensure_ascii=False) + " -->\n\n" + text.strip() + "\n"


def chunk_text(text: str, max_tokens: int = 300, overlap: int = 30) -> list[str]:
    """Deterministic whitespace-token approximation, not provider-token count."""
    if not 200 <= max_tokens <= 400 or not 0 <= overlap < max_tokens:
        raise ValueError("Unsupported chunk configuration")
    chunks = []
    # Preserve section/paragraph boundaries; split long paragraphs with bounded overlap.
    for paragraph in re.split(r"\n\s*\n", text.strip()):
        words = paragraph.split()
        for start in range(0, len(words), max_tokens - overlap):
            chunks.append(" ".join(words[start:start + max_tokens]))
            if start + max_tokens >= len(words):
                break
    return [chunk for chunk in chunks if chunk]


def section_blocks(text: str, max_chars: int = 3500) -> list[str]:
    """Split approved long sections into bounded draft records; never truncate."""
    blocks, current = [], ""
    for token in text.split():
        if len(token) > max_chars:
            raise ValueError("UNSUPPORTED_LONG_SOURCE_TOKEN")
        if current and len(current) + 1 + len(token) > max_chars:
            blocks.append(current.strip())
            current = ""
        current = current + " " + token if current else token
    if current.strip():
        blocks.append(current.strip())
    return blocks


def lint_corpus(corpus: Corpus, registry: Registry, lab_root: Path, strict: bool = False) -> list[dict]:
    issues = []
    known_units = {"m/s^2", "ohm", "mL", "mol/L", "degC", "(mol/L)^2"}
    for doc in corpus.documents:
        if not (lab_root / "labs" / doc.lab_id / "lab.json").is_file():
            raise ValueError("Unknown lab in corpus")
        meta = doc.provenance
        if meta is None:
            issues.append({"document": doc.id, "code": "PROVENANCE_REQUIRED"})
            continue
        source = registry.source(meta.source_id)
        if not source.permits("index", draft=not strict):
            issues.append({"document": doc.id, "code": "SOURCE_INDEX_NOT_APPROVED"})
        if doc.origin != source.kind:
            raise ValueError("Document/source origin mismatch")
        if meta.commit != source.commit or meta.license != source.license:
            raise ValueError("Document/source revision or license mismatch")
        authority_count = len({ref.authority for ref in doc.references if ref.authority})
        if doc.review_status == "draft" and authority_count < 2:
            issues.append({"document": doc.id, "code": "SECOND_INDEPENDENT_SOURCE_PENDING", "severity": "warning"})
        if doc.review_status != "draft" and authority_count < 2:
            raise ValueError("Cross-checked/reviewed claim needs two independent source authorities")
        if strict and doc.review_status != "reviewed":
            issues.append({"document": doc.id, "code": "ACADEMIC_REVIEW_REQUIRED"})
        config = json.loads((lab_root / "labs" / doc.lab_id / "lab.json").read_text(encoding="utf-8"))
        for key, constant in meta.constants.items():
            if key not in config.get("constants", {}) or constant != config["constants"][key]:
                raise ValueError("Claim constant conflicts with lab.json defaults: " + key)
        for key, unit in meta.units.items():
            if config.get("constant_units", {}).get(key) != unit or unit not in known_units:
                raise ValueError("Claim unit conflicts with lab.json: " + key)
        if meta.equation:
            from .scientific_checks import equation_is_balanced
            if not equation_is_balanced(meta.equation["reactants"], meta.equation["products"]):
                raise ValueError("Unbalanced corpus equation")
    return issues


def compile_artifact(corpus: Corpus, registry: Registry, lab_root: Path, *,
                     include_drafts: bool = False, commercial: bool = False,
                     provider=None, max_tokens: int = 300) -> dict:
    from .bm25_index import BM25Index
    from .vector_index import HashEmbedding
    lint_corpus(corpus, registry, lab_root, strict=not include_drafts)
    provider = provider or HashEmbedding()
    chunks = []
    for doc in sorted(corpus.documents, key=lambda item: item.id):
        if doc.provenance is None or (not include_drafts and doc.review_status != "reviewed"):
            continue
        source = registry.source(doc.provenance.source_id)
        if not source.permits("index", commercial=commercial, draft=include_drafts):
            continue
        chunker = getattr(provider, "chunk_text", None)
        contents = chunker(doc.text, max_tokens) if chunker else chunk_text(doc.text, max_tokens=max_tokens)
        for index, content in enumerate(contents):
            item = doc.model_copy(update={"text": content})
            chunks.append({"chunk_id": f"{doc.id}:{index}", "document": item.model_dump(mode="json"),
                           "content_hash": digest(content)})
    vectors = getattr(provider, "encode_documents", provider.encode)([item["document"]["text"] for item in chunks])
    if len(vectors) != len(chunks):
        raise ValueError("Embedding count mismatch")
    artifact = {"schema_version": "retrieval-artifact-1.0", "corpus_revision": corpus.revision,
                "registry_revision": registry.revision, "registry_hash": digest(registry.model_dump(mode="json")),
                "embedding_id": provider.id, "semantic": provider.semantic,
                "include_drafts": include_drafts, "commercial": commercial,
                "tokenizer": provider.id if getattr(provider, "chunk_text", None) else "whitespace-estimate-v1", "max_tokens": max_tokens,
                "bm25": BM25Index.build({c["chunk_id"]: " ".join([c["document"]["title"],
                    c["document"]["text"], *c["document"]["keywords"]]) for c in chunks}).data,
                "chunks": chunks, "vectors": vectors}
    artifact["fingerprint"] = digest(artifact)
    return artifact
