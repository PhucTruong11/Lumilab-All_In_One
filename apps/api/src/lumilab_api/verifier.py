"""Stateless input screening with chemistry stage checks.

The chemistry branch runs the declared catalog stages (reaction rules,
equation balance, quantitative validation) against the same bounded
machinery as the recompute path. Stage passes are evidence about the
model only: VERIFIED still requires reviewed evidence, which this layer
never grants.
"""

from math import isclose, log10, sqrt
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

from lumilab_api.catalog import LabDefinition
from lumilab_api.readings import pendulum, titration
from lumilab_api.scientific_checks import (
    FormulaSyntaxError,
    UnsupportedFormula,
    equation_is_balanced,
)

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


# The declared draft catalog of strong 1:1 titration pairs (VERIFY-STAGES):
# acid formula, base formula -> salt formula. Membership is the reaction
# rule; atom conservation and the quantitative model are checked separately.
_TITRATION_CATALOG = {
    ("HCl", "NaOH"): "NaCl",
    ("HCl", "KOH"): "KCl",
    ("HNO3", "NaOH"): "NaNO3",
    ("HNO3", "KOH"): "KNO3",
}
_CHEMISTRY_STAGES = ["equation_balance", "reaction_rules", "quantitative_validation"]


class _StageFailure(Exception):
    def __init__(self, status: Status, code: str, layer: str, fields: list[str],
                 check: "StageCheck"):
        super().__init__(code)
        self.status, self.code, self.layer, self.fields = status, code, layer, fields
        self.check = check


def _reaction_rules_check(acid_formula: str, base_formula: str) -> StageCheck:
    """The submitted pair must be one of the catalog's strong 1:1 reactions."""
    stage = "reaction_rules"
    if (acid_formula, base_formula) not in _TITRATION_CATALOG:
        raise _StageFailure(
            "UNSUPPORTED", "REACTION_UNSUPPORTED", stage,
            ["acid_formula", "base_formula"],
            StageCheck(stage=stage, status="unsupported", code="REACTION_UNSUPPORTED",
                       reason="Only the four strong 1:1 catalog pairs are supported."))
    return StageCheck(
        stage=stage, status="pass", code="DRAFT_CATALOG_MATCH",
        reason="Pair matches the declared draft catalog at its fixed conditions "
               "(strong monoprotic acid and monobasic base, 1:1); source review "
               "is still required.")


def _equation_balance_check(acid_formula: str, base_formula: str, salt: str) -> StageCheck:
    """The catalog equation for the pair must conserve atoms (unit coefficients)."""
    stage = "equation_balance"
    try:
        balanced = equation_is_balanced(
            {acid_formula: 1, base_formula: 1}, {salt: 1, "H2O": 1})
    except (FormulaSyntaxError, UnsupportedFormula) as error:
        raise _StageFailure(
            "UNSUPPORTED", "FORMULA_UNSUPPORTED", stage,
            ["acid_formula", "base_formula"],
            StageCheck(stage=stage, status="unsupported", code="FORMULA_UNSUPPORTED",
                       reason=f"A catalog formula is outside the neutral grammar: {error}"))
    if not balanced:
        raise _StageFailure(
            "INVALID", "EQUATION_UNBALANCED", stage,
            ["acid_formula", "base_formula"],
            StageCheck(stage=stage, status="invalid", code="EQUATION_UNBALANCED",
                       reason="Catalog equation does not conserve atoms."))
    return StageCheck(
        stage=stage, status="pass", code="CHECK_PASSED",
        reason="Neutral catalog equation conserves atoms; balance alone does "
               "not establish that the reaction occurs.")


