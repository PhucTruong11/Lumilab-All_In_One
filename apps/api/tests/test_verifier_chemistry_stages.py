"""Chemistry stage checks for the stateless verifier (VER-01).

The titration screening path in verifier.screen_input previously listed
equation_balance, reaction_rules and quantitative_validation as forever
skipped. These tests pin the implemented behavior: catalog membership for
the four strong 1:1 pairs, atom conservation of the catalog equations, and
an independent quantitative recompute cross-checked against the preview.
VERIFIED remains blocked by reviewed evidence in every case.
"""
from pathlib import Path

import pytest

from lumilab_api.catalog import LabDefinition
from lumilab_api.readings import titration
from lumilab_api.scientific_checks import (
    UnsupportedFormula,
    equation_is_balanced,
    parse_formula,
)
from lumilab_api.verifier import (
    ChemistryInput,
    PhysicsInput,
    _equation_balance_check,
    _quantitative_check,
    _reaction_rules_check,
    _StageFailure,
    screen_input,
)

ROOT = Path(__file__).resolve().parents[3]
PAIRS = [("HCl", "NaOH", "NaCl"), ("HCl", "KOH", "KCl"),
         ("HNO3", "NaOH", "NaNO3"), ("HNO3", "KOH", "KNO3")]


def _lab(name):
    return LabDefinition.model_validate_json(
        (ROOT / "knowledge" / "labs" / f"{name}.lab.json").read_text(encoding="utf-8"))


def _chemistry_payload(**changes):
    base = dict(acid_formula="HCl", base_formula="NaOH", acid_volume_ml=25,
                base_volume_ml=25, acid_concentration_mol_l=0.1,
                base_concentration_mol_l=0.1, temperature_c=25)
    base.update(changes)
    return ChemistryInput(**base)


def _values(base_volume_ml):
    return {"acid_volume_ml": 25, "base_volume_ml": base_volume_ml,
            "acid_concentration_mol_l": 0.1, "base_concentration_mol_l": 0.1}


@pytest.mark.parametrize("acid,base,salt", PAIRS)
def test_reaction_rules_accept_the_four_catalog_pairs(acid, base, salt):
    check = _reaction_rules_check(acid, base)
    assert (check.stage, check.status, check.code) == (
        "reaction_rules", "pass", "DRAFT_CATALOG_MATCH")


@pytest.mark.parametrize("acid,base", [("CH3COOH", "NaOH"), ("HCl", "NH3"),
                                       ("H2SO4", "NaOH"), ("HCl", "Ca(OH)2")])
def test_reaction_rules_reject_pairs_outside_the_catalog(acid, base):
    with pytest.raises(_StageFailure) as caught:
        _reaction_rules_check(acid, base)
    failure = caught.value
    assert (failure.status, failure.code, failure.layer) == (
        "UNSUPPORTED", "REACTION_UNSUPPORTED", "reaction_rules")
    assert failure.check.status == "unsupported"


@pytest.mark.parametrize("acid,base,salt", PAIRS)
def test_equation_balance_holds_for_every_catalog_reaction(acid, base, salt):
    check = _equation_balance_check(acid, base, salt)
    assert (check.stage, check.status) == ("equation_balance", "pass")


def test_equation_balance_detects_a_wrong_salt():
    with pytest.raises(_StageFailure) as caught:
        _equation_balance_check("HCl", "NaOH", "KCl")  # potassium from nowhere
    assert caught.value.code == "EQUATION_UNBALANCED"
    assert caught.value.status == "INVALID"


@pytest.mark.parametrize("base_volume_ml", [0, 10, 25, 40, 50])
def test_quantitative_validation_matches_the_preview(base_volume_ml):
    values = _values(base_volume_ml)
    preview = titration({"acid": "hcl", "base": "naoh",
                         "baseVolume_ml": base_volume_ml}, 0)
    check = _quantitative_check(values, preview)
    assert (check.stage, check.status) == ("quantitative_validation", "pass")


def test_quantitative_validation_known_values_at_equivalence():
    preview = titration({"acid": "hcl", "base": "naoh", "baseVolume_ml": 25}, 0)
    assert preview["pH"] == pytest.approx(7.0)
    assert preview["equivalenceVolume_ml"] == 25
    check = _quantitative_check(_values(25), preview)
    assert check.status == "pass"


def test_quantitative_validation_detects_a_tampered_preview():
    values = _values(25)
    preview = titration({"acid": "hcl", "base": "naoh", "baseVolume_ml": 25}, 0)
    preview["pH"] = 6.5  # equivalence pH must be 7 for this model
    with pytest.raises(_StageFailure) as caught:
        _quantitative_check(values, preview)
    failure = caught.value
    assert (failure.status, failure.code) == ("INVALID", "QUANTITATIVE_MISMATCH")
    assert "pH" in failure.fields


