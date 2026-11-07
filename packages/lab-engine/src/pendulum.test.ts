import { expect, test } from 'vitest';
import { defaultPendulum, pendulumAngleAtTime, pendulumPeriod, pendulumReading } from './pendulum';

test('AGM period matches independent Simpson quadrature at small and large release angles', () => {
  for (const angle_deg of [0, 10, 45, 90]) {
    const params = { ...defaultPendulum, angle_deg };
    const k = Math.sin(angle_deg * Math.PI / 360), n = 4096, step = Math.PI / (2 * n);
    let sum = 0;
    for (let i = 0; i <= n; i++) sum += (i === 0 || i === n ? 1 : i % 2 === 0 ? 2 : 4) / Math.sqrt(1 - (k * Math.sin(i * step)) ** 2);
    expect(pendulumPeriod(params)).toBeCloseTo(4 * Math.sqrt(params.length_m / params.gravity_m_s2) * sum * step / 3, 11);
  }
});

test('length, mass and stationary release respect ideal physics', () => {
  const period = pendulumPeriod(defaultPendulum);
  expect(pendulumPeriod({ ...defaultPendulum, mass_kg: 1 })).toBe(period);
  expect(pendulumPeriod({ ...defaultPendulum, length_m: 2 }) / period).toBeCloseTo(Math.sqrt(2), 12);
  const stationary = { ...defaultPendulum, angle_deg: 0 };
  expect(pendulumReading(stationary)).toMatchObject({ period_s: null, frequency_hz: null, energy_j: 0 });
  expect(pendulumAngleAtTime(stationary, 100)).toBe(0);
});

test('motion reaches equilibrium and opposite turning point at the exact nonlinear period', () => {
  for (const angle_deg of [10, 45, 90]) {
    const params = { ...defaultPendulum, angle_deg }, period = pendulumPeriod(params);
    expect(pendulumAngleAtTime(params, 0)).toBeCloseTo(angle_deg, 9);
    expect(pendulumAngleAtTime(params, period / 4)).toBeCloseTo(0, 9);
    expect(pendulumAngleAtTime(params, period / 2)).toBeCloseTo(-angle_deg, 9);
    expect(pendulumAngleAtTime(params, period)).toBeCloseTo(angle_deg, 9);
    const reading = pendulumReading(params);
    expect(reading.energy_j).toBeCloseTo(0.5 * params.mass_kg * reading.max_speed_m_s ** 2, 12);
  }
});

test('unsupported bounds and non-finite input never produce a measurement', () => {
  for (const angle_deg of [-1, 91, Infinity, NaN]) expect(() => pendulumPeriod({ ...defaultPendulum, angle_deg })).toThrow();
  expect(() => pendulumAngleAtTime(defaultPendulum, Infinity)).toThrow();
});
