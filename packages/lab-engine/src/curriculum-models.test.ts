import { expect, it } from 'vitest';
import cases from '../../../tests/golden/curriculum-labs.json';
import { createLabEngine, isLabId } from './runtime';
import { dampedSpringReading } from './curriculum-models';

it.each(cases)('recomputes $lab_id from the exported inputs', ({ lab_id, parameters, elapsed_s, expected }) => {
  if (!isLabId(lab_id)) throw new Error('Unknown lab fixture');
  const engine = createLabEngine(lab_id);
  engine.restore(JSON.stringify({ ...JSON.parse(engine.serialize()), parameters, elapsed_s }));
  const actual = engine.snapshot().reading as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(expected)) {
    if (typeof value === 'number') expect(actual[key]).toBeCloseTo(value, 9);
    else expect(actual[key]).toBe(value);
  }
});

it('rejects out-of-model values and dissipates energy for positive damping', () => {
  const engine = createLabEngine('spring-damped');
  expect(() => engine.setParameters({ damping_ratio: 1 })).toThrow();
  expect(() => createLabEngine('pulley').restore(JSON.stringify({
    ...JSON.parse(createLabEngine('pulley').serialize()), parameters: { mass_kg: 10, strands: 3, lift_m: 1 },
  }))).toThrow();
  const p = { mass_kg: 2, stiffness_N_m: 8, damping_ratio: .4, displacement_m: .3 };
  for (let i = 1; i <= 40; i++) {
    expect(dampedSpringReading(p, i / 10).energy_J).toBeLessThanOrEqual(dampedSpringReading(p, (i - 1) / 10).energy_J);
  }
});
