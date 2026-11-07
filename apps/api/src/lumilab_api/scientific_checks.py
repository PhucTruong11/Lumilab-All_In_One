"""Bounded, independent checks of deterministic draft readings.

These checks neither approve sources nor infer reaction feasibility from atom
balance. Chemistry uses a small, explicit catalog at its declared ideal-model
conditions. The caller must still enforce schema, revision and evidence gates.
"""
import re
from collections import Counter
from collections.abc import Callable, Mapping
from dataclasses import dataclass
from math import atan2, cos, exp, isclose, isfinite, log10, pi, sin, sqrt, tan
from sys import float_info
from typing import Any


class FormulaSyntaxError(ValueError):
    """Malformed input within the simple neutral-formula grammar."""


class UnsupportedFormula(ValueError):
    """A formula may exist, but is outside this parser's declared grammar."""


_TOKEN = re.compile(r"([A-Z][a-z]?)([0-9]*)")
_ELEMENTS = frozenset({"H", "C", "O", "N", "Na", "Cl", "Ag", "K"})
_SUBSCRIPTS = str.maketrans("₀₁₂₃₄₅₆₇₈₉", "0123456789")
_QUANTITATIVE_CHEMISTRY_LABS = {"chemistry", "precipitation", "gas-reaction"}
_QUALITATIVE_CHEMISTRY_LABS = {"alkali-water", "copper-nitric", "chlorine-bleach"}


def required_science_stages(lab_id: str) -> set[str]:
    if lab_id in _QUANTITATIVE_CHEMISTRY_LABS:
        return {"formula_equation", "scientific_rules", "quantitative", "simulation"}
    if lab_id in _QUALITATIVE_CHEMISTRY_LABS:
        return {"simulation"}
    return {"physics_invariants"}


def parse_formula(formula: str) -> dict[str, int]:
    """Count atoms in ASCII neutral formulas; no ions, groups or hydrates.

    Limits are defensive, not chemical constraints: 64 characters, 16 tokens,
    and subscripts 1..999. Element support is limited to the reaction catalog.
    A syntactically accepted formula is not an assertion that a substance exists.
    """
    if not isinstance(formula, str) or not formula:
        raise FormulaSyntaxError("A nonempty formula string is required.")
    if len(formula) > 64:
        raise UnsupportedFormula("Formula exceeds the supported length.")
    if any(char in formula for char in "()[]{}.+-·⁺⁻₀₁₂₃₄₅₆₇₈₉"):
        raise UnsupportedFormula("Groups, ions, hydrates and non-ASCII subscripts are unsupported.")
    atoms: Counter[str] = Counter()
    position = 0
    tokens = 0
    while position < len(formula):
        match = _TOKEN.match(formula, position)
        if match is None:
            raise FormulaSyntaxError("Expected an element symbol followed by an optional subscript.")
        element, digits = match.groups()
        if element not in _ELEMENTS:
            raise UnsupportedFormula(f"Element {element} is outside the supported catalog.")
        if digits and (digits.startswith("0") or len(digits) > 3):
            raise FormulaSyntaxError("Subscripts must be integers from 1 through 999.")
        count = int(digits) if digits else 1
        atoms[element] += count
        position = match.end()
        tokens += 1
        if tokens > 16:
            raise UnsupportedFormula("Formula exceeds the supported token count.")
    return dict(atoms)


def equation_is_balanced(
    reactants: Mapping[str, int], products: Mapping[str, int],
) -> bool:
    """Check atoms in an explicit equation, without predicting its products."""
    def totals(side: Mapping[str, int]) -> Counter[str]:
        if not side:
            raise FormulaSyntaxError("Each equation side must contain a substance.")
        total: Counter[str] = Counter()
        for formula, coefficient in side.items():
            if type(coefficient) is not int or not 1 <= coefficient <= 999:
                raise FormulaSyntaxError("Coefficients must be integers from 1 through 999.")
            total.update({atom: count * coefficient for atom, count in parse_formula(formula).items()})
        return total

    return totals(reactants) == totals(products)


