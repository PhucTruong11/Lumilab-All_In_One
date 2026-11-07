import { describe, expect, it } from 'vitest';
import cases from '../../../tests/golden/expanded-labs.json';
import { atomicReading, electrochemistryReading, mechanicsReading, mechanicsCurve, springReading, springCurve, type Electrode } from './expanded-models';
import { createLabEngine, labDefinitions, labIds } from './runtime';

describe('four new client models, independently established reference cases', () => {
  it('constant force matches F/m, velocity and position and work-energy', () => {
    const { parameters, time_s, expected } = cases.mechanics; const r = mechanicsReading(parameters, time_s);
    expect(r).toEqual(expected);
    expect(parameters.force_N * r.position_m).toBeCloseTo(r.kineticEnergy_J - .5 * parameters.mass_kg * parameters.initialVelocity_m_s ** 2, 10);
    expect(mechanicsReading({ ...parameters, force_N: 0 }, 5).velocity_m_s).toBe(1);
    expect(mechanicsReading({ ...parameters, force_N: -6 }, 2).position_m).toBe(-4);
    const data = mechanicsCurve(parameters); expect(data).toHaveLength(101); expect(data.at(-1)?.time).toBe(10);
  });
  it('Hooke oscillator conserves energy and solves the equation of motion', () => {
    const { parameters, expected } = cases.spring; const initial = springReading(parameters);
    expect(initial.period_s).toBeCloseTo(expected.period_s, 12); expect(initial.totalEnergy_J).toBeCloseTo(.4, 12);
    expect(springReading({ ...parameters, mass_kg: 2 }).period_s).toBeCloseTo(2 * expected.period_s, 12);
    expect(springReading({ ...parameters, stiffness_N_m: 80 }).period_s).toBeCloseTo(expected.period_s / 2, 12);
    for (const row of springCurve(parameters)) expect(row.kineticEnergy_J + row.potentialEnergy_J).toBeCloseTo(expected.totalEnergy_J, 12);
    expect(springReading(parameters, expected.period_s / 4).displacement_m).toBeCloseTo(0, 12);
    const t = .13, dt = 1e-5; const acceleration = (springReading(parameters, t + dt).velocity_m_s - springReading(parameters, t - dt).velocity_m_s) / (2 * dt);
    expect(acceleration).toBeCloseTo(springReading(parameters, t).force_N / parameters.mass_kg, 6);
    expect(springReading({ ...parameters, displacement_m: 0 }).period_s).toBeNull();
  });
  for (const row of cases.cell.cases) it(`standard cell ${row.left}/${row.right}: sign and magnitude`, () => {
    const r = electrochemistryReading({ left: row.left as Electrode, right: row.right as Electrode, bridgeConnected: true });
    expect(r.emf_V).toBeCloseTo(row.emf_V, 12); expect(r.voltage_V).toBeCloseTo(row.voltage_V, 12);
  });
  it('uses only supported half cells; bridge dropout suppresses meter but preserves E° theory', () => {
    const r = electrochemistryReading({ left: 'cu', right: 'ag', bridgeConnected: false });
    expect(r.meterVoltage_V).toBeNull(); expect(r.emf_V).toBeCloseTo(.46); expect(r.reaction).toBe('Cu + 2Ag⁺ → Cu²⁺ + 2Ag'); expect(r.exchangedElectrons).toBe(2);
    expect(electrochemistryReading({ left: 'cu', right: 'cu', bridgeConnected: true }).anode).toBeNull();
    expect(() => electrochemistryReading({ left: 'fe' as Electrode, right: 'cu', bridgeConnected: true })).toThrow();
  });
  it('atomic identity, isotope mass and charge follow independent particle counts', () => {
    const { parameters, expected } = cases.atomic; const r = atomicReading(parameters);
    expect(r.symbol).toBe(expected.symbol); expect(r.massNumber).toBe(expected.massNumber); expect(r.charge_e).toBe(1);
    expect(atomicReading({ ...parameters, neutrons: 13 }).symbol).toBe('Na'); expect(atomicReading({ ...parameters, neutrons: 13 }).massNumber).toBe(24);
    for (let electrons = 0; electrons <= 18; electrons++) { const result = atomicReading({ ...parameters, electrons }); expect(result.shells.reduce((sum, count) => sum + count, 0)).toBe(electrons); expect(result.charge_e).toBe(11 - electrons); }
    expect(atomicReading({ protons: 17, neutrons: 18, electrons: 18 }).charge_e).toBe(-1);
  });
  it('rejects nonphysical, unsupported and nonfinite inputs', () => {
    expect(() => mechanicsReading({ ...cases.mechanics.parameters, mass_kg: 0 })).toThrow();
    expect(() => mechanicsReading(cases.mechanics.parameters, 11)).toThrow();
    expect(() => springReading({ ...cases.spring.parameters, stiffness_N_m: NaN })).toThrow();
    expect(() => atomicReading({ protons: 0, neutrons: 12, electrons: 11 })).toThrow();
    expect(() => atomicReading({ protons: 11, neutrons: 12.5, electrons: 11 })).toThrow();
  });
});

describe('expanded runtime registration and time-aware roundtrips', () => {
  it('has configs including archived models, keeps all prior versions, validates/roundtrips every lab', () => {
    expect(labIds).toHaveLength(15); expect(Object.keys(labDefinitions).sort()).toEqual([...labIds].sort());
    for (const id of labIds) { const engine = createLabEngine(id); engine.record(); const restored = createLabEngine(id); restored.restore(engine.serialize()); expect(restored.snapshot().reading).toEqual(engine.snapshot().reading); expect(restored.snapshot().records[0].reading).toEqual(engine.snapshot().records[0].reading); }
  });
  it('records/restores values at elapsed time and stops Newton at10s', () => {
    const engine = createLabEngine('mechanics'); engine.setParameters(cases.mechanics.parameters); engine.run(); for (let i = 0; i < 8; i++) engine.step(.25); engine.record();
    expect(engine.snapshot().reading.position_m).toBe(8);
    const restored = createLabEngine('mechanics'); restored.restore(engine.serialize()); expect(restored.snapshot().reading.position_m).toBe(8); expect(restored.snapshot().records[0].reading.velocity_m_s).toBe(7);
    for (let i = 0; i < 40; i++) engine.step(.25); expect(engine.snapshot().elapsed_s).toBe(10); expect(engine.snapshot().phase).toBe('paused');
    engine.run(); expect(engine.snapshot().elapsed_s).toBe(0); expect(engine.snapshot().reading.position_m).toBe(0);
    const forged = JSON.parse(engine.serialize()); forged.elapsed_s = 11; expect(() => engine.restore(JSON.stringify(forged))).toThrow();
  });
  it('restores spring instantaneous readings and prevents motion at zero release', () => {
    const engine = createLabEngine('spring'); engine.run(); engine.step(.2); engine.record(); const restored = createLabEngine('spring'); restored.restore(engine.serialize());
    expect(restored.snapshot().reading.displacement_m).toBeCloseTo(engine.snapshot().reading.displacement_m, 12);
    expect(restored.snapshot().records[0].reading.displacement_m).toBeCloseTo(engine.snapshot().reading.displacement_m, 12);
    engine.setParameters({ displacement_m: 0 }); engine.run(); expect(engine.snapshot().phase).toBe('ready');
  });
});
