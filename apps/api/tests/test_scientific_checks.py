"""Independent equation/conservation cases, including tampered draft readings."""
import json
from math import exp, nextafter
from pathlib import Path

import pytest

from lumilab_api.readings import MODELS, atomic, circuit, mechanics, pendulum, spring, titration
from lumilab_api.scientific_checks import (
    FormulaSyntaxError,
    UnsupportedFormula,
    check_science,
    equation_is_balanced,
    parse_formula,
)

ROOT = Path(__file__).resolve().parents[3]
DEFINITIONS = {
    lab_id: json.loads((ROOT / "packages/lab-engine/labs" / lab_id / "lab.json").read_text(encoding="utf-8"))
    for lab_id in MODELS
}
SERVER_CASES = json.loads((ROOT / "tests/golden/server-readings.json").read_text(encoding="utf-8"))
ADDITIONAL_CASES = json.loads((ROOT / "tests/golden/additional-labs.json").read_text(encoding="utf-8"))["cases"]


def assert_pass(checks):
    assert all(check["status"] in {"pass", "skipped"} for check in checks), checks
    assert all(check["status"] != "VERIFIED" for check in checks)


def stage(checks, name):
    return next(check for check in checks if check["stage"] == name)


@pytest.mark.parametrize(("formula", "expected"), [
    ("H2O", {"H": 2, "O": 1}),
    ("NaHCO3", {"Na": 1, "H": 1, "C": 1, "O": 3}),
    ("AgNO3", {"Ag": 1, "N": 1, "O": 3}),
    ("CH3COOH", {"C": 2, "H": 4, "O": 2}),
])
def test_simple_neutral_formula_counts(formula, expected):
    assert parse_formula(formula) == expected


@pytest.mark.parametrize("formula", ["", "2HCl", "h2O", "H0", "H01", "H1000", "H2 O"])
def test_malformed_formula_is_invalid(formula):
    with pytest.raises(FormulaSyntaxError):
        parse_formula(formula)


@pytest.mark.parametrize("formula", ["Fe2(SO4)3", "Na+", "CuSO4·5H2O", "H₂O", "He", "H" * 65])
def test_unsupported_syntax_or_element_does_not_mean_compound_nonexistent(formula):
    with pytest.raises(UnsupportedFormula):
        parse_formula(formula)


def test_balanced_catalog_equations_and_unbalanced_counterexample():
    assert equation_is_balanced({"AgNO3": 1, "NaCl": 1}, {"AgCl": 1, "NaNO3": 1})
    assert equation_is_balanced({"HCl": 1, "NaHCO3": 1}, {"NaCl": 1, "H2O": 1, "CO2": 1})
    assert equation_is_balanced({"H2": 2, "O2": 1}, {"H2O": 2})
    assert not equation_is_balanced({"H2": 1, "O2": 1}, {"H2O": 1})


@pytest.mark.parametrize("coefficient", [0, -1, True, 1.5, 1000])
def test_bad_coefficients_are_invalid(coefficient):
    with pytest.raises(FormulaSyntaxError):
        equation_is_balanced({"H2": coefficient}, {"H2": 1})


@pytest.mark.parametrize("acid", ["hcl", "hno3"])
@pytest.mark.parametrize("base", ["naoh", "koh"])
@pytest.mark.parametrize("volume", [0, 24.9999999999, 25, 25.0000000001, 50])
def test_titration_all_four_pairs_near_equivalence_keep_draft_gate(acid, base, volume):
    parameters = {"acid": acid, "base": base, "baseVolume_ml": volume}
    checks = check_science("chemistry", parameters, titration(parameters, 0))
    assert_pass(checks)
    assert stage(checks, "scientific_rules")["code"] == "DRAFT_CATALOG_MATCH"
    assert stage(checks, "charge_balance")["status"] == "skipped"


