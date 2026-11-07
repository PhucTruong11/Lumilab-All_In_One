"""Independent electrical/chemical invariants and shared TS/Python reference vectors."""

import json
import math
from pathlib import Path

import pytest

from lumilab_api.additional_readings import (
    capacitor,
    gas_reaction,
    parallel_circuit,
    precipitation,
)

ROOT = Path(__file__).resolve().parents[3]
REFERENCE = json.loads((ROOT / "tests/golden/additional-labs.json").read_text(encoding="utf-8"))
MODELS = {
    "parallel-circuit": parallel_circuit,
    "capacitor": capacitor,
    "precipitation": precipitation,
    "gas-reaction": gas_reaction,
}


@pytest.mark.parametrize("row", REFERENCE["cases"])
def test_shared_independent_reference(row):
    reading = MODELS[row["lab_id"]](row["parameters"], row["elapsed_s"])
    for key, expected in row["expected"].items():
        if type(expected) in (int, float):
            assert reading[key] == pytest.approx(expected, rel=1e-11, abs=1e-14)
        else:
            assert reading[key] == expected


@pytest.mark.parametrize("topology", ["series", "parallel"])
def test_kirchhoff_and_power(topology):
    parameters = dict(
        voltage_V=9, resistance1_ohm=15, resistance2_ohm=60, topology=topology, switchClosed=True
    )
    reading = parallel_circuit(parameters)
    power = reading["branch1Current_A"] ** 2 * 15 + reading["branch2Current_A"] ** 2 * 60
    assert reading["totalPower_W"] == pytest.approx(power)
    if topology == "series":
        assert reading["resistor1Voltage_V"] + reading["resistor2Voltage_V"] == pytest.approx(9)
        assert reading["branch1Current_A"] == reading["branch2Current_A"]
    else:
        assert reading["totalCurrent_A"] == pytest.approx(
            reading["branch1Current_A"] + reading["branch2Current_A"]
        )
        assert reading["resistor1Voltage_V"] == reading["resistor2Voltage_V"]


@pytest.mark.parametrize("mode", ["charge", "discharge"])
def test_rc_differential_equations(mode):
    parameters = dict(voltage_V=8, resistance_ohm=2000, capacitance_uF=500, mode=mode)
    dt = 1e-5
    for time in [0.1, 1, 3]:
        reading = capacitor(parameters, time)
        before = capacitor(parameters, time - dt)
        after = capacitor(parameters, time + dt)
        assert (after["charge_C"] - before["charge_C"]) / (2 * dt) == pytest.approx(
            reading["current_A"], rel=1e-8
        )
        assert reading["energy_J"] == pytest.approx(reading["charge_C"] ** 2 / 0.001)
        if mode == "discharge":
            assert (after["energy_J"] - before["energy_J"]) / (2 * dt) == pytest.approx(
                -(reading["current_A"] ** 2) * 2000, rel=1e-8
            )
        else:
            assert reading["capacitorVoltage_V"] + reading["resistorVoltage_V"] == pytest.approx(8)


def test_reaction_species_conserved_and_no_reaction_without_both_reagents():
    for first in [0, 1, 10, 25, 50]:
        for second in [0, 1, 10, 25, 50]:
            solid = precipitation(dict(silverVolume_ml=first, chlorideVolume_ml=second))
            assert solid["precipitateMoles"] + solid["remainingSilverMoles"] == pytest.approx(
                solid["silverMoles"]
            )
            assert solid["precipitateMoles"] + solid["remainingChlorideMoles"] == pytest.approx(
                solid["chlorideMoles"]
            )
            assert min(solid["remainingSilverMoles"], solid["remainingChlorideMoles"]) == 0
            assert solid["hasPrecipitate"] == (first > 0 and second > 0)
            gas = gas_reaction(dict(acidVolume_ml=first, bicarbonateMass_g=second / 50))
            assert gas["reactionMoles"] + gas["remainingAcidMoles"] == pytest.approx(
                gas["acidMoles"]
            )
            assert gas["reactionMoles"] + gas["remainingBicarbonateMoles"] == pytest.approx(
                gas["bicarbonateMoles"]
            )
            assert gas["hasGas"] == (first > 0 and second > 0)


@pytest.mark.parametrize("invalid", [-1, 51, math.nan, math.inf, "25", True])
def test_chemical_inputs_reject_invalid_values(invalid):
    with pytest.raises(ValueError):
        precipitation(dict(silverVolume_ml=invalid, chlorideVolume_ml=10))
    with pytest.raises(ValueError):
        gas_reaction(dict(acidVolume_ml=invalid, bicarbonateMass_g=0.2))


def test_equivalence_label_tolerates_roundoff_without_zeroing_trace_amounts():
    equivalent = gas_reaction(
        dict(acidVolume_ml=25, bicarbonateMass_g=math.nextafter(0.2100165, math.inf))
    )
    assert equivalent["limitingReagent"] == "equivalent"
    trace = precipitation(dict(silverVolume_ml=1e-10, chlorideVolume_ml=0))
    assert trace["limitingReagent"] == "NaCl"
    assert trace["remainingSilverMoles"] > 0


def test_electrical_inputs_reject_unknown_modes_nonfinite_and_boolean_numbers():
    circuit = dict(
        voltage_V=6, resistance1_ohm=10, resistance2_ohm=20, topology="series", switchClosed=True
    )
    for update in [
        dict(topology="bad"),
        dict(switchClosed=1),
        dict(voltage_V=True),
        dict(resistance1_ohm=0),
    ]:
        with pytest.raises(ValueError):
            parallel_circuit(circuit | update)
    rc = dict(voltage_V=6, resistance_ohm=1000, capacitance_uF=1000, mode="charge")
    for update in [dict(mode="bad"), dict(capacitance_uF=0), dict(voltage_V=math.inf)]:
        with pytest.raises(ValueError):
            capacitor(rc | update)
    for invalid_time in [-0.1, 121, math.nan, True]:
        with pytest.raises(ValueError):
            capacitor(rc, invalid_time)


@pytest.mark.parametrize("lab_id", MODELS)
def test_metadata_stays_draft_has_primary_sources_and_defaults_in_scope(lab_id):
    definition = json.loads(
        (ROOT / "packages/lab-engine/labs" / lab_id / "lab.json").read_text(encoding="utf-8")
    )
    assert definition["review_status"] == "draft"
    assert definition["dataset_version"] == "reaction-network-draft-2026-11-04"
    assert all(
        source["url"].startswith("https://openstax.org/books/") for source in definition["sources"]
    )
    assert MODELS[lab_id](definition["defaults"])