def test_screen_input_runs_all_three_chemistry_stages():
    result = screen_input(_lab("titration-hcl-naoh"), _chemistry_payload(), "req-test")
    # Evidence is still unreviewed: stages pass, VERIFIED stays blocked.
    assert (result.status, result.code) == ("INSUFFICIENT_DATA", "REVIEWED_EVIDENCE_REQUIRED")
    for stage in ("reaction_rules", "equation_balance", "quantitative_validation"):
        assert stage in result.checks_passed
        assert stage not in result.checks_skipped
    assert result.checks_skipped == ["reviewed_evidence"]
    assert [(c.stage, c.status) for c in result.stage_checks] == [
        ("reaction_rules", "pass"), ("equation_balance", "pass"),
        ("quantitative_validation", "pass")]
    assert result.preview is not None and result.facts == {} and result.evidence == []


@pytest.mark.parametrize("base_volume_ml", [0, 50])
def test_screen_input_stages_hold_across_the_base_volume_range(base_volume_ml):
    result = screen_input(_lab("titration-hcl-naoh"),
                          _chemistry_payload(base_volume_ml=base_volume_ml), "req-test")
    assert result.code == "REVIEWED_EVIDENCE_REQUIRED"
    assert "quantitative_validation" in result.checks_passed


def test_screen_input_physics_path_is_unchanged():
    payload = PhysicsInput(length_m=1, mass_kg=0.2, angle_deg=10, gravity_m_s2=9.81)
    result = screen_input(_lab("pendulum"), payload, "req-test")
    assert (result.status, result.code) == ("INSUFFICIENT_DATA", "REVIEWED_EVIDENCE_REQUIRED")
    assert result.stage_checks == []
    assert result.checks_skipped == ["reviewed_evidence"]
    assert "server_recompute" in result.checks_passed


def test_quantitative_validation_reports_missing_preview_quantities():
    preview = titration({"acid": "hcl", "base": "naoh", "baseVolume_ml": 25}, 0)
    del preview["pH"]
    with pytest.raises(_StageFailure) as caught:
        _quantitative_check(_values(25), preview)
    failure = caught.value
    # Missing data is distinguished from a numeric mismatch.
    assert (failure.status, failure.code) == ("INSUFFICIENT_DATA", "MISSING_READING")
    assert failure.fields == ["pH"]


@pytest.mark.parametrize("field", ["acid_concentration_mol_l", "base_concentration_mol_l"])
def test_quantitative_validation_rejects_zero_concentration(field):
    values = _values(25)
    values[field] = 0
    with pytest.raises(_StageFailure) as caught:
        _quantitative_check(values, {})
    failure = caught.value
    assert (failure.status, failure.code) == ("INVALID", "INVALID_PHYSICAL_INPUT")
    assert failure.fields == [field]


def test_quantitative_validation_rejects_zero_total_volume_without_division_error():
    values = _values(0)
    values["acid_volume_ml"] = 0
    with pytest.raises(_StageFailure) as caught:
        _quantitative_check(values, {})
    failure = caught.value
    assert (failure.status, failure.code) == ("INVALID", "INVALID_PHYSICAL_INPUT")
    assert failure.fields == ["acid_volume_ml", "base_volume_ml"]


@pytest.mark.parametrize(
    ("changes", "field"),
    [
        ({"acid_concentration_mol_l": 0}, "acid_concentration_mol_l"),
        ({"base_concentration_mol_l": 0}, "base_concentration_mol_l"),
        ({"acid_volume_ml": 0, "base_volume_ml": 0}, "acid_volume_ml"),
    ],
)
def test_screen_input_rejects_zero_chemistry_values(changes, field):
    result = screen_input(
        _lab("titration-hcl-naoh"), _chemistry_payload(**changes), "req-zero"
    )
    assert (result.status, result.code) == ("INVALID", "INVALID_PHYSICAL_INPUT")
    assert field in result.fields


def test_screen_input_missing_input_never_reaches_the_stages():
    payload = _chemistry_payload()
    payload = ChemistryInput(**{**payload.model_dump(), "temperature_c": None})
    result = screen_input(_lab("titration-hcl-naoh"), payload, "req-test")
    assert (result.status, result.code) == ("INSUFFICIENT_DATA", "MISSING_INPUT")
    assert result.stage_checks == []
    assert "quantitative_validation" in result.checks_skipped


# --- Mapping to the three active inorganic modules -------------------------
# The modules are qualitative labs on the recompute path; their equations
# are catalog constants there. These vectors pin how those reactions stand
# under the same balance machinery the verifier stages reuse
# (scientific_checks.equation_is_balanced / parse_formula), so the coverage
# claim is tested rather than asserted.


@pytest.mark.parametrize("metal", ["Na", "K"])
def test_module_alkali_water_equation_is_balanced(metal):
    assert equation_is_balanced({metal: 2, "H2O": 2}, {metal + "OH": 2, "H2": 1})
    assert not equation_is_balanced({metal: 1, "H2O": 1}, {metal + "OH": 1, "H2": 1})


def test_module_chlorine_bleach_damp_equation_is_balanced():
    assert equation_is_balanced({"Cl2": 1, "H2O": 1}, {"HCl": 1, "HOCl": 1})


def test_module_copper_nitric_equation_is_outside_the_formula_grammar():
    # Cu(NO3)2 uses parentheses, which the declared neutral grammar does
    # not support: balance for this module cannot be machine-determined
    # today and must not be guessed. Recorded as a limitation in the
    # VER-01 report; the parser is not extended by this task.
    with pytest.raises(UnsupportedFormula):
        parse_formula("Cu(NO3)2")
