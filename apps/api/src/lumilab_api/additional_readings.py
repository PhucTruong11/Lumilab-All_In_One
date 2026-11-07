"""Draft deterministic models independent of HTTP, storage, retrieval and LLMs.

Units, initial states and exclusions are declared in each corresponding lab.json.
Numeric validation here also protects direct callers, outside JSON Schema validation.
"""

import math
from collections.abc import Mapping
from typing import Any


def _bounded(value: Any, name: str, minimum: float, maximum: float) -> float:
    if (
        type(value) not in (int, float)
        or not math.isfinite(value)
        or not minimum <= value <= maximum
    ):
        raise ValueError(f"{name} outside model bounds [{minimum}, {maximum}]")
    return float(value)


def parallel_circuit(parameters: Mapping[str, Any], _elapsed_s: float = 0) -> dict:
    voltage = _bounded(parameters["voltage_V"], "voltage_V", 0, 12)
    resistance1 = _bounded(parameters["resistance1_ohm"], "resistance1_ohm", 5, 100)
    resistance2 = _bounded(parameters["resistance2_ohm"], "resistance2_ohm", 5, 100)
    topology = parameters["topology"]
    closed = parameters["switchClosed"]
    if topology not in ("series", "parallel") or type(closed) is not bool:
        raise ValueError("Unsupported network configuration")
    equivalent = (
        resistance1 + resistance2
        if topology == "series"
        else resistance1 * resistance2 / (resistance1 + resistance2)
    )
    total_current = voltage / equivalent if closed else 0.0
    current1 = total_current if topology == "series" else voltage / resistance1 if closed else 0.0
    current2 = total_current if topology == "series" else voltage / resistance2 if closed else 0.0
    return {
        "equivalentResistance_ohm": equivalent,
        "totalCurrent_A": total_current,
        "branch1Current_A": current1,
        "branch2Current_A": current2,
        "resistor1Voltage_V": current1 * resistance1,
        "resistor2Voltage_V": current2 * resistance2,
        "totalPower_W": voltage * total_current,
        "closed": closed,
        "topology": topology,
    }


def capacitor(parameters: Mapping[str, Any], elapsed_s: float = 0) -> dict:
    voltage = _bounded(parameters["voltage_V"], "voltage_V", 0, 12)
    resistance = _bounded(parameters["resistance_ohm"], "resistance_ohm", 100, 10000)
    capacitance = _bounded(parameters["capacitance_uF"], "capacitance_uF", 10, 1000) * 1e-6
    elapsed = _bounded(elapsed_s, "elapsed_s", 0, 120)
    mode = parameters["mode"]
    if mode not in ("charge", "discharge"):
        raise ValueError("Unsupported RC mode")
    time_constant = resistance * capacitance
    decay = math.exp(-elapsed / time_constant)
    capacitor_voltage = voltage * (
        -math.expm1(-elapsed / time_constant) if mode == "charge" else decay
    )
    resistor_voltage = (1 if mode == "charge" else -1) * voltage * decay
    return {
        "elapsed_s": elapsed,
        "timeConstant_s": time_constant,
        "capacitorVoltage_V": capacitor_voltage,
        "resistorVoltage_V": resistor_voltage,
        "current_A": resistor_voltage / resistance,
        "charge_C": capacitance * capacitor_voltage,
        "energy_J": 0.5 * capacitance * capacitor_voltage**2,
    }


def precipitation(parameters: Mapping[str, Any], _elapsed_s: float = 0) -> dict:
    silver_volume = _bounded(parameters["silverVolume_ml"], "silverVolume_ml", 0, 50)
    chloride_volume = _bounded(parameters["chlorideVolume_ml"], "chlorideVolume_ml", 0, 50)
    silver_moles = 0.1 * silver_volume / 1000
    chloride_moles = 0.1 * chloride_volume / 1000
    precipitate_moles = min(silver_moles, chloride_moles)
    return {
        "silverMoles": silver_moles,
        "chlorideMoles": chloride_moles,
        "precipitateMoles": precipitate_moles,
        "precipitateMass_g": precipitate_moles * 143.32,
        "remainingSilverMoles": silver_moles - precipitate_moles,
        "remainingChlorideMoles": chloride_moles - precipitate_moles,
        "totalVolume_ml": silver_volume + chloride_volume,
        "hasPrecipitate": precipitate_moles > 0,
        "limitingReagent": "equivalent"
        if math.isclose(silver_moles, chloride_moles, rel_tol=1e-12, abs_tol=0)
        else "AgNO3"
        if silver_moles < chloride_moles
        else "NaCl",
        "equation": "AgNO₃ + NaCl → AgCl + NaNO₃",
        "ionicEquation": "Ag⁺ + Cl⁻ → AgCl",
    }


def gas_reaction(parameters: Mapping[str, Any], _elapsed_s: float = 0) -> dict:
    acid_volume = _bounded(parameters["acidVolume_ml"], "acidVolume_ml", 0, 50)
    bicarbonate_mass = _bounded(parameters["bicarbonateMass_g"], "bicarbonateMass_g", 0, 1)
    acid_moles = 0.1 * acid_volume / 1000
    bicarbonate_moles = bicarbonate_mass / 84.0066
    reaction_moles = min(acid_moles, bicarbonate_moles)
    molar_volume_l = 0.082057366080960 * 298.15 / 1
    return {
        "acidMoles": acid_moles,
        "bicarbonateMoles": bicarbonate_moles,
        "reactionMoles": reaction_moles,
        "carbonDioxideVolume_ml": reaction_moles * molar_volume_l * 1000,
        "remainingAcidMoles": acid_moles - reaction_moles,
        "remainingBicarbonateMoles": bicarbonate_moles - reaction_moles,
        "hasGas": reaction_moles > 0,
        "limitingReagent": "equivalent"
        if math.isclose(acid_moles, bicarbonate_moles, rel_tol=1e-12, abs_tol=0)
        else "HCl"
        if acid_moles < bicarbonate_moles
        else "NaHCO3",
        "equation": "HCl + NaHCO₃ → NaCl + H₂O + CO₂",
    }
