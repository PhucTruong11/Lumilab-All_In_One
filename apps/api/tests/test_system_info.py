import json
from copy import deepcopy
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from jsonschema import Draft202012Validator
from pydantic import SecretStr, ValidationError

from lumilab_api.data_pipeline import compile_artifact, load_registry
from lumilab_api.main import create_app
from lumilab_api.recompute import load_runtime_definitions
from lumilab_api.retrieval import Corpus
from lumilab_api.settings import Settings
from lumilab_api.system_info import PracticeMap, load_practice_map, validate_mapping

ROOT = Path(__file__).resolve().parents[3]


def test_system_contract_reports_actual_versions_without_credentials(tmp_path):
    corpus = Corpus.model_validate_json((ROOT / "knowledge/retrieval/documents.json").read_text("utf-8"))
    registry = load_registry(ROOT / "knowledge/pipeline/sources.json")
    artifact = tmp_path / "index.json"
    compiled = compile_artifact(corpus, registry, ROOT / "packages/lab-engine", include_drafts=True)
    artifact.write_text(json.dumps(compiled), encoding="utf-8")
    config = Settings(_env_file=None, build_sha="a" * 40, database_url=None,
        knowledge_dir=ROOT / "knowledge", contracts_dir=ROOT / "packages/contracts",
        runtime_lab_dir=ROOT / "packages/lab-engine", rag_artifact_path=artifact,
        llm_enabled=False, rag_enabled=False, gemini_api_key=SecretStr("must-not-escape"))
    with TestClient(create_app(config)) as client:
        response = client.get("/api/v1/system")
    assert response.status_code == 200
    data = response.json()
    schema = json.loads((ROOT / "packages/contracts/schemas/system-info.schema.json").read_text())
    Draft202012Validator(schema).validate(data)
    assert data["git_sha"] == "a" * 40 and "must-not-escape" not in response.text
    assert data["retrieval"]["fingerprint"] == compiled["fingerprint"]
    assert data["retrieval"]["matches_corpus"] and data["corpus_revision"] == corpus.revision
    assert len(data["mapping"]["practices"]) == 9
    assert sum(r["lifecycle"] == "active" for r in data["runtimes"]) == 12
    assert {r["id"] for r in data["runtimes"] if r["tutor_pilot"]} == {"pendulum", "circuit", "chemistry"}

    # An otherwise valid old artifact must be distinguishable from current source content.
    compiled["corpus_revision"] = "old-corpus"
    from lumilab_api.data_pipeline import digest
    compiled.pop("fingerprint")
    compiled["fingerprint"] = digest(compiled)
    artifact.write_text(json.dumps(compiled), encoding="utf-8")
    with TestClient(create_app(config)) as client:
        assert client.get("/api/v1/system").json()["retrieval"]["matches_corpus"] is False


def test_mapping_rejects_missing_active_runtime_unknown_pilot_and_duplicate():
    mapping = load_practice_map(ROOT / "packages/contracts")
    labs = load_runtime_definitions(ROOT / "packages/lab-engine")
    validate_mapping(mapping, labs)
    missing = mapping.model_copy(deep=True)
    missing.practices = missing.practices[:-1]
    with pytest.raises(ValueError, match="runtime catalog"):
        validate_mapping(missing, labs)
    unknown = mapping.model_copy(deep=True)
    unknown.tutor_pilot_runtime_ids.append("not-implemented")
    with pytest.raises(ValueError, match="runtime catalog"):
        validate_mapping(unknown, labs)
    duplicate = deepcopy(mapping.model_dump())
    duplicate["practices"].append(duplicate["practices"][0])
    with pytest.raises(ValidationError, match="Duplicate"):
        PracticeMap.model_validate(duplicate)
