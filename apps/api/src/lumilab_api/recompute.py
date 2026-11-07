"""Validate browser model inputs against the same repository schemas."""
import json
from dataclasses import dataclass
from math import isfinite
from pathlib import Path
from typing import Any

from jsonschema import Draft7Validator
from pydantic import Field

from lumilab_api.readings import MODELS
from lumilab_api.scientific_checks import check_science
from lumilab_api.verifier import Number, StageCheck, VerificationInput, VerificationResult


class RecomputeInput(VerificationInput):
    model_version: str = Field(min_length=1, max_length=100)
    dataset_version: str = Field(min_length=1, max_length=100)
    parameters: dict[str, Any]
    elapsed_s: Number = 0


@dataclass(frozen=True)
class RuntimeDefinition:
    model_version: str
    dataset_version: str
    duration_s: float
    validator: Draft7Validator
    configuration: dict[str, Any]
    lifecycle: str


def load_runtime_definitions(root: Path) -> dict[str, RuntimeDefinition]:
    schema = json.loads((root / "schemas/runtime-lab.schema.json").read_text(encoding="utf-8"))
    index = json.loads((root / "labs/catalog.json").read_text(encoding="utf-8"))
    index_schema = json.loads((root / "schemas/catalog.schema.json").read_text(encoding="utf-8"))
    Draft7Validator(index_schema).validate(index)
    ids = index["active"] + index["archived"]
    if len(ids) != len(set(ids)) or set(ids) != set(MODELS):
        raise ValueError("Runtime catalog must list each supported model exactly once")
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
        if len(parts) != len(set(parts)):
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
                           check_science(lab_id, parameters, result.preview)]
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
    return result
