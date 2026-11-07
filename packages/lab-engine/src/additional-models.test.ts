import { describe, expect, it } from 'vitest';
import reference from '../../../tests/golden/additional-labs.json';
import {
  capacitorCurve, capacitorReading, gasReactionReading, parallelCircuitReading, precipitationReading,
  type CapacitorParameters, type GasReactionParameters, type ParallelCircuitParameters, type PrecipitationParameters,
} from './additional-models';

function referenceReading(row: typeof reference.cases[number]): Record<string, unknown> {
  if (row.lab_id === 'parallel-circuit') return parallelCircuitReading(row.parameters as ParallelCircuitParameters);
  if (row.lab_id === 'capacitor') return capacitorReading(row.parameters as CapacitorParameters, row.elapsed_s);
  if (row.lab_id === 'precipitation') return precipitationReading(row.parameters as PrecipitationParameters);
  return gasReactionReading(row.parameters as GasReactionParameters);
}

describe('additional draft models: shared independent references', () => {
  for (const [index, row] of reference.cases.entries()) {
    it(`${row.lab_id} hand-worked case ${index}`, () => {
      const reading = referenceReading(row);
      for (const [key, value] of Object.entries(row.expected)) {
        if (typeof value === 'number') expect(reading[key]).toBeCloseTo(value, 11);
        else expect(reading[key]).toBe(value);
      }
    });
  }
});

describe('electrical laws and boundary conditions', () => {
  const circuit: ParallelCircuitParameters = { voltage_V: 9, resistance1_ohm: 15, resistance2_ohm: 60, topology: 'parallel', switchClosed: true };
  const rc: CapacitorParameters = { voltage_V: 8, resistance_ohm: 2000, capacitance_uF: 500, mode: 'charge' };
  it('satisfies KCL, KVL and resistor power in either topology', () => {
    for (const topology of ['series', 'parallel'] as const) {
      const reading = parallelCircuitReading({ ...circuit, topology });
      expect(reading.totalPower_W).toBeCloseTo(reading.branch1Current_A ** 2 * circuit.resistance1_ohm + reading.branch2Current_A ** 2 * circuit.resistance2_ohm, 12);
      if (topology === 'parallel') {
        expect(reading.totalCurrent_A).toBeCloseTo(reading.branch1Current_A + reading.branch2Current_A, 12);
        expect(reading.resistor1Voltage_V).toBeCloseTo(reading.resistor2Voltage_V, 12);
      } else {
        expect(reading.resistor1Voltage_V + reading.resistor2Voltage_V).toBeCloseTo(circuit.voltage_V, 12);
        expect(reading.branch1Current_A).toBe(reading.branch2Current_A);
      }
    }
    expect(parallelCircuitReading({ ...circuit, voltage_V: 0 }).totalPower_W).toBe(0);
  });
  it('RC charge obeys dq/dt=I, energy storage and loop voltage', () => {
    for (const time of [0.01, 0.5, 2, 5]) {
      const reading = capacitorReading(rc, time);
      const dt = 1e-5;
      const derivative = (capacitorReading(rc, time + dt).charge_C - capacitorReading(rc, time - dt).charge_C) / (2 * dt);
      expect(derivative).toBeCloseTo(reading.current_A, 10);
      expect(reading.capacitorVoltage_V + reading.resistorVoltage_V).toBeCloseTo(rc.voltage_V, 12);
      expect(reading.energy_J).toBeCloseTo(reading.charge_C ** 2 / (2 * rc.capacitance_uF * 1e-6), 12);
    }
  });
  it('RC discharge loses field energy at exactly resistor power', () => {
    const discharge = { ...rc, mode: 'discharge' as const }, dt = 1e-5;
    for (const time of [0.1, 1, 3]) {
      const reading = capacitorReading(discharge, time);
      const derivative = (capacitorReading(discharge, time + dt).energy_J - capacitorReading(discharge, time - dt).energy_J) / (2 * dt);
      expect(derivative).toBeCloseTo(-(reading.current_A ** 2) * rc.resistance_ohm, 9);
      expect(reading.current_A).toBeLessThan(0);
    }
    expect(capacitorReading(rc, 120).capacitorVoltage_V).toBeCloseTo(rc.voltage_V, 12);
    const curve = capacitorCurve(rc);
    expect(curve).toHaveLength(121);
    expect(curve.at(-1)?.time).toBe(6);
  });
});