@dataclass(frozen=True)
class Reaction:
    reactants: tuple[str, ...]
    products: tuple[str, ...]
    conditions: str

    @property
    def equation(self) -> str:
        return "+".join(self.reactants) + "->" + "+".join(self.products)


_TITRATION = {
    ("hcl", "naoh"): Reaction(("HCl", "NaOH"), ("NaCl", "H2O"), ""),
    ("hcl", "koh"): Reaction(("HCl", "KOH"), ("KCl", "H2O"), ""),
    ("hno3", "naoh"): Reaction(("HNO3", "NaOH"), ("NaNO3", "H2O"), ""),
    ("hno3", "koh"): Reaction(("HNO3", "KOH"), ("KNO3", "H2O"), ""),
}
_PRECIPITATION = Reaction(
    ("AgNO3", "NaCl"), ("AgCl", "NaNO3"),
    "Ideal aqueous 0.1 mol/L feeds; complete 1:1 precipitation approximation; no Ksp kinetics.",
)
_GAS = Reaction(
    ("HCl", "NaHCO3"), ("NaCl", "H2O", "CO2"),
    "0.1 mol/L HCl, complete 1:1 conversion; dry ideal CO2 at 298.15 K and 1 atm.",
)


class _CheckFailure(Exception):
    def __init__(self, status: str, code: str, reason: str):
        self.status, self.code, self.reason = status, code, reason


def _number(data: Mapping[str, Any], key: str, *, positive: bool = False) -> float:
    if key not in data:
        raise _CheckFailure("insufficient_data", "MISSING_QUANTITY", f"Missing {key}.")
    value = data[key]
    if type(value) not in (int, float) or not isfinite(value):
        raise _CheckFailure("invalid", "INVALID_QUANTITY", f"{key} must be a finite number.")
    if positive and value <= 0:
        raise _CheckFailure("invalid", "INVALID_QUANTITY", f"{key} must be positive.")
    return float(value)


def _expect(actual: Any, expected: Any, name: str, *, abs_tol: float = 1e-12) -> None:
    if type(expected) in (int, float):
        if (type(actual) not in (int, float) or not isfinite(actual)
                or not isclose(actual, expected, rel_tol=2e-9, abs_tol=abs_tol)):
            raise _CheckFailure("invalid", "CONSERVATION_MISMATCH", f"Inconsistent {name}.")
    elif actual != expected or (isinstance(expected, bool) and type(actual) is not bool):
        raise _CheckFailure("invalid", "STATE_MISMATCH", f"Inconsistent {name}.")


def _field(reading: Mapping[str, Any], key: str, expected: Any, **tolerance: Any) -> None:
    if key not in reading:
        raise _CheckFailure("insufficient_data", "MISSING_READING", f"Missing {key}.")
    _expect(reading[key], expected, key, **tolerance)


def _nonnegative_quantity(reading: Mapping[str, Any], key: str, expected: float) -> None:
    value = _number(reading, key)
    if value < 0:
        raise _CheckFailure("invalid", "NEGATIVE_QUANTITY", f"{key} must be nonnegative.")
    _expect(value, expected, key)


def _stage(stage: str, check: Callable[[], str]) -> dict[str, str]:
    try:
        return {"stage": stage, "status": "pass", "code": "CHECK_PASSED", "reason": check()}
    except _CheckFailure as error:
        return {"stage": stage, "status": error.status, "code": error.code, "reason": error.reason}
    except KeyError as error:
        return {"stage": stage, "status": "insufficient_data", "code": "MISSING_INPUT",
                "reason": f"Missing required field {error.args[0]}."}


def _normalize_equation(equation: str) -> str:
    return "".join(equation.translate(_SUBSCRIPTS).replace("→", "->").split())


