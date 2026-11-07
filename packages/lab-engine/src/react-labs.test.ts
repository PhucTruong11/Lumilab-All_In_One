import { describe, expect, it } from 'vitest';
import golden from '../../../tests/golden/react-labs.json';
import { acids, bases, defaultTitration, titrationReading, titrationCurve } from './titration';
import { defaultCircuit, circuitReading, circuitCurve, placeCircuitPart, moveCircuitPart, removeCircuitPart, removeCircuitSlot, type CircuitPart } from './circuit';

describe('ideal strong titration — shared analytic cases', () => {
  for (const row of golden.titration.cases) it(row.id, () => {
    expect(Math.abs(titrationReading({ ...defaultTitration, baseVolume_ml: row.baseVolume_ml }).pH - row.pH)).toBeLessThan(row.tolerance);
  });
  it('neutralization conserves moles and charge, with continuous water equilibrium', () => {
    for (const acid of Object.keys(acids) as (keyof typeof acids)[]) for (const base of Object.keys(bases) as (keyof typeof bases)[]) {
      for (const volume of [0, 24.95, 25 - 1e-10, 25, 25 + 1e-10, 25.05, 50]) {
        const r = titrationReading({ acid, base, baseVolume_ml: volume });
        expect(r.saltMoles + r.remainingAcidMoles).toBeCloseTo(.0025, 12);
        expect(r.saltMoles + r.remainingBaseMoles).toBeCloseTo(volume * .0001, 12);
        const charge = r.hydrogen_mol_L - 1e-14 / r.hydrogen_mol_L;
        expect(charge).toBeCloseTo((.0025 - volume * .0001) / ((25 + volume) / 1000), 12);
      }
    }
    const before = titrationReading({ ...defaultTitration, baseVolume_ml: 25 - 1e-10 });
    const after = titrationReading({ ...defaultTitration, baseVolume_ml: 25 + 1e-10 });
    expect(before.pH).toBeCloseTo(7, 6); expect(after.pH).toBeCloseTo(7, 6); expect(before.pH).toBeLessThan(after.pH);
  });
  it('selects salt and keeps equivalence colourless, then pink', () => {
    expect(titrationReading({ acid: 'hno3', base: 'koh', baseVolume_ml: 25 }).salt).toBe('KNO₃');
    expect(titrationReading({ ...defaultTitration, baseVolume_ml: 25 }).indicatorFraction).toBe(0);
    expect(titrationReading({ ...defaultTitration, baseVolume_ml: 25.05 }).indicatorFraction).toBeGreaterThan(.9);
    const curve = titrationCurve(defaultTitration); expect(curve).toHaveLength(201);
    expect(curve.every((row, i) => i === 0 || row.pH > curve[i - 1].pH)).toBe(true);
  });
  it('rejects nonfinite/out-of-range volume and unsupported choices', () => {
    for (const volume of [-1, 51, NaN, Infinity]) expect(() => titrationReading({ ...defaultTitration, baseVolume_ml: volume })).toThrow();
    expect(() => titrationReading({ ...defaultTitration, acid: 'acetic' as 'hcl' })).toThrow();
  });
});
describe('ideal circuit — independent Ohm/power checks', () => {
  for (const row of golden.circuit.cases) it(row.id, () => {
    const result = circuitReading({ ...defaultCircuit, slots: row.slots as (CircuitPart | null)[] });
    expect(Math.abs(result.current_A! - row.current_A)).toBeLessThan(golden.circuit.tolerance);
    expect(Math.abs(result.resistorVoltage_V! - row.resistorVoltage_V)).toBeLessThan(golden.circuit.tolerance);
    expect(Math.abs(result.power_W! - row.power_W)).toBeLessThan(golden.circuit.tolerance);
    expect(result.power_W).toBeCloseTo(result.current_A! ** 2 * result.totalResistance_ohm, 12);
  });
  it('places any part into any slot, swaps occupied slots, replaces and removes', () => {
    for (const part of ['bulb', 'switchInstalled', 'extraResistor', 'resistor10'] as const) for (let index = 0; index < 3; index++) expect(placeCircuitPart(defaultCircuit, part, index).slots[index]).toBe(part);
    let p = placeCircuitPart(defaultCircuit, 'bulb', 0); p = placeCircuitPart(p, 'extraResistor', 1); p = moveCircuitPart(p, 0, 1);
    expect(p.slots).toEqual(['extraResistor', 'bulb', null]);
    p = placeCircuitPart(p, 'switchInstalled', 1); expect(p.slots).toEqual(['extraResistor', 'switchInstalled', null]);
    p = removeCircuitPart(p, 'switchInstalled'); expect(p.slots).toEqual(['extraResistor', null, null]);
    p = placeCircuitPart(p, 'extraResistor', 1);
    expect(p.slots).toEqual(['extraResistor', 'extraResistor', null]);
    p = removeCircuitSlot(p, 1); expect(p.slots).toEqual(['extraResistor', null, null]);
    p = placeCircuitPart(p, 'resistor10', 2); expect(circuitReading(p).totalResistance_ohm).toBe(50);
    expect(() => moveCircuitPart(p, 2, 3)).toThrow();
  });
  it('open switch yields zero; wrong meter connections suppress measurements and curve', () => {
    const opened = { ...placeCircuitPart(defaultCircuit, 'switchInstalled', 0), switchClosed: false };
    expect(circuitReading(opened).current_A).toBe(0); expect(circuitReading(opened).power_W).toBe(0); expect(circuitCurve(opened).every(p => p.current === 0)).toBe(true);
    for (const invalid of [{ ...defaultCircuit, ammeter: 'parallel' as const }, { ...defaultCircuit, voltmeter: 'series' as const }]) {
      expect(circuitReading(invalid).current_A).toBeNull(); expect(circuitCurve(invalid).every(p => p.current === null)).toBe(true);
    }
    expect(circuitCurve(defaultCircuit).at(-1)?.current).toBe(.6);
  });
  it('rejects bad numeric and duplicate switches', () => {
    expect(() => circuitReading({ ...defaultCircuit, voltage_V: Infinity })).toThrow();
    expect(() => circuitReading({ ...defaultCircuit, resistance_ohm: 0 })).toThrow();
    expect(() => circuitReading({ ...defaultCircuit, slots: ['switchInstalled', 'switchInstalled', null] })).toThrow();
    const twoBulbs = circuitReading({ ...defaultCircuit, slots: ['bulb', 'bulb', null] });
    expect(twoBulbs.current_A).toBeCloseTo(.15);
    expect(twoBulbs.bulbPower_W).toBeCloseTo(.45);
  });
});
