"""Deterministic readings for the seven browser model revisions.

Scopes, units and source references come from each lab.json. Readings here are
draft model outputs. Electrodes use rounded standard potentials at 25 °C;
atomic shells illustrate counts only.
"""
from math import cos, hypot, log10, pi, sin, sqrt
from sys import float_info

from lumilab_api.additional_readings import capacitor, gas_reaction, parallel_circuit, precipitation
from lumilab_api.curriculum_readings import alkali, chlorine, damped_spring, incline, nitric, pulley


def pendulum(p, _time):
    length, mass, angle, gravity = (p[key] for key in (
        "length_m", "mass_kg", "angle_deg", "gravity_m_s2",
    ))
    half_angle = angle * pi / 360
    arithmetic, geometric = 1.0, cos(half_angle)
    for _ in range(12):
        if abs(arithmetic - geometric) <= 2 * float_info.epsilon:
            break
        arithmetic, geometric = (arithmetic + geometric) / 2, sqrt(arithmetic * geometric)
    period = 2 * pi * sqrt(length / gravity) / arithmetic
    height = 2 * length * sin(half_angle) ** 2
    return {
        "period_s": period if angle else None,
        "frequency_hz": 1 / period if angle else None,
        "energy_j": mass * gravity * height,
        "max_speed_m_s": sqrt(2 * gravity * height),
    }


def titration(p, _time):
    volume = p["baseVolume_ml"]
    acid, base = p["acid"], p["base"]
    acid_moles, base_moles = .025 * .1, volume / 1000 * .1
    excess = acid_moles - base_moles
    difference = excess / ((25 + volume) / 1000)
    root = hypot(difference, 2e-7)
    hydrogen = (root + difference) / 2 if difference >= 0 else 2e-14 / (root - difference)
    ph = -log10(hydrogen)
    acid_label = {"hcl": "HCl", "hno3": "HNO₃"}[acid]
    base_label = {"naoh": "NaOH", "koh": "KOH"}[base]
    salt = ("Na" if base == "naoh" else "K") + ("Cl" if acid == "hcl" else "NO₃")
    stage = "acid" if excess > 0 else "base"
    if abs(excess) <= 4 * float_info.epsilon * max(acid_moles, base_moles):
        stage = "equivalence"
    return {
        "pH": ph, "hydrogen_mol_L": hydrogen,
        "indicatorFraction": max(0, min(1, (ph - 8.2) / 1.8)),
        "salt": salt, "totalVolume_ml": 25 + volume,
        "equation": f"{acid_label} + {base_label} → {salt} + H₂O",
        "acidMoles": acid_moles, "baseMoles": base_moles,
        "saltMoles": min(acid_moles, base_moles),
        "remainingAcidMoles": max(0, excess), "remainingBaseMoles": max(0, -excess),
        "equivalenceVolume_ml": 25, "stage": stage,
    }


def circuit(p, _time):
    slots = p["slots"]
    resistance = p["resistance_ohm"]
    total = resistance + 20 * slots.count("extraResistor") + 10 * (slots.count("resistor10") + slots.count("bulb"))
    closed = "switchInstalled" not in slots or p["switchClosed"]
    valid = p["ammeter"] == "series" and p["voltmeter"] == "parallel"
    current = (p["voltage_V"] / total if closed else 0) if valid else None
    return {
        "valid": valid, "closed": closed, "totalResistance_ohm": total,
        "current_A": current,
        "resistorVoltage_V": None if current is None else current * resistance,
        "power_W": None if current is None else current * p["voltage_V"],
        "bulbPower_W": None if current is None else current ** 2 * 10 * slots.count("bulb"),
    }


def mechanics(p, time):
    mass, initial = p["mass_kg"], p["initialVelocity_m_s"]
    acceleration = p["force_N"] / mass
    velocity = initial + acceleration * time
    return {
        "acceleration_m_s2": acceleration, "velocity_m_s": velocity,
        "position_m": initial * time + .5 * acceleration * time ** 2,
        "kineticEnergy_J": .5 * mass * velocity ** 2,
    }