def _check_equation(reaction: Reaction, reading: Mapping[str, Any]) -> str:
    if not equation_is_balanced(dict.fromkeys(reaction.reactants, 1),
                                dict.fromkeys(reaction.products, 1)):
        raise _CheckFailure("invalid", "UNBALANCED_CATALOG", "Catalog equation does not conserve atoms.")
    equation = reading.get("equation")
    if equation is None:
        raise _CheckFailure("insufficient_data", "MISSING_EQUATION", "Missing reaction equation.")
    if not isinstance(equation, str) or _normalize_equation(equation) != reaction.equation:
        raise _CheckFailure("invalid", "EQUATION_MISMATCH", "Reading differs from the catalog equation.")
    return "Neutral catalog formulas conserve atoms; balance alone does not establish feasibility."


def _chemistry_scope(lab_id: str, p: Mapping[str, Any]) -> Reaction:
    if lab_id == "chemistry":
        if "acid" not in p or "base" not in p:
            raise _CheckFailure("insufficient_data", "MISSING_REAGENT", "Missing acid or base choice.")
        if not isinstance(p["acid"], str) or not isinstance(p["base"], str):
            raise _CheckFailure("invalid", "INVALID_REAGENT", "Reagent choices must be strings.")
        reaction = _TITRATION.get((p["acid"], p["base"]))
        if reaction is None:
            raise _CheckFailure("unsupported", "REACTION_UNSUPPORTED", "Only four strong 1:1 pairs are supported.")
        bounds = {"baseVolume_ml": (0, 50)}
        allowed = set(bounds) | {"acid", "base"}
    elif lab_id == "precipitation":
        reaction = _PRECIPITATION
        bounds = {"silverVolume_ml": (0, 50), "chlorideVolume_ml": (0, 50)}
        allowed = set(bounds)
    else:
        reaction = _GAS
        bounds = {"acidVolume_ml": (0, 50), "bicarbonateMass_g": (0, 1)}
        allowed = set(bounds)
    if set(p) - allowed:
        raise _CheckFailure("unsupported", "CONDITION_UNSUPPORTED", "Extra conditions are outside this fixed-condition model.")
    for name, (low, high) in bounds.items():
        if not low <= _number(p, name) <= high:
            raise _CheckFailure("unsupported", "CONDITION_UNSUPPORTED", f"{name} is outside the model range.")
    return reaction


def _titration_quantities(p: Mapping[str, Any], r: Mapping[str, Any]) -> str:
    acid, base = 0.0025, _number(p, "baseVolume_ml") * 0.0001
    salt = min(acid, base)
    for key, value in {
        "acidMoles": acid, "baseMoles": base, "saltMoles": salt,
        "remainingAcidMoles": acid - salt, "remainingBaseMoles": base - salt,
        "totalVolume_ml": 25 + p["baseVolume_ml"], "equivalenceVolume_ml": 25,
    }.items():
        _nonnegative_quantity(r, key, value)
    return "mL-to-L conversion and 1:1 reagent/salt balances hold for fixed 0.1 mol/L feeds."


def _titration_state(p: Mapping[str, Any], r: Mapping[str, Any]) -> str:
    hydrogen = _number(r, "hydrogen_mol_L", positive=True)
    difference = (0.0025 - p["baseVolume_ml"] * 0.0001) / ((25 + p["baseVolume_ml"]) / 1000)
    _expect(hydrogen - 1e-14 / hydrogen, difference, "aqueous charge balance", abs_tol=1e-12)
    ph = -log10(hydrogen)
    _field(r, "pH", ph)
    _field(r, "indicatorFraction", max(0, min(1, (ph - 8.2) / 1.8)))
    _field(r, "salt", ("Na" if p["base"] == "naoh" else "K")
           + ("Cl" if p["acid"] == "hcl" else "NO₃"))
    acid, base = 0.025 * 0.1, p["baseVolume_ml"] / 1000 * 0.1
    # The stage label has a machine-roundoff tolerance, distinct from the
    # physical pH/charge checks and from any experimental uncertainty.
    stage = "equivalence" if abs(acid - base) <= 4 * float_info.epsilon * max(acid, base) else (
        "acid" if acid > base else "base")
    _field(r, "stage", stage)
    return "pH, water auto-ionization and neutralization stage agree; indicator color is illustrative."


