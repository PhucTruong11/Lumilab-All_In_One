/** Port of dist/science.js: ideal point mass, no friction, release up to 90 degrees.
 * NIST DLMF 22.19(i), 19.8(i). Units are encoded in field names.
 */
export interface PendulumParameters {
  length_m: number;
  mass_kg: number;
  angle_deg: number;
  gravity_m_s2: number;
}

export const defaultPendulum: PendulumParameters = { length_m: 1, mass_kg: 0.2, angle_deg: 10, gravity_m_s2: 9.81 };

function validate(params: PendulumParameters) {
  const { length_m: length, mass_kg: mass, angle_deg: angle, gravity_m_s2: gravity } = params;
  if (![length, mass, angle, gravity].every(Number.isFinite)) throw new TypeError('Parameters must be finite.');
  if (length < 0.3 || length > 2 || mass < 0.1 || mass > 1 || angle < 0 || angle > 90 || gravity !== 9.81) {
    throw new RangeError('Outside the declared pendulum model bounds.');
  }
}

export function pendulumPeriod(params: PendulumParameters): number {
  validate(params);
  let arithmetic = 1;
  let geometric = Math.cos(params.angle_deg * Math.PI / 360);
  for (let i = 0; i < 12 && Math.abs(arithmetic - geometric) > 2 * Number.EPSILON; i++) {
    const mean = (arithmetic + geometric) / 2;
    geometric = Math.sqrt(arithmetic * geometric);
    arithmetic = mean;
  }
  return 2 * Math.PI * Math.sqrt(params.length_m / params.gravity_m_s2) / arithmetic;
}

const quarterCycles = new Map<number, { times: Float64Array; angles: Float64Array }>();

function quarterCycle(angle: number) {
  const cached = quarterCycles.get(angle);
  if (cached) return cached;
  const count = 512, step = Math.PI / (2 * count), k = Math.sin(angle * Math.PI / 360);
  const times = new Float64Array(count + 1), angles = new Float64Array(count + 1);
  const integrand = (phi: number) => 1 / Math.sqrt(1 - (k * Math.sin(phi)) ** 2);
  angles[0] = angle;
  for (let i = 1; i <= count; i++) {
    const upper = Math.PI / 2 - (i - 1) * step, lower = Math.PI / 2 - i * step;
    times[i] = times[i - 1] + step * (integrand(upper) + 4 * integrand((upper + lower) / 2) + integrand(lower)) / 6;
    angles[i] = 2 * Math.asin(k * Math.sin(lower)) * 180 / Math.PI;
  }
  for (let i = 1; i <= count; i++) times[i] /= times[count];
  const cycle = { times, angles };
  if (quarterCycles.size >= 96) quarterCycles.delete(quarterCycles.keys().next().value!);
  quarterCycles.set(angle, cycle);
  return cycle;
}

export function pendulumAngleAtTime(params: PendulumParameters, time_s: number): number {
  validate(params);
  if (!Number.isFinite(time_s)) throw new TypeError('Time must be finite.');
  if (params.angle_deg === 0) return 0;
  const period = pendulumPeriod(params);
  const phase = ((time_s % period) / period + 1) % 1;
  const quarter = phase * 4, quadrant = Math.floor(quarter), fraction = quarter - quadrant;
  const progress = quadrant % 2 === 0 ? fraction : 1 - fraction;
  const { times, angles } = quarterCycle(params.angle_deg);
  let low = 0, high = times.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >>> 1;
    if (times[middle] <= progress) low = middle; else high = middle;
  }
  const ratio = (progress - times[low]) / (times[high] - times[low]);
  const theta = angles[low] + ratio * (angles[high] - angles[low]);
  return quadrant === 1 || quadrant === 2 ? -theta : theta;
}

export function pendulumReading(params: PendulumParameters) {
  const limitingPeriod = pendulumPeriod(params);
  const height = 2 * params.length_m * Math.sin(params.angle_deg * Math.PI / 360) ** 2;
  return {
    period_s: params.angle_deg === 0 ? null : limitingPeriod,
    frequency_hz: params.angle_deg === 0 ? null : 1 / limitingPeriod,
    energy_j: params.mass_kg * params.gravity_m_s2 * height,
    max_speed_m_s: Math.sqrt(2 * params.gravity_m_s2 * height),
  };
}