def spring(p, time):
    mass, stiffness, amplitude = p["mass_kg"], p["stiffness_N_m"], p["displacement_m"]
    omega = sqrt(stiffness / mass)
    position = amplitude * cos(omega * time)
    velocity = -omega * amplitude * sin(omega * time)
    return {
        "omega_rad_s": omega, "period_s": 2 * pi / omega if amplitude else None,
        "displacement_m": position, "velocity_m_s": velocity,
        "force_N": -stiffness * position, "potentialEnergy_J": .5 * stiffness * position ** 2,
        "kineticEnergy_J": .5 * mass * velocity ** 2,
        "totalEnergy_J": .5 * stiffness * amplitude ** 2,
    }


ELECTRODES = {
    "zn": ("Zn", "Zn²⁺", -.76, 2),
    "cu": ("Cu", "Cu²⁺", .34, 2),
    "ag": ("Ag", "Ag⁺", .80, 1),
}


def electrochemistry(p, _time):
    left, right = ELECTRODES[p["left"]], ELECTRODES[p["right"]]
    voltage = right[2] - left[2]
    reading = {
        "voltage_V": voltage, "emf_V": abs(voltage),
        "meterVoltage_V": voltage if p["bridgeConnected"] else None,
        "anodeSide": None, "cathodeSide": None, "anode": None, "cathode": None,
        "exchangedElectrons": 0, "reaction": "Hai điện cực giống nhau: E°pin = 0 V",
        "electronDirection": "Không có chiều tự phát",
    }
    if left == right:
        return reading

    anode, cathode = (left, right) if voltage > 0 else (right, left)
    count = max(anode[3], cathode[3])
    a, c = ("" if count == electrode[3] else str(count // electrode[3])
            for electrode in (anode, cathode))
    reading.update(
        anodeSide="left" if voltage > 0 else "right",
        cathodeSide="right" if voltage > 0 else "left",
        anode=anode[0], cathode=cathode[0], exchangedElectrons=count,
        reaction=f"{a}{anode[0]} + {c}{cathode[1]} → {a}{anode[1]} + {c}{cathode[0]}",
        electronDirection=f"{anode[0]} → {cathode[0]}",
    )
    return reading


ELEMENTS = tuple(zip(
    "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar".split(),
    "Hiđro Heli Liti Beri Bo Cacbon Nitơ Oxi Flo Neon Natri Magie Nhôm Silic Photpho Lưu-huỳnh Clo Argon".split(),
    strict=True,
))


def atomic(p, _time):
    protons, neutrons, electrons = (int(p[key]) for key in ("protons", "neutrons", "electrons"))
    symbol, name = ELEMENTS[protons - 1]
    charge = protons - electrons
    return {
        "symbol": symbol, "name": name.replace("-", " "), "atomicNumber": protons,
        "massNumber": protons + neutrons, "charge_e": charge,
        "species": "Ion dương" if charge > 0 else "Ion âm" if charge < 0 else "Nguyên tử trung hòa",
        "shells": [min(2, electrons), min(8, max(0, electrons - 2)), max(0, electrons - 10)],
    }


MODELS = {
    "pendulum": ("pendulum-agm-v1", pendulum),
    "chemistry": ("ideal-strong-titration-ts-v1", titration),
    "circuit": ("ideal-series-circuit-ts-v2", circuit),
    "mechanics": ("constant-force-motion-v1", mechanics),
    "spring": ("horizontal-hooke-oscillator-v1", spring),
    "electrochemistry": ("standard-galvanic-cell-v1", electrochemistry),
    "atomic": ("atomic-particle-counts-v1", atomic),
    "parallel-circuit": ("ideal-two-resistor-network-v1", parallel_circuit),
    "capacitor": ("ideal-rc-step-v1", capacitor),
    "precipitation": ("ideal-agcl-precipitation-v1", precipitation),
    "gas-reaction": ("ideal-bicarbonate-gas-v1", gas_reaction),
    "spring-damped": ("viscous-spring-underdamped-v1", damped_spring),
    "inclined-plane": ("rest-release-incline-v1", incline),
    "pulley": ("vertical-ideal-pulley-v1", pulley),
    "alkali-water": ("alkali-water-flame-qualitative-v1", alkali),
    "copper-nitric": ("copper-nitric-qualitative-v1", nitric),
    "chlorine-bleach": ("chlorine-moisture-qualitative-v1", chlorine),
}