def _precipitation_quantities(p: Mapping[str, Any], r: Mapping[str, Any]) -> str:
    silver = p["silverVolume_ml"] * 0.0001
    chloride = p["chlorideVolume_ml"] * 0.0001
    extent = min(silver, chloride)
    for key, value in {
        "silverMoles": silver, "chlorideMoles": chloride, "precipitateMoles": extent,
        "precipitateMass_g": extent * 143.32, "remainingSilverMoles": silver - extent,
        "remainingChlorideMoles": chloride - extent,
        "totalVolume_ml": p["silverVolume_ml"] + p["chlorideVolume_ml"],
    }.items():
        _nonnegative_quantity(r, key, value)
    return "Ag/Cl reagent balances and AgCl mass conversion hold within the complete-precipitation approximation."


def _gas_quantities(p: Mapping[str, Any], r: Mapping[str, Any]) -> str:
    acid = p["acidVolume_ml"] * 0.0001
    bicarbonate = p["bicarbonateMass_g"] / 84.0066
    extent = min(acid, bicarbonate)
    for key, value in {
        "acidMoles": acid, "bicarbonateMoles": bicarbonate, "reactionMoles": extent,
        "remainingAcidMoles": acid - extent,
        "remainingBicarbonateMoles": bicarbonate - extent,
        "carbonDioxideVolume_ml": extent * 0.082057366080960 * 298.15 * 1000,
    }.items():
        _nonnegative_quantity(r, key, value)
    return "1:1 reaction extent and ideal dry CO2 volume at 25°C/1 atm agree; dissolved CO2 is omitted."


def _reaction_state(lab_id: str, p: Mapping[str, Any], r: Mapping[str, Any]) -> str:
    if lab_id == "precipitation":
        first, second = p["silverVolume_ml"] * 0.0001, p["chlorideVolume_ml"] * 0.0001
        _field(r, "hasPrecipitate", min(first, second) > 0)
        first_label, second_label = "AgNO3", "NaCl"
    else:
        first, second = p["acidVolume_ml"] * 0.0001, p["bicarbonateMass_g"] / 84.0066
        _field(r, "hasGas", min(first, second) > 0)
        first_label, second_label = "HCl", "NaHCO3"
    _field(r, "limitingReagent", "equivalent" if isclose(first, second, rel_tol=1e-12, abs_tol=0) else (
        first_label if first < second else second_label))
    return "Product presence agrees with positive reaction extent; no reaction kinetics are inferred."


