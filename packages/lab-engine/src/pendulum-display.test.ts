import { expect, test } from 'vitest';
import { defaultPendulum, pendulumPeriod, pendulumReading } from './pendulum';
import { pendulumDisplayState } from './pendulum-display';

test('damped illustration settles below the angle display resolution and stays there', () => {
  const p = { ...defaultPendulum, angle_deg: 35 };
  for (const time of [40, 71, 1000]) {
    expect(pendulumDisplayState(p, time, 1, .075)).toMatchObject({
      atRest: true, angle_deg: 0, speed_m_s: 0, kinetic_j: 0, potential_j: 0, total_j: 0,
    });
  }
  expect(pendulumDisplayState(p, 10, 1, .075).atRest).toBe(false);
});

test('equilibrium crossings do not stop a moving pendulum', () => {
  const p = { ...defaultPendulum, angle_deg: 35 };
  const motion = pendulumDisplayState(p, pendulumPeriod(p) / 4, -1, .075);
  expect(Math.abs(motion.angle_deg)).toBeLessThan(.05);
  expect(motion.atRest).toBe(false);
  expect(motion.speed_m_s).toBeGreaterThan(.5);
});

test('energy stays nonnegative, adds up and decays relative to initial energy', () => {
  for (const angle_deg of [0, 10, 35, 90]) {
    const p = { ...defaultPendulum, angle_deg };
    let previous = Infinity;
    for (let time = 0; time <= 45; time += .1) {
      const motion = pendulumDisplayState(p, time, 1, .075);
      expect(motion.total_j).toBeLessThanOrEqual(previous + 1e-12);
      expect(motion.kinetic_j).toBeGreaterThanOrEqual(0);
      expect(motion.potential_j).toBeGreaterThanOrEqual(0);
      expect(motion.kinetic_j + motion.potential_j).toBeCloseTo(motion.total_j, 12);
      expect(motion.total_j).toBeLessThanOrEqual(motion.initial_j + 1e-12);
      previous = motion.total_j;
    }
  }
});

test('ideal nonlinear pendulum keeps its energy and continues at large times', () => {
  const p = { ...defaultPendulum, angle_deg: 90 };
  expect(pendulumDisplayState(p, 1000, -1, 0).atRest).toBe(false);
  expect(pendulumDisplayState(p, 1000, -1, 0).total_j).toBe(pendulumReading(p).energy_j);
});
