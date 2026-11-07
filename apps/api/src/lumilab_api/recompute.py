"""Validate browser model inputs against the same repository schemas."""
import json
from collections.abc import Mapping
from dataclasses import dataclass
from datetime import date
from math import isfinite
from pathlib import Path
from typing import Any, Literal

from jsonschema import Draft7Validator
from pydantic import BaseModel, ConfigDict, Field

from lumilab_api.readings import MODELS
from lumilab_api.scientific_checks import check_science, required_science_stages
from lumilab_api.verifier import Number, StageCheck, VerificationInput, VerificationResult


class RecomputeInput(VerificationInput):
    model_version: str = Field(min_length=1, max_length=100)
    dataset_version: str = Field(min_length=1, max_length=100)
    parameters: dict[str, Any]
    elapsed_s: Number = 0


ReviewStageStatus = Literal["pending", "draft", "reviewed", "approved"]


class VerificationClaimItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id: str = Field(min_length=1)
    statement: str = Field(min_length=1)
    source_refs: list[str]
    reference_tests: list[str]
    science_review: ReviewStageStatus


class VerificationClaimRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")
    schema_version: Literal[1]
    knowledge_id: str = Field(min_length=1)
    lab_id: str = Field(min_length=1)
    model_version: str = Field(min_length=1)
    dataset_version: str = Field(min_length=1)
    status: Literal["draft", "reviewed", "approved"]
    scope: dict[str, Any]
    claims: list[VerificationClaimItem] = Field(min_length=1)
    source_review: ReviewStageStatus
    rights_review: ReviewStageStatus
    reviewed_by: str | None = None
    reviewed_on: date | None = None
    verified_eligible: bool = False

    def is_approved_for(
        self, lab_id: str, model_version: str, dataset_version: str, parameters: Mapping[str, Any],
    ) -> bool:
        if not self.verified_eligible or self.status not in {"reviewed", "approved"}:
            return False
        if self.source_review not in {"reviewed", "approved"} or self.rights_review not in {"reviewed", "approved"}:
            return False
        if not self.reviewed_by or not self.reviewed_by.strip() or self.reviewed_on is None:
            return False
        if (self.lab_id, self.model_version, self.dataset_version) != (lab_id, model_version, dataset_version):
            return False
        if not all(
            claim.science_review in {"reviewed", "approved"} and claim.source_refs and claim.reference_tests
            for claim in self.claims
        ):
            return False
        for key, value in parameters.items():
            if key not in self.scope:
                continue
            bound = self.scope[key]
            if isinstance(bound, list) and len(bound) == 2:
                if not (isinstance(value, (int, float)) and bound[0] <= value <= bound[1]):
                    return False
            elif isinstance(bound, (int, float)):
                if value != bound:
                    return False
        return True


def load_verification_claims(knowledge_root: Path) -> dict[str, VerificationClaimRecord]:
    verification_dir = knowledge_root / "verification"
    if not verification_dir.is_dir():
        return {}
    claims: dict[str, VerificationClaimRecord] = {}
    for path in sorted(verification_dir.glob("*.json")):
        record = VerificationClaimRecord.model_validate_json(path.read_text(encoding="utf-8"))
        existing = claims.get(record.lab_id)
        if existing is not None and existing != record:
            raise ValueError(f"Conflicting verification claim records for {record.lab_id}")
        claims[record.lab_id] = record
    return claims


@dataclass(frozen=True)
class RuntimeDefinition:
    model_version: str
    dataset_version: str
    duration_s: float
    validator: Draft7Validator
    configuration: dict[str, Any]
    lifecycle: str
    claim: VerificationClaimRecord | None = None


def load_runtime_definitions(root: Path, knowledge_dir: Path | None = None) -> dict[str, RuntimeDefinition]:
    schema = json.loads((root / "schemas/runtime-lab.schema.json").read_text(encoding="utf-8"))
    index = json.loads((root / "labs/catalog.json").read_text(encoding="utf-8"))
    index_schema = json.loads((root / "schemas/catalog.schema.json").read_text(encoding="utf-8"))
    Draft7Validator(index_schema).validate(index)
    ids = index["active"] + index["archived"]
    if len(ids) != len(set(ids)) or set(ids) != set(MODELS):
        raise ValueError("Runtime catalog must list each supported model exactly once")
    claims = load_verification_claims(knowledge_dir or (root.parent.parent / "knowledge"))
    definitions = {}
    for lab_id, (version, _) in MODELS.items():
        raw = json.loads((root / "labs" / lab_id / "lab.json").read_text(encoding="utf-8"))
        Draft7Validator(schema).validate(raw)
        if raw["id"] != lab_id or raw["model_version"] != version:
            raise ValueError(f"Server reading model mismatch: {lab_id}")
        Draft7Validator.check_schema(raw["parameter_schema"])
        validator = Draft7Validator(raw["parameter_schema"])
        validator.validate(raw["defaults"])
        definitions[lab_id] = RuntimeDefinition(
            version, raw["dataset_version"], raw.get("duration_s", 86400), validator,
            raw, "archived" if lab_id in index["archived"] else "active",
            claim=claims.get(lab_id),
        )
    return definitions