def _physics_checks(lab_id: str, p: Mapping[str, Any], r: Mapping[str, Any]) -> str:
    """Validate invariants independently of the rendering and model functions."""
    if lab_id == "pendulum":
        length, mass, gravity = (_number(p, key, positive=True)
                                 for key in ("length_m", "mass_kg", "gravity_m_s2"))
        angle = _number(p, "angle_deg")
        height = 2 * length * sin(angle * pi / 360) ** 2
        _field(r, "energy_j", mass * gravity * height)
        _field(r, "max_speed_m_s", sqrt(2 * gravity * height))
        if angle == 0:
            _field(r, "period_s", None)
            _field(r, "frequency_hz", None)
        else:
            # Power-series evaluation of K, independent of the reading's AGM.
            parameter, term, total = sin(angle * pi / 360) ** 2, 1.0, 1.0
            for order in range(1, 64):
                term *= ((2 * order - 1) / (2 * order)) ** 2 * parameter
                total += term
                if term < 1e-16:
                    break
            period = 2 * pi * sqrt(length / gravity) * total
            _field(r, "period_s", period)
            _field(r, "frequency_hz", 1 / period)
        return "Nonlinear period checked by independent elliptic series; energy and speed obey conservation."
    if lab_id == "mechanics":
        mass = _number(p, "mass_kg", positive=True)
        force, initial = _number(p, "force_N"), _number(p, "initialVelocity_m_s")
        velocity, position = _number(r, "velocity_m_s"), _number(r, "position_m")
        _field(r, "acceleration_m_s2", force / mass)
        _field(r, "kineticEnergy_J", mass * velocity ** 2 / 2)
        _expect(mass * (velocity ** 2 - initial ** 2) / 2, force * position, "work-energy theorem")
        return "Newton II and work-energy invariants agree; phase/time is recomputed by the caller."
    if lab_id == "spring":
        mass, stiffness = _number(p, "mass_kg", positive=True), _number(p, "stiffness_N_m", positive=True)
        amplitude = _number(p, "displacement_m")
        position, velocity = _number(r, "displacement_m"), _number(r, "velocity_m_s")
        energy = stiffness * amplitude ** 2 / 2
        _field(r, "omega_rad_s", sqrt(stiffness / mass))
        _field(r, "period_s", 2 * pi * sqrt(mass / stiffness) if amplitude else None)
        _field(r, "force_N", -stiffness * position)
        _field(r, "potentialEnergy_J", stiffness * position ** 2 / 2)
        _field(r, "kineticEnergy_J", mass * velocity ** 2 / 2)
        _field(r, "totalEnergy_J", energy)
        _expect(stiffness * position ** 2 / 2 + mass * velocity ** 2 / 2, energy, "spring energy")
        return "Hooke force, frequency and kinetic/potential energy conserve total energy."
    if lab_id == "circuit":
        resistance, voltage = _number(p, "resistance_ohm", positive=True), _number(p, "voltage_V")
        slots = p.get("slots", [])
        total = resistance + 20 * ("extraResistor" in slots) + 10 * ("bulb" in slots)
        closed = "switchInstalled" not in slots or p["switchClosed"]
        valid = p["ammeter"] == "series" and p["voltmeter"] == "parallel"
        _field(r, "totalResistance_ohm", total)
        _field(r, "valid", valid)
        _field(r, "closed", closed)
        current = (voltage / total if closed else 0) if valid else None
        _field(r, "current_A", current)
        _field(r, "resistorVoltage_V", None if current is None else current * resistance)
        _field(r, "power_W", None if current is None else voltage * current)
        _field(r, "bulbPower_W", None if current is None else current ** 2 * 10 * ("bulb" in slots))
        return "Series resistance, meter placement, open switch, Ohm law and power agree."
    if lab_id == "parallel-circuit":
        voltage = _number(p, "voltage_V")
        first, second = (_number(p, key, positive=True)
                         for key in ("resistance1_ohm", "resistance2_ohm"))
        parallel = p["topology"] == "parallel"
        resistance = 1 / (1 / first + 1 / second) if parallel else first + second
        closed = p["switchClosed"]
        current = voltage / resistance if closed else 0
        one, two = ((voltage / first, voltage / second) if parallel else (current, current))
        if not closed:
            one = two = 0
        for key, value in {
            "equivalentResistance_ohm": resistance, "totalCurrent_A": current,
            "branch1Current_A": one, "branch2Current_A": two,
            "resistor1Voltage_V": one * first, "resistor2Voltage_V": two * second,
            "totalPower_W": voltage * current, "closed": closed, "topology": p["topology"],
        }.items():
            _field(r, key, value)
        if parallel:
            _expect(one + two, current, "Kirchhoff current balance")
        else:
            _expect(one * first + two * second, voltage if closed else 0, "Kirchhoff voltage balance")
        return "Ohm law, branch currents, Kirchhoff balance and electrical power agree."
    if lab_id == "capacitor":
        voltage = _number(p, "voltage_V")
        resistance = _number(p, "resistance_ohm", positive=True)
        capacitance = _number(p, "capacitance_uF", positive=True) * 1e-6
        elapsed = _number(r, "elapsed_s")
        if elapsed < 0:
            raise _CheckFailure("invalid", "INVALID_QUANTITY", "elapsed_s must be nonnegative.")
        tau = resistance * capacitance
        decay = exp(-elapsed / tau)
        capacitor = voltage * (1 - decay if p["mode"] == "charge" else decay)
        resistor = voltage - capacitor if p["mode"] == "charge" else -capacitor
        for key, value in {
            "timeConstant_s": tau, "capacitorVoltage_V": capacitor,
            "resistorVoltage_V": resistor, "current_A": resistor / resistance,
            "charge_C": capacitance * capacitor, "energy_J": capacitance * capacitor ** 2 / 2,
        }.items():
            _field(r, key, value)
        return "RC exponential, signed Ohm current, charge and stored energy agree at the reported time."
    if lab_id == "atomic":
        protons, neutrons, electrons = (_number(p, key) for key in ("protons", "neutrons", "electrons"))
        _field(r, "atomicNumber", protons)
        _field(r, "massNumber", protons + neutrons)
        _field(r, "charge_e", protons - electrons)
        shells = r.get("shells")
        if not isinstance(shells, list) or any(type(count) is not int or count < 0 for count in shells):
            raise _CheckFailure("invalid", "STATE_MISMATCH", "Invalid illustrative electron shell counts.")
        _expect(sum(shells), electrons, "electron count")
        return "Nucleon/electron counts and charge agree; isotope stability is not asserted."
    if lab_id == "electrochemistry":
        potentials = {"zn": -0.76, "cu": 0.34, "ag": 0.80}
        if p.get("left") not in potentials or p.get("right") not in potentials:
            raise _CheckFailure("unsupported", "ELECTRODE_UNSUPPORTED", "Only Zn/Cu/Ag standard half cells are supported.")
        voltage = potentials[p["right"]] - potentials[p["left"]]
        _field(r, "voltage_V", voltage)
        _field(r, "emf_V", abs(voltage))
        _field(r, "meterVoltage_V", voltage if p["bridgeConnected"] else None)
        return "Rounded standard-potential difference agrees at 25°C/unit activity; no kinetics checked."
    raise _CheckFailure("unsupported", "MODEL_UNSUPPORTED", "No independent invariants for this model.")


