"""Public release identity and capability mapping; no credentials or provider calls."""
import hashlib
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class Practice(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    id: str = Field(min_length=1)
    primary: str = Field(min_length=1)
    title: str = Field(min_length=1)
    runtime_ids: list[str] = Field(min_length=1)

    @model_validator(mode="after")
    def valid_primary(self):
        if self.primary not in self.runtime_ids or len(set(self.runtime_ids)) != len(self.runtime_ids):
            raise ValueError("Practice primary/duplicate runtime mismatch")
        return self


class PracticeMap(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)
    schema_version: Literal["practice-map-1.0"]
    revision: str = Field(min_length=1)
    practices: list[Practice] = Field(min_length=1)
    tutor_pilot_runtime_ids: list[str]

    @model_validator(mode="after")
    def unique_mapping(self):
        ids = [p.id for p in self.practices]
        modes = [mode for p in self.practices for mode in p.runtime_ids]
        if len(ids) != len(set(ids)) or len(modes) != len(set(modes)):
            raise ValueError("Duplicate practice/runtime mapping")
        if len(self.tutor_pilot_runtime_ids) != len(set(self.tutor_pilot_runtime_ids)):
            raise ValueError("Duplicate Tutor pilot")
        return self


def load_practice_map(contracts_dir: Path) -> PracticeMap:
    return PracticeMap.model_validate_json((contracts_dir / "practice-map.json").read_text("utf-8"))


def validate_mapping(mapping: PracticeMap, runtime_labs):
    active = {key for key, lab in runtime_labs.items() if lab.lifecycle == "active"}
    mapped = {key for p in mapping.practices for key in p.runtime_ids}
    if active != mapped or not set(mapping.tutor_pilot_runtime_ids) <= set(runtime_labs):
        raise ValueError("Practice/Tutor mapping does not match runtime catalog")


class RuntimeVersion(BaseModel):
    id: str
    lifecycle: Literal["active", "archived"]
    model_version: str
    dataset_version: str
    tutor_pilot: bool


class RetrievalVersion(BaseModel):
    available: bool
    fingerprint: str | None
    corpus_revision: str | None
    embedding_id: str | None
    matches_corpus: bool


class SystemInfo(BaseModel):
    schema_version: Literal["system-info-1.0"] = "system-info-1.0"
    git_sha: str
    mapping: PracticeMap
    mapping_fingerprint: str
    runtime_fingerprint: str
    runtimes: list[RuntimeVersion]
    corpus_revision: str
    registry_revision: str
    retrieval: RetrievalVersion


def system_info(config, mapping, runtime_labs, registry, index) -> SystemInfo:
    versions = [RuntimeVersion(id=key, lifecycle=lab.lifecycle, model_version=lab.model_version,
        dataset_version=lab.dataset_version, tutor_pilot=key in mapping.tutor_pilot_runtime_ids)
        for key, lab in sorted(runtime_labs.items())]
    identity = [[r.id, r.lifecycle, r.model_version, r.dataset_version] for r in versions]
    fingerprint = hashlib.sha256(json.dumps(identity, separators=(",", ":")).encode()).hexdigest()
    corpus_revision = json.loads((config.knowledge_dir / "retrieval/documents.json").read_text("utf-8"))["revision"]
    artifact = index.artifact if index else {}
    return SystemInfo(git_sha=config.build_sha, mapping=mapping,
        mapping_fingerprint=hashlib.sha256((config.contracts_dir / "practice-map.json").read_bytes()).hexdigest(),
        runtime_fingerprint=fingerprint,
        runtimes=versions, corpus_revision=corpus_revision, registry_revision=registry.revision,
        retrieval=RetrievalVersion(available=index is not None,
            fingerprint=index.fingerprint if index else None,
            corpus_revision=artifact.get("corpus_revision"), embedding_id=artifact.get("embedding_id"),
            matches_corpus=index is not None and artifact.get("corpus_revision") == corpus_revision))


class WebBuildInfo(BaseModel):
    schema_version: Literal["web-build-1.0"] = "web-build-1.0"
    git_sha: str
    mapping_revision: str
    mapping_fingerprint: str
    runtime_fingerprint: str