def test_titration_known_equivalence_and_wrong_quantities_pH_and_equation():
    parameters = {"acid": "hcl", "base": "naoh", "baseVolume_ml": 25}
    reading = titration(parameters, 0)
    assert reading["pH"] == 7
    assert reading["saltMoles"] == pytest.approx(0.0025)
    for key, bad, affected_stage in [
        ("saltMoles", .025, "quantitative"),
        ("remainingAcidMoles", -.001, "quantitative"),
        ("hydrogen_mol_L", 1e-6, "simulation"),
        ("pH", 8, "simulation"),
        ("indicatorFraction", 1, "simulation"),
        ("equation", "HCl + NaOH → NaCl", "formula_equation"),
    ]:
        checks = check_science("chemistry", parameters, {**reading, key: bad})
        assert stage(checks, affected_stage)["status"] == "invalid"


def test_titration_stage_roundoff_does_not_reject_server_readings():
    for direction in (0, 50):
        volume = 25.0
        for _ in range(20):
            volume = nextafter(volume, direction)
            parameters = {"acid": "hcl", "base": "naoh", "baseVolume_ml": volume}
            assert_pass(check_science("chemistry", parameters, titration(parameters, 0)))


def test_missing_unknown_and_extra_conditions_are_explicit():
    assert check_science("chemistry", {}, {})[0]["status"] == "insufficient_data"
    assert check_science("chemistry", {"acid": "acetic", "base": "naoh"}, {})[0]["status"] == "unsupported"
    parameters = {"acid": "hcl", "base": "naoh", "baseVolume_ml": 25, "temperature_C": 80}
    assert check_science("chemistry", parameters, {})[0]["code"] == "CONDITION_UNSUPPORTED"
    parameters.pop("temperature_C")
    assert stage(check_science("chemistry", parameters, {}), "quantitative")["status"] == "insufficient_data"
    assert check_science("future-model", {}, {})[0]["status"] == "skipped"


def precipitation_fixture(silver=25, chloride=10):
    # Independent reference: 2.5 mmol Ag+, 1 mmol Cl- -> 1 mmol AgCl,
    # 0.14332 g solid, leaving 1.5 mmol Ag+. No equilibrium/kinetics claim.
    assert (silver, chloride) == (25, 10)
    return {
        "silverMoles": .0025, "chlorideMoles": .001, "precipitateMoles": .001,
        "precipitateMass_g": .14332, "remainingSilverMoles": .0015,
        "remainingChlorideMoles": 0, "totalVolume_ml": 35,
        "hasPrecipitate": True, "limitingReagent": "NaCl",
        "equation": "AgNO₃ + NaCl → AgCl + NaNO₃",
    }


def test_precipitation_reference_mass_and_forged_solid():
    parameters = {"silverVolume_ml": 25, "chlorideVolume_ml": 10}
    reading = precipitation_fixture()
    assert_pass(check_science("precipitation", parameters, reading))
    wrong = check_science("precipitation", parameters, {**reading, "precipitateMass_g": .1})
    assert stage(wrong, "quantitative")["status"] == "invalid"
    wrong = check_science("precipitation", parameters, {**reading, "hasPrecipitate": False})
    assert stage(wrong, "simulation")["status"] == "invalid"


def test_no_precipitation_without_chloride():
    parameters = {"silverVolume_ml": 25, "chlorideVolume_ml": 0}
    reading = {**precipitation_fixture(), "chlorideMoles": 0, "precipitateMoles": 0,
               "precipitateMass_g": 0, "remainingSilverMoles": .0025,
               "totalVolume_ml": 25, "hasPrecipitate": False}
    assert_pass(check_science("precipitation", parameters, reading))
    assert stage(check_science("precipitation", parameters, {**reading, "hasPrecipitate": True}),
                 "simulation")["status"] == "invalid"


def gas_fixture():
    # 1 mmol NaHCO3 (84.0066 mg) with 2.5 mmol HCl: ideal gas at
    # 25°C and 1 atm occupies 24.465403697 mL, not 22.4 mL (STP).
    return {
        "acidMoles": .0025, "bicarbonateMoles": .001, "reactionMoles": .001,
        "remainingAcidMoles": .0015, "remainingBicarbonateMoles": 0,
        "carbonDioxideVolume_ml": 24.465403697038223,
        "hasGas": True, "limitingReagent": "NaHCO3",
        "equation": "HCl + NaHCO₃ → NaCl + H₂O + CO₂",
    }


