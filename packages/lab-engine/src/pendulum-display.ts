import { pendulumAngleAtTime, pendulumReading, type PendulumParameters } from './pendulum';

// Browser illustration only. The server's pendulum-agm-v1 remains the ideal model.
// Exponential amplitude envelope, not a solution of nonlinear viscous dynamics.
export function pendulumDisplayState(p: PendulumParameters, time_s: number, side: number, damping_N_s_m = 0) {
  const initial = pendulumReading(p);
  if (!Number.isFinite(time_s) || time_s < 0 || !Number.isFinite(damping_N_s_m) || damping_N_s_m < 0) {
    throw new RangeError('Display time and damping must be finite and nonnegative.');
  }
  const beta = damping_N_s_m / (2 * p.mass_kg);
  const envelope = p.angle_deg * Math.exp(-beta * time_s);
  // 0.05 degrees is half the 0.1-degree readout resolution, across the whole cycle.
  const atRest = p.angle_deg === 0 || (damping_N_s_m > 0 && envelope < .05);
  const angle_deg = atRest ? 0 : side * pendulumAngleAtTime(p, time_s) * Math.exp(-beta * time_s);
  const energyAtAngle = (angle: number) => 2 * p.mass_kg * p.gravity_m_s2 * p.length_m * Math.sin(angle * Math.PI / 360) ** 2;
  const total_j = atRest ? 0 : damping_N_s_m > 0 ? energyAtAngle(envelope) : initial.energy_j;
  const potential_j = atRest ? 0 : Math.min(total_j, energyAtAngle(angle_deg));
  const kinetic_j = Math.max(0, total_j - potential_j);
  const nextAngle = side * pendulumAngleAtTime(p, time_s + .005) * Math.exp(-beta * (time_s + .005));
  return { angle_deg, atRest, total_j, potential_j, kinetic_j, initial_j: initial.energy_j,
    speed_m_s: Math.sqrt(2 * kinetic_j / p.mass_kg), motionSign: nextAngle >= angle_deg ? 1 : -1 };
}
