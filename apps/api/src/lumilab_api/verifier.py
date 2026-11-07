"""Stateless input screening; no trusted scientific results until later stages exist."""

from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from lumilab_api.catalog import LabDefinition
from lumilab_api.readings import pendulum, titration

Number = Annotated[float, Field(strict=True, allow_inf_nan=False)]
Formula = Annotated[str, Field(strict=True, min_length=1, max_length=32)]
Status = Literal["VERIFIED", "INVALID", "UNSUPPORTED", "INSUFFICIENT_DATA"]


class VerificationInput(BaseModel):
    model_config = ConfigDict(extra="forbid")


class PhysicsInput(VerificationInput):
    length_m: Number | None = None
    mass_kg: Number | None = None
    angle_deg: Number | None = None
    gravity_m_s2: Number | None = None


class ChemistryInput(VerificationInput):
    acid_formula: Formula | None = None
    base_formula: Formula | None = None
    acid_volume_ml: Number | None = None
    base_volume_ml: Number | None = None
    acid_concentration_mol_l: Number | None = None
    base_concentration_mol_l: Number | None = None
    temperature_c: Number | None = None


class StageCheck(BaseModel):
    stage: str
    status: Literal["pass", "invalid", "unsupported", "insufficient_data", "skipped"]
    code: str
    reason: str


class VerificationResult(BaseModel):
    status: Status
    code: str
    layer: str
    model_version: str
    dataset_version: str
    request_id: str
    fields: list[str] = Field(default_factory=list)
    facts: dict[str, float] = Field(default_factory=dict)
    preview: dict[str, object] | None = None
    evidence: list[str] = Field(default_factory=list)
    stage_checks: list[StageCheck] = Field(default_factory=list)
    checks_passed: list[str] = Field(default_factory=list)
    checks_skipped: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


def screen_input(
    lab: LabDefinition, payload: PhysicsInput | ChemistryInput, request_id: str,
) -> VerificationResult:
    values = payload.model_dump()
    pending = ["reviewed_evidence", "server_recompute"]
    if lab.domain == "chemistry":
        pending += ["equation_balance", "reaction_rules", "quantitative_validation"]
    passed = ["schema"]

    def result(status: Status, code: str, layer: str, fields: list[str]) -> VerificationResult:
        return VerificationResult(
            status=status, code=code, layer=layer, fields=fields,
            model_version=lab.model_version, dataset_version=lab.dataset_version,
            request_id=request_id, checks_passed=passed, checks_skipped=pending,
            limitations=["Reviewed evidence is required. Any preview is a draft model output."],
        )

    missing = sorted(name for name, value in values.items() if value is None)
    if missing:
        return result("INSUFFICIENT_DATA", "MISSING_INPUT", "input", missing)

    nonpositive = {
        "length_m", "mass_kg", "gravity_m_s2", "acid_volume_ml",
        "acid_concentration_mol_l", "base_concentration_mol_l",
    }
    invalid = sorted(
        name for name in nonpositive & values.keys() if values[name] <= 0
    )
    if values.get("base_volume_ml", 0) < 0:
        invalid.append("base_volume_ml")
    if invalid:
        return result("INVALID", "INVALID_PHYSICAL_INPUT", "input", invalid)

    outside = [
        name for name, definition in lab.parameters.items()
        if not definition.min <= values[name] <= definition.max
    ]
    if lab.domain == "chemistry":
        outside.extend(
            name for name, formula in {"acid_formula": "HCl", "base_formula": "NaOH"}.items()
            if values[name] != formula
        )
    if outside:
        return result("UNSUPPORTED", "OUTSIDE_MODEL_SCOPE", "scope", sorted(outside))

    passed.append("model_scope")
    response = result("INSUFFICIENT_DATA", "REVIEWED_EVIDENCE_REQUIRED", "evidence", [])
    if lab.domain == "physics":
        response.preview = pendulum(values, 0)
    else:
        response.preview = titration({
            "acid": "hcl", "base": "naoh", "baseVolume_ml": values["base_volume_ml"],
        }, 0)
    response.checks_passed.append("server_recompute")
    response.checks_skipped.remove("server_recompute")
    return response