def test_gas_known_ideal_volume_units_and_wrong_STP_value():
    parameters = {"acidVolume_ml": 25, "bicarbonateMass_g": .0840066}
    reading = gas_fixture()
    assert_pass(check_science("gas-reaction", parameters, reading))
    for key, bad in [("carbonDioxideVolume_ml", 22.4), ("remainingAcidMoles", -.001),
                     ("reactionMoles", .0025), ("remainingBicarbonateMoles", -1e-15)]:
        checks = check_science("gas-reaction", parameters, {**reading, key: bad})
        assert stage(checks, "quantitative")["status"] == "invalid"


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), "0.1", True])
def test_nonfinite_or_non_numeric_readings_cannot_pass(bad):
    parameters = {"acidVolume_ml": 25, "bicarbonateMass_g": .0840066}
    assert stage(check_science("gas-reaction", parameters, {**gas_fixture(), "reactionMoles": bad}),
                 "quantitative")["status"] == "invalid"


@pytest.mark.parametrize(("lab_id", "model", "parameters", "time"), [
    ("pendulum", pendulum, {"length_m": 1, "mass_kg": .2, "angle_deg": 90, "gravity_m_s2": 9.81}, 0),
    ("pendulum", pendulum, {"length_m": 1, "mass_kg": .2, "angle_deg": 0, "gravity_m_s2": 9.81}, 0),
    ("mechanics", mechanics, {"mass_kg": 2, "force_N": 6, "initialVelocity_m_s": 1}, 2),
    ("mechanics", mechanics, {"mass_kg": 2, "force_N": -6, "initialVelocity_m_s": 1}, 2),
    ("spring", spring, {"mass_kg": .5, "stiffness_N_m": 20, "displacement_m": .2}, .4),
    ("spring", spring, {"mass_kg": .5, "stiffness_N_m": 20, "displacement_m": 0}, .4),
    ("atomic", atomic, {"protons": 11, "neutrons": 12, "electrons": 10}, 0),
])
def test_existing_physics_models_satisfy_independent_invariants(lab_id, model, parameters, time):
    assert_pass(check_science(lab_id, parameters, model(parameters, time)))


@pytest.mark.parametrize("closed", [True, False])
@pytest.mark.parametrize("ammeter", ["series", "parallel"])
def test_original_circuit_validity_open_switch_and_power(closed, ammeter):
    parameters = {"slots": ["extraResistor", "bulb", "switchInstalled"], "resistance_ohm": 30,
                  "voltage_V": 6, "switchClosed": closed, "ammeter": ammeter, "voltmeter": "parallel"}
    reading = circuit(parameters, 0)
    assert_pass(check_science("circuit", parameters, reading))
    assert stage(check_science("circuit", parameters, {**reading, "totalResistance_ohm": 30}),
                 "physics_invariants")["status"] == "invalid"


def test_two_series_bulbs_use_combined_power_in_science_check():
    parameters = {"slots": ["bulb", "bulb", None], "resistance_ohm": 20,
                  "voltage_V": 6, "switchClosed": True, "ammeter": "series", "voltmeter": "parallel"}
    reading = circuit(parameters, 0)
    assert reading["totalResistance_ohm"] == 40
    assert reading["current_A"] == pytest.approx(0.15)
    assert reading["bulbPower_W"] == pytest.approx(0.45)
    assert_pass(check_science("circuit", parameters, reading))
    wrong = {**reading, "bulbPower_W": reading["bulbPower_W"] / 2}
    assert stage(check_science("circuit", parameters, wrong), "physics_invariants")["status"] == "invalid"


def test_wrong_small_angle_period_is_rejected_at_90_degrees():
    parameters = {"length_m": 1, "mass_kg": .2, "angle_deg": 90, "gravity_m_s2": 9.81}
    reading = pendulum(parameters, 0)
    checks = check_science("pendulum", parameters, {**reading, "period_s": 2.00606668})
    assert stage(checks, "physics_invariants")["status"] == "invalid"