def _curriculum_physics(
    lab_id: str, p: Mapping[str, Any], r: Mapping[str, Any], elapsed_s: float | None,
) -> str:
    mass = p["mass_kg"]
    if lab_id == "pulley":
        _field(r, "weight_N", mass * 9.81)
        _field(r, "pull_N", mass * 9.81 / p["strands"])
        _field(r, "rope_m", p["lift_m"] * p["strands"])
        _field(r, "work_J", mass * 9.81 * p["lift_m"])
        return "Supporting strands balance the load; input work equals gravitational work."
    if lab_id == "inclined-plane":
        angle = p["angle_deg"] * pi / 180
        _field(r, "normal_N", mass * 9.81 * cos(angle))
        _field(r, "downhill_N", mass * 9.81 * sin(angle))
        stationary = tan(angle) <= p["static_friction"] + 1e-12
        normal = mass * 9.81 * cos(angle)
        downhill = mass * 9.81 * sin(angle)
        expected_friction = downhill if stationary else 0.8 * p["static_friction"] * normal
        _field(r, "friction_N", expected_friction)
        acceleration = (downhill - expected_friction) / mass
        _field(r, "acceleration_m_s2", acceleration)
        time = _number(r, "time_s")
        arrival = sqrt(10 / acceleration) if acceleration > 0 else float("inf")
        if time < 0 or time > arrival + 1e-10:
            raise _CheckFailure("invalid", "SIMULATION_TIME_MISMATCH", "Ramp time exceeds the modeled trip.")
        if elapsed_s is not None:
            _field(r, "time_s", min(elapsed_s, arrival))
        state = ("Đứng yên" if stationary else "Sẵn sàng trượt" if time == 0 else
                 "Đến cuối dốc" if time >= arrival else "Đang trượt")
        _field(r, "state", state)
        distance = _number(r, "position_m")
        if not 0 <= distance <= 5:
            raise _CheckFailure("invalid", "RAMP_BOUNDS", "Position is outside the 5 m ramp.")
        _field(r, "position_m", acceleration * time ** 2 / 2)
        _field(r, "velocity_m_s", sqrt(2 * acceleration * distance))
        return "Normal force, friction, acceleration and rest-release kinematics agree."
    initial = p["displacement_m"]
    stiffness = p["stiffness_N_m"]
    time = _number(r, "time_s")
    if time < 0:
        raise _CheckFailure("invalid", "SIMULATION_TIME_MISMATCH", "Spring time must be nonnegative.")
    if elapsed_s is not None:
        _field(r, "time_s", elapsed_s)
    natural = sqrt(stiffness / mass)
    decay = p["damping_ratio"] * natural
    omega = sqrt(natural ** 2 - decay ** 2)
    phase = atan2(decay, omega)
    envelope = abs(initial) * natural / omega * exp(-decay * time)
    _field(r, "envelope_m", envelope)
    x, v = _number(r, "displacement_m"), _number(r, "velocity_m_s")
    expected_x = initial * natural / omega * exp(-decay * time) * cos(omega * time - phase)
    expected_v = -initial * natural ** 2 / omega * exp(-decay * time) * sin(omega * time)
    _expect(x, expected_x, "displacement_m")
    _expect(v, expected_v, "velocity_m_s")
    energy = (mass * v ** 2 + stiffness * x ** 2) / 2
    _field(r, "energy_J", energy)
    initial_energy = stiffness * initial ** 2 / 2
    if energy > initial_energy + 1e-10 or abs(x) > _number(r, "envelope_m") + 1e-10:
        raise _CheckFailure("invalid", "DAMPING_BOUNDS", "Energy or displacement exceeds its bound.")
    if p["damping_ratio"] == 0:
        _field(r, "energy_J", initial_energy)
    if initial == 0:
        _field(r, "period_s", None)
    else:
        period = _number(r, "period_s", positive=True)
        _expect(period ** 2 * stiffness * (1 - p["damping_ratio"] ** 2), 4 * pi ** 2 * mass, "period")
    if time == 0:
        _field(r, "displacement_m", initial)
        _field(r, "velocity_m_s", 0)
    return "Mechanical energy, damped period, envelope and release conditions agree."