describe('chemical stoichiometry, absence and strict inputs', () => {
  it('conserves each reacting species over the full supported mixture grid', () => {
    for (const first of [0, 1, 10, 25, 50]) for (const second of [0, 1, 10, 25, 50]) {
      const reading = precipitationReading({ silverVolume_ml: first, chlorideVolume_ml: second });
      expect(reading.precipitateMoles + reading.remainingSilverMoles).toBeCloseTo(reading.silverMoles, 14);
      expect(reading.precipitateMoles + reading.remainingChlorideMoles).toBeCloseTo(reading.chlorideMoles, 14);
      expect(Math.min(reading.remainingSilverMoles, reading.remainingChlorideMoles)).toBe(0);
      expect(reading.precipitateMass_g).toBeGreaterThanOrEqual(0);
      const gas = gasReactionReading({ acidVolume_ml: first, bicarbonateMass_g: second / 50 });
      expect(gas.reactionMoles + gas.remainingAcidMoles).toBeCloseTo(gas.acidMoles, 14);
      expect(gas.reactionMoles + gas.remainingBicarbonateMoles).toBeCloseTo(gas.bicarbonateMoles, 14);
      expect(Math.min(gas.remainingAcidMoles, gas.remainingBicarbonateMoles)).toBe(0);
    }
    expect(gasReactionReading({ acidVolume_ml: 50, bicarbonateMass_g: 0 }).hasGas).toBe(false);
    expect(precipitationReading({ silverVolume_ml: 25, chlorideVolume_ml: 25 }).limitingReagent).toBe('equivalent');
  });
  it('tolerates roundoff at equivalence without erasing trace stoichiometric amounts', () => {
    const equivalent = gasReactionReading({ acidVolume_ml: 25, bicarbonateMass_g: 0.2100165 * (1 + Number.EPSILON) });
    expect(equivalent.limitingReagent).toBe('equivalent');
    const trace = precipitationReading({ silverVolume_ml: 1e-10, chlorideVolume_ml: 0 });
    expect(trace.limitingReagent).toBe('NaCl');
    expect(trace.remainingSilverMoles).toBeGreaterThan(0);
  });
  it('rejects nonfinite, out-of-range and unsupported values without clamping', () => {
    for (const value of [-1, 51, Infinity, NaN]) {
      expect(() => precipitationReading({ silverVolume_ml: value, chlorideVolume_ml: 10 })).toThrow();
      expect(() => gasReactionReading({ acidVolume_ml: value, bicarbonateMass_g: 0.2 })).toThrow();
    }
    expect(() => parallelCircuitReading({ voltage_V: 6, resistance1_ohm: 0, resistance2_ohm: 20, topology: 'series', switchClosed: true })).toThrow();
    expect(() => parallelCircuitReading({ voltage_V: 6, resistance1_ohm: 10, resistance2_ohm: 20, topology: 'bad' as 'series', switchClosed: true })).toThrow();
    expect(() => capacitorReading({ voltage_V: 6, resistance_ohm: 1000, capacitance_uF: 0, mode: 'charge' })).toThrow();
    expect(() => capacitorReading({ voltage_V: 6, resistance_ohm: 1000, capacitance_uF: 1000, mode: 'charge' }, 121)).toThrow();
    expect(() => gasReactionReading({ acidVolume_ml: 25, bicarbonateMass_g: 1.01 })).toThrow();
  });
});