def recompute(
    lab_id: str, lab: RuntimeDefinition, payload: RecomputeInput, request_id: str,
) -> VerificationResult:
    result = VerificationResult(
        status="INSUFFICIENT_DATA", code="REVIEWED_EVIDENCE_REQUIRED", layer="evidence",
        model_version=lab.model_version, dataset_version=lab.dataset_version,
        request_id=request_id, checks_skipped=["reviewed_evidence", "server_recompute"],
        limitations=["Draft model preview. Reviewed evidence is required for verification."],
    )
    if (payload.model_version, payload.dataset_version) != (lab.model_version, lab.dataset_version):
        result.status, result.code, result.layer = "UNSUPPORTED", "REVISION_MISMATCH", "scope"
        return result

    parameters = payload.parameters
    errors = list(lab.validator.iter_errors(parameters))
    if any(isinstance(value, float) and not isfinite(value) for value in parameters.values()):
        result.status, result.code, result.layer = "INVALID", "INVALID_MODEL_PARAMETERS", "input"
        return result
    if any(error.validator != "required" for error in errors):
        result.status, result.code, result.layer = "INVALID", "INVALID_MODEL_PARAMETERS", "input"
        result.fields = sorted({str(error.path[0]) for error in errors if error.path})
        return result
    if errors:
        result.code, result.layer = "MISSING_INPUT", "input"
        result.fields = sorted(set(lab.validator.schema["required"]) - parameters.keys())
        return result
    if not 0 <= payload.elapsed_s <= lab.duration_s:
        result.status, result.code, result.layer = "INVALID", "INVALID_MODEL_PARAMETERS", "input"
        result.fields = ["elapsed_s"]
        return result
    if lab_id == "circuit":
        parts = [part for part in parameters["slots"] if part is not None]
        if parts.count("switchInstalled") > 1:
            result.status, result.code, result.layer = "INVALID", "INVALID_MODEL_PARAMETERS", "input"
            result.fields = ["slots"]
            return result

    result.preview = MODELS[lab_id][1](parameters, payload.elapsed_s)
    if lab_id == "capacitor" and result.preview.get("elapsed_s") != payload.elapsed_s:
        result.status, result.code, result.layer = "INVALID", "SIMULATION_TIME_MISMATCH", "simulation"
        result.stage_checks = [StageCheck(stage="simulation", status="invalid",
            code=result.code, reason="Reading time differs from requested simulation time")]
        result.preview = None
        return result
    result.checks_passed = ["schema", "model_scope", "server_recompute"]
    result.checks_skipped.remove("server_recompute")
    result.stage_checks = [StageCheck.model_validate(item) for item in
                           check_science(lab_id, parameters, result.preview, payload.elapsed_s)]
    for check in result.stage_checks:
        if check.status == "pass":
            result.checks_passed.append(check.stage)
        else:
            result.checks_skipped.append(check.stage)
        if check.status in {"invalid", "unsupported", "insufficient_data"}:
            result.status = {
                "invalid": "INVALID", "unsupported": "UNSUPPORTED",
                "insufficient_data": "INSUFFICIENT_DATA",
            }[check.status]
            result.code, result.layer = check.code, check.stage
            # An inconsistent model result is not an eligible preview to save or explain.
            result.preview = None
            return result

    required_stages = required_science_stages(lab_id)
    passed_stages = [check.stage for check in result.stage_checks if check.status == "pass"]
    if (len(result.stage_checks) != len({check.stage for check in result.stage_checks})
            or not required_stages.issubset(passed_stages)):
        result.code, result.layer = "SCIENTIFIC_CHECKS_INCOMPLETE", "science"
        result.preview = None
        return result

    if lab.claim is not None and lab.claim.is_approved_for(
        lab_id, lab.model_version, lab.dataset_version, parameters,
    ):
        result.status = "VERIFIED"
        result.code = "VERIFIED"
        result.layer = "evidence"
        result.checks_passed.append("reviewed_evidence")
        result.checks_skipped.remove("reviewed_evidence")
        result.facts = {
            key: float(value)
            for key, value in result.preview.items()
            if type(value) in (int, float)
        }
        result.evidence = [f"{lab.claim.knowledge_id}:{claim.id}" for claim in lab.claim.claims]
        result.limitations = [
            "Verified within the declared ideal model scope and reviewed claim bounds."
        ]
    return result