def _curriculum_chemistry(lab_id: str, p: Mapping[str, Any], r: Mapping[str, Any]) -> str:
    equation = None
    if not p["observed"]:
        product, appearance = None, None
        detail = "Chọn điều kiện, dự đoán hiện tượng rồi quan sát."
    elif lab_id == "alkali-water":
        metal = p["metal"]
        if p["mode"] == "water":
            product, appearance = metal + "OH và H₂", "Bọt khí"
            equation = f"2{metal} + 2H₂O → 2{metal}OH + H₂"
            detail = "Hydrogen thoát ra và dung dịch có tính kiềm."
            if not equation_is_balanced({metal: 2, "H2O": 2}, {metal + "OH": 2, "H2": 1}):
                raise _CheckFailure("invalid", "UNBALANCED_CATALOG", "Alkali equation is not balanced.")
        else:
            product, appearance = metal + "⁺", {"Na": "Vàng", "K": "Tím nhạt"}[metal]
            detail = "Màu minh họa của ion trong phép thử ngọn lửa riêng."
    elif lab_id == "copper-nitric":
        if p["acid"] == "dilute":
            product, appearance = "NO", "Có thể chuyển nâu đỏ" if p["air"] else "Không màu"
            equation = "3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O"
            detail = ("NO ban đầu không màu. Khi gặp oxygen, một phần có thể chuyển thành NO₂: "
                      "2NO + O₂ → 2NO₂." if p["air"] else
                      "Kịch bản đại diện cho đồng với axit loãng. Khí NO ban đầu không màu.")
        else:
            product, appearance = "NO₂", "Nâu đỏ"
            equation = "Cu + 4HNO₃ → Cu(NO₃)₂ + 2NO₂ + 2H₂O"
            detail = "Kịch bản đại diện cho đồng với axit đặc. Sản phẩm khí chính của mô hình là NO₂."
    elif p["mode"] == "formation":
        product, appearance = "Cl₂", "Minh họa oxi hóa"
        equation = "2Cl⁻ → Cl₂ + 2e⁻"
        detail = "Hai ion chloride nhường hai electron để tạo một phân tử clo."
    elif p["damp"]:
        product, appearance = "HOCl", "Giấy màu nhạt rõ"
        equation = "Cl₂ + H₂O ⇌ HCl + HOCl"
        detail = "HOCl tạo trong môi trường có nước và oxi hóa chất màu trong mô hình."
        if not equation_is_balanced({"Cl2": 1, "H2O": 1}, {"HCl": 1, "HOCl": 1}):
            raise _CheckFailure("invalid", "UNBALANCED_CATALOG", "Chlorine equation is not balanced.")
    else:
        product, appearance = None, "Không thấy tẩy màu rõ"
        detail = "Đối chứng dùng giấy khô trong điều kiện khô. Kết luận giới hạn trong kịch bản này."
    _field(r, "product", product)
    _field(r, "appearance", appearance)
    _field(r, "equation", equation)
    _field(r, "detail", detail)
    return "Observation matches the explicit draft scenario. No reaction rate or yield is inferred."


