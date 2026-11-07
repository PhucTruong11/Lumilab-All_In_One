/** Draft educational models. Assumptions, fixed conditions and references live in lab.json. */
function bounded(value: number, name: string, minimum: number, maximum: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${name} outside model bounds [${minimum}, ${maximum}]`);
  }
}

// Compare the label only: do not erase small quantities or round computed extents.
function stoichiometricallyEqual(first: number, second: number) {
  return Math.abs(first - second) <= 1e-12 * Math.max(first, second);
}

export interface ParallelCircuitParameters {
  voltage_V: number;
  resistance1_ohm: number;
  resistance2_ohm: number;
  topology: 'series' | 'parallel';
  switchClosed: boolean;
}

export function parallelCircuitReading(parameters: ParallelCircuitParameters) {
  const { voltage_V, resistance1_ohm, resistance2_ohm, topology, switchClosed } = parameters;
  bounded(voltage_V, 'voltage_V', 0, 12);
  bounded(resistance1_ohm, 'resistance1_ohm', 5, 100);
  bounded(resistance2_ohm, 'resistance2_ohm', 5, 100);
  if (!['series', 'parallel'].includes(topology) || typeof switchClosed !== 'boolean') {
    throw new RangeError('Unsupported network configuration');
  }
  const equivalentResistance_ohm = topology === 'series'
    ? resistance1_ohm + resistance2_ohm
    : resistance1_ohm * resistance2_ohm / (resistance1_ohm + resistance2_ohm);
  const totalCurrent_A = switchClosed ? voltage_V / equivalentResistance_ohm : 0;
  const branch1Current_A = topology === 'series' ? totalCurrent_A : switchClosed ? voltage_V / resistance1_ohm : 0;
  const branch2Current_A = topology === 'series' ? totalCurrent_A : switchClosed ? voltage_V / resistance2_ohm : 0;
  return {
    equivalentResistance_ohm,
    totalCurrent_A,
    branch1Current_A,
    branch2Current_A,
    resistor1Voltage_V: branch1Current_A * resistance1_ohm,
    resistor2Voltage_V: branch2Current_A * resistance2_ohm,
    totalPower_W: voltage_V * totalCurrent_A,
    closed: switchClosed,
    topology,
  };
}

export interface CapacitorParameters {
  voltage_V: number;
  resistance_ohm: number;
  capacitance_uF: number;
  mode: 'charge' | 'discharge';
}

/** Mode changes start a new ideal step: charge from 0 V, discharge from voltage_V. */
export function capacitorReading(parameters: CapacitorParameters, elapsed_s = 0) {
  const { voltage_V, resistance_ohm, capacitance_uF, mode } = parameters;
  bounded(voltage_V, 'voltage_V', 0, 12);
  bounded(resistance_ohm, 'resistance_ohm', 100, 10000);
  bounded(capacitance_uF, 'capacitance_uF', 10, 1000);
  bounded(elapsed_s, 'elapsed_s', 0, 120);
  if (!['charge', 'discharge'].includes(mode)) throw new RangeError('Unsupported RC mode');
  const capacitance_F = capacitance_uF * 1e-6;
  const timeConstant_s = resistance_ohm * capacitance_F;
  const decay = Math.exp(-elapsed_s / timeConstant_s);
  const capacitorVoltage_V = voltage_V * (mode === 'charge' ? -Math.expm1(-elapsed_s / timeConstant_s) : decay);
  // Positive current charges the designated positive plate. The source is absent in discharge mode.
  const resistorVoltage_V = (mode === 'charge' ? 1 : -1) * voltage_V * decay;
  return {
    elapsed_s,
    timeConstant_s,
    capacitorVoltage_V,
    resistorVoltage_V,
    current_A: resistorVoltage_V / resistance_ohm,
    charge_C: capacitance_F * capacitorVoltage_V,
    energy_J: 0.5 * capacitance_F * capacitorVoltage_V ** 2,
  };
}

export function capacitorCurve(parameters: CapacitorParameters) {
  // Show six time constants (up to 60 s), with an upper bound of the supported 120 s.
  const duration_s = Math.min(120, 6 * capacitorReading(parameters).timeConstant_s);
  return Array.from({ length: 121 }, (_, index) => {
    const time = index * duration_s / 120;
    return { time, ...capacitorReading(parameters, time) };
  });
}

export interface PrecipitationParameters {
  silverVolume_ml: number;
  chlorideVolume_ml: number;
}

/** Complete stoichiometric AgCl yield; not an equilibrium or particle-count simulation. */
export function precipitationReading(parameters: PrecipitationParameters) {
  bounded(parameters.silverVolume_ml, 'silverVolume_ml', 0, 50);
  bounded(parameters.chlorideVolume_ml, 'chlorideVolume_ml', 0, 50);
  const silverMoles = 0.1 * parameters.silverVolume_ml / 1000;
  const chlorideMoles = 0.1 * parameters.chlorideVolume_ml / 1000;
  const precipitateMoles = Math.min(silverMoles, chlorideMoles);
  return {
    silverMoles,
    chlorideMoles,
    precipitateMoles,
    precipitateMass_g: precipitateMoles * 143.32,
    remainingSilverMoles: silverMoles - precipitateMoles,
    remainingChlorideMoles: chlorideMoles - precipitateMoles,
    totalVolume_ml: parameters.silverVolume_ml + parameters.chlorideVolume_ml,
    hasPrecipitate: precipitateMoles > 0,
    limitingReagent: stoichiometricallyEqual(silverMoles, chlorideMoles) ? 'equivalent' : silverMoles < chlorideMoles ? 'AgNO3' : 'NaCl',
    equation: 'AgNO₃ + NaCl → AgCl + NaNO₃',
    ionicEquation: 'Ag⁺ + Cl⁻ → AgCl',
  };
}

export interface GasReactionParameters {
  acidVolume_ml: number;
  bicarbonateMass_g: number;
}

/** Complete 1:1 conversion; dry CO2 theoretical volume, not gas collection efficiency or kinetics. */
export function gasReactionReading(parameters: GasReactionParameters) {
  bounded(parameters.acidVolume_ml, 'acidVolume_ml', 0, 50);
  bounded(parameters.bicarbonateMass_g, 'bicarbonateMass_g', 0, 1);
  const acidMoles = 0.1 * parameters.acidVolume_ml / 1000;
  const bicarbonateMoles = parameters.bicarbonateMass_g / 84.0066;
  const reactionMoles = Math.min(acidMoles, bicarbonateMoles);
  const molarVolume_L = 0.082057366080960 * 298.15 / 1;
  return {
    acidMoles,
    bicarbonateMoles,
    reactionMoles,
    carbonDioxideVolume_ml: reactionMoles * molarVolume_L * 1000,
    remainingAcidMoles: acidMoles - reactionMoles,
    remainingBicarbonateMoles: bicarbonateMoles - reactionMoles,
    hasGas: reactionMoles > 0,
    limitingReagent: stoichiometricallyEqual(acidMoles, bicarbonateMoles) ? 'equivalent' : acidMoles < bicarbonateMoles ? 'HCl' : 'NaHCO3',
    equation: 'HCl + NaHCO₃ → NaCl + H₂O + CO₂',
  };
}