def _quantitative_check(values: dict, preview: dict) -> StageCheck:
    """Recompute the titration quantities independently and cross-check the
    preview the server produced: mole balances (1:1), additive volumes, the
    equivalence volume, and [H+] from the charge-balance equation
    [H+] - Kw/[H+] = (n_acid - n_base) / V with Kw = 1e-14."""
    stage = "quantitative_validation"
    total_volume_ml = values["acid_volume_ml"] + values["base_volume_ml"]
    invalid = [
        field for field in ("acid_concentration_mol_l", "base_concentration_mol_l")
        if values[field] <= 0
    ]
    if total_volume_ml <= 0:
        invalid.extend(("acid_volume_ml", "base_volume_ml"))
    if invalid:
        invalid = sorted(set(invalid))
        raise _StageFailure(
            "INVALID", "INVALID_PHYSICAL_INPUT", stage, invalid,
            StageCheck(
                stage=stage, status="invalid", code="INVALID_PHYSICAL_INPUT",
                reason="Concentrations must be positive and total volume must be above zero.",
            ),
        )
    acid_moles = values["acid_concentration_mol_l"] * values["acid_volume_ml"] / 1000
    base_moles = values["base_concentration_mol_l"] * values["base_volume_ml"] / 1000
    salt_moles = min(acid_moles, base_moles)
    difference = (acid_moles - base_moles) / (total_volume_ml / 1000)
    root = sqrt(difference * difference + 4e-14)
    # Stable quadratic root: the naive (difference + root) / 2 cancels
    # catastrophically when base is in excess (difference < 0).
    hydrogen = (difference + root) / 2 if difference >= 0 else 2e-14 / (root - difference)
    expected = {
        "acidMoles": acid_moles,
        "baseMoles": base_moles,
        "saltMoles": salt_moles,
        "remainingAcidMoles": acid_moles - salt_moles,
        "remainingBaseMoles": base_moles - salt_moles,
        "totalVolume_ml": total_volume_ml,
        "equivalenceVolume_ml": acid_moles / values["base_concentration_mol_l"] * 1000,
        "hydrogen_mol_L": hydrogen,
        "pH": -log10(hydrogen),
    }
    missing = sorted(key for key in expected if key not in preview)
    if missing:
        raise _StageFailure(
            "INSUFFICIENT_DATA", "MISSING_READING", stage, missing,
            StageCheck(stage=stage, status="insufficient_data", code="MISSING_READING",
                       reason="Preview lacks quantities required for validation: "
                              + ", ".join(missing) + "."))
    mismatched = sorted(
        key for key, want in expected.items()
        if not isclose(float(preview[key]), want, rel_tol=2e-9, abs_tol=1e-12))
    if mismatched:
        raise _StageFailure(
            "INVALID", "QUANTITATIVE_MISMATCH", stage, mismatched,
            StageCheck(stage=stage, status="invalid", code="QUANTITATIVE_MISMATCH",
                       reason="Preview quantities disagree with the independent "
                              "recompute: " + ", ".join(mismatched) + "."))
    return StageCheck(
        stage=stage, status="pass", code="CHECK_PASSED",
        reason="Mole balances, additive volumes, equivalence volume and the "
               "charge-balance pH agree with the preview within tolerance.")


def screen_input(
    lab: LabDefinition, payload: PhysicsInput | ChemistryInput, request_id: str,
) -> VerificationResult:
    values = payload.model_dump()
    pending = ["reviewed_evidence", "server_recompute"]
    if lab.domain == "chemistry":
        pending += _CHEMISTRY_STAGES
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
    if lab.domain == "chemistry":
        checks: list[StageCheck] = []
        try:
            checks.append(_reaction_rules_check(values["acid_formula"], values["base_formula"]))
            salt = _TITRATION_CATALOG[(values["acid_formula"], values["base_formula"])]
            checks.append(_equation_balance_check(
                values["acid_formula"], values["base_formula"], salt))
            checks.append(_quantitative_check(values, response.preview))
        except _StageFailure as failure:
            checks.append(failure.check)
            blocked = result(failure.status, failure.code, failure.layer, failure.fields)
            blocked.stage_checks = checks
            blocked.checks_passed.append("server_recompute")
            blocked.checks_skipped.remove("server_recompute")
            for check in checks:
                if check.status == "pass":
                    blocked.checks_passed.append(check.stage)
                    blocked.checks_skipped.remove(check.stage)
            return blocked
        response.stage_checks = checks
        for check in checks:
            response.checks_passed.append(check.stage)
            response.checks_skipped.remove(check.stage)
    return response