def check_science(
    lab_id: str, parameters: Mapping[str, Any], reading: Mapping[str, Any],
    elapsed_s: float | None = None,
) -> list[dict[str, str]]:
    """Return stage evidence, never a final review/VERIFIED decision.

    Inputs normally have already passed the runtime schema. Missing readings or
    unsupported reaction conditions return explicit stages rather than approval.
    """
    if lab_id in {"spring-damped", "inclined-plane", "pulley"}:
        return [_stage("physics_invariants", lambda: _curriculum_physics(lab_id, parameters, reading, elapsed_s))]
    if lab_id in _QUALITATIVE_CHEMISTRY_LABS:
        return [
            _stage("simulation", lambda: _curriculum_chemistry(lab_id, parameters, reading)),
            {"stage": "quantitative", "status": "skipped", "code": "QUALITATIVE_MODEL",
             "reason": "The observation has no quantitative rate, yield or concentration output."},
        ]
    if lab_id in _QUANTITATIVE_CHEMISTRY_LABS:
        try:
            reaction = _chemistry_scope(lab_id, parameters)
        except _CheckFailure as error:
            return [{"stage": "scientific_rules", "status": error.status,
                     "code": error.code, "reason": error.reason}]
        conditions = ("Ideal strong monoprotic acid/monobasic base, 0.1 mol/L, "
                      "25 mL initial acid, 25°C; additive volumes.") if lab_id == "chemistry" else reaction.conditions
        quantities = {"chemistry": _titration_quantities, "precipitation": _precipitation_quantities,
                      "gas-reaction": _gas_quantities}[lab_id]
        state = (lambda: _titration_state(parameters, reading)) if lab_id == "chemistry" else (
            lambda: _reaction_state(lab_id, parameters, reading))
        return [
            _stage("formula_equation", lambda: _check_equation(reaction, reading)),
            {"stage": "charge_balance", "status": "skipped", "code": "NEUTRAL_GRAMMAR_ONLY",
             "reason": "Neutral formula parser does not parse ions or establish ionic charge balance."},
            {"stage": "scientific_rules", "status": "pass", "code": "DRAFT_CATALOG_MATCH",
             "reason": f"Matches the declared draft catalog; source review is still required. {conditions}"},
            _stage("quantitative", lambda: quantities(parameters, reading)),
            _stage("simulation", state),
        ]
    if lab_id in {"pendulum", "mechanics", "spring", "circuit", "parallel-circuit",
                  "capacitor", "atomic", "electrochemistry"}:
        return [
            {"stage": "formula_equation", "status": "skipped", "code": "NOT_APPLICABLE",
             "reason": "Neutral-reaction formula balancing is not applied to this model."},
            _stage("physics_invariants", lambda: _physics_checks(lab_id, parameters, reading)),
        ]
    return [{"stage": "scientific_rules", "status": "skipped", "code": "MODEL_UNSUPPORTED",
             "reason": "No independent scientific checks are registered for this lab."}]