@pytest.mark.parametrize(("lab_id", "model", "parameters", "key", "bad"), [
    ("mechanics", mechanics, {"mass_kg": 2, "force_N": 6, "initialVelocity_m_s": 1}, "position_m", 7),
    ("spring", spring, {"mass_kg": .5, "stiffness_N_m": 20, "displacement_m": .2}, "totalEnergy_J", 4),
    ("atomic", atomic, {"protons": 11, "neutrons": 12, "electrons": 10}, "charge_e", 0),
])
def test_physics_energy_position_or_charge_tampering_is_detected(lab_id, model, parameters, key, bad):
    reading = model(parameters, 2)
    checks = check_science(lab_id, parameters, {**reading, key: bad})
    assert stage(checks, "physics_invariants")["status"] == "invalid"


def test_parallel_circuit_kcl_reference_and_wrong_branch():
    parameters = {"voltage_V": 6, "resistance1_ohm": 20, "resistance2_ohm": 30,
                  "topology": "parallel", "switchClosed": True}
    reading = {"equivalentResistance_ohm": 12, "totalCurrent_A": .5,
               "branch1Current_A": .3, "branch2Current_A": .2,
               "resistor1Voltage_V": 6, "resistor2Voltage_V": 6,
               "totalPower_W": 3, "closed": True, "topology": "parallel"}
    assert_pass(check_science("parallel-circuit", parameters, reading))
    assert stage(check_science("parallel-circuit", parameters, {**reading, "branch2Current_A": .3}),
                 "physics_invariants")["status"] == "invalid"


@pytest.mark.parametrize("mode", ["charge", "discharge"])
def test_capacitor_one_time_constant_energy_and_current_sign(mode):
    parameters = {"voltage_V": 10, "resistance_ohm": 1000, "capacitance_uF": 1000, "mode": mode}
    capacitor = 10 * (1 - exp(-1) if mode == "charge" else exp(-1))
    resistor = 10 - capacitor if mode == "charge" else -capacitor
    reading = {"elapsed_s": 1, "timeConstant_s": 1, "capacitorVoltage_V": capacitor,
               "resistorVoltage_V": resistor, "current_A": resistor / 1000,
               "charge_C": .001 * capacitor, "energy_J": .0005 * capacitor ** 2}
    assert_pass(check_science("capacitor", parameters, reading))
    assert stage(check_science("capacitor", parameters, {**reading, "energy_J": .05}),
                 "physics_invariants")["status"] == "invalid"


@pytest.mark.parametrize("lab_id", list(MODELS))
def test_all_registered_model_defaults_satisfy_stages(lab_id):
    parameters = DEFINITIONS[lab_id]["defaults"]
    assert_pass(check_science(lab_id, parameters, MODELS[lab_id][1](parameters, 0)))


@pytest.mark.parametrize("case", SERVER_CASES + ADDITIONAL_CASES)
def test_existing_and_new_shared_golden_cases_satisfy_stages(case):
    lab_id = case.get("lab", case.get("lab_id"))
    parameters = {**DEFINITIONS[lab_id]["defaults"], **case["parameters"]}
    elapsed = case.get("time", case.get("elapsed_s", 0))
    reading = MODELS[lab_id][1](parameters, elapsed)
    for key, expected in case["expected"].items():
        if type(expected) in (int, float):
            assert reading[key] == pytest.approx(expected, rel=2e-9, abs=1e-10)
        else:
            assert reading[key] == expected
    assert_pass(check_science(lab_id, parameters, reading))


def model_boundaries():
    cases = []
    for lab_id, definition in DEFINITIONS.items():
        for key, prop in definition["parameter_schema"]["properties"].items():
            values = prop.get("enum", []) + [prop[bound] for bound in ("minimum", "maximum") if bound in prop]
            if prop.get("type") == "boolean":
                values += [False, True]
            for value in values:
                parameters = {**definition["defaults"], key: value}
                for elapsed in (0, definition.get("duration_s", 86400)):
                    cases.append(pytest.param(lab_id, parameters, elapsed,
                                              id=f"{lab_id}-{key}-{value}-{elapsed}"))
    return cases


@pytest.mark.parametrize(("lab_id", "parameters", "elapsed"), model_boundaries())
def test_runtime_bounds_and_enum_states_do_not_reject_valid_draft_readings(lab_id, parameters, elapsed):
    assert_pass(check_science(lab_id, parameters, MODELS[lab_id][1](parameters, elapsed)))
