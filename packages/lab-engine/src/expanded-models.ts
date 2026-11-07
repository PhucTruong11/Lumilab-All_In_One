/** Client educational models. Scope/sources are declared in each lab.json. */
function bound(value: number, name: string, min: number, max: number, integer = false) {
  if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) throw new RangeError(`${name} outside model bounds`);
}
export interface MechanicsParameters { mass_kg: number; force_N: number; initialVelocity_m_s: number }
export function mechanicsReading(p: MechanicsParameters, elapsed_s = 0) {
  bound(p.mass_kg, 'mass', .5, 5); bound(p.force_N, 'force', -10, 10); bound(p.initialVelocity_m_s, 'v0', -3, 3); bound(elapsed_s, 'time', 0, 10);
  const acceleration_m_s2 = p.force_N / p.mass_kg;
  const velocity_m_s = p.initialVelocity_m_s + acceleration_m_s2 * elapsed_s;
  return { acceleration_m_s2, velocity_m_s, position_m: p.initialVelocity_m_s * elapsed_s + .5 * acceleration_m_s2 * elapsed_s ** 2, kineticEnergy_J: .5 * p.mass_kg * velocity_m_s ** 2 };
}
export function mechanicsCurve(p: MechanicsParameters) {
  return Array.from({ length: 101 }, (_, i) => ({ time: i / 10, ...mechanicsReading(p, i / 10) }));
}
export interface SpringParameters { mass_kg: number; stiffness_N_m: number; displacement_m: number }
export function springReading(p: SpringParameters, elapsed_s = 0) {
  bound(p.mass_kg, 'mass', .1, 2); bound(p.stiffness_N_m, 'stiffness', 5, 100); bound(p.displacement_m, 'release', -.4, .4); bound(elapsed_s, 'time', 0, 86400);
  const omega_rad_s = Math.sqrt(p.stiffness_N_m / p.mass_kg);
  const displacement_m = p.displacement_m * Math.cos(omega_rad_s * elapsed_s);
  const velocity_m_s = -omega_rad_s * p.displacement_m * Math.sin(omega_rad_s * elapsed_s);
  return { omega_rad_s, period_s: p.displacement_m === 0 ? null : 2 * Math.PI / omega_rad_s, displacement_m, velocity_m_s,
    force_N: -p.stiffness_N_m * displacement_m, potentialEnergy_J: .5 * p.stiffness_N_m * displacement_m ** 2,
    kineticEnergy_J: .5 * p.mass_kg * velocity_m_s ** 2, totalEnergy_J: .5 * p.stiffness_N_m * p.displacement_m ** 2 };
}
export function springCurve(p: SpringParameters) {
  const duration = 4 * Math.PI / Math.sqrt(p.stiffness_N_m / p.mass_kg);
  return Array.from({ length: 121 }, (_, i) => ({ time: i * duration / 120, ...springReading(p, i * duration / 120) }));
}

// E° rounded to 0.01 V from OpenStax Chemistry 2e §17.3; activities = 1, 25°C.
export const electrodes = {
  zn: { symbol: 'Zn', ion: 'Zn²⁺', name: 'Kẽm', potential_V: -.76, electrons: 2, color: '#9daeb9' },
  cu: { symbol: 'Cu', ion: 'Cu²⁺', name: 'Đồng', potential_V: .34, electrons: 2, color: '#ca926b' },
  ag: { symbol: 'Ag', ion: 'Ag⁺', name: 'Bạc', potential_V: .80, electrons: 1, color: '#cad4db' },
} as const;
export type Electrode = keyof typeof electrodes;
export interface ElectrochemistryParameters { left: Electrode; right: Electrode; bridgeConnected: boolean }
export function electrochemistryReading(p: ElectrochemistryParameters) {
  if (!Object.hasOwn(electrodes, p.left) || !Object.hasOwn(electrodes, p.right) || typeof p.bridgeConnected !== 'boolean') throw new RangeError('Unsupported cell');
  const left = electrodes[p.left], right = electrodes[p.right];
  const voltage_V = right.potential_V - left.potential_V;
  const active = p.left !== p.right;
  const anodeSide = !active ? null : voltage_V > 0 ? 'left' : 'right';
  const anode = voltage_V > 0 ? left : right, cathode = voltage_V > 0 ? right : left;
  const n = Math.max(anode.electrons, cathode.electrons); // catalog charges are only1 or2
  const coefficient = (value: number) => value === 1 ? '' : String(value);
  const a = coefficient(n / anode.electrons), c = coefficient(n / cathode.electrons);
  const reaction = active ? `${a}${anode.symbol} + ${c}${cathode.ion} → ${a}${anode.ion} + ${c}${cathode.symbol}` : 'Hai điện cực giống nhau: E°pin = 0 V';
  return { voltage_V, emf_V: Math.abs(voltage_V), meterVoltage_V: p.bridgeConnected ? voltage_V : null,
    anodeSide, cathodeSide: !active ? null : anodeSide === 'left' ? 'right' : 'left',
    anode: active ? anode.symbol : null, cathode: active ? cathode.symbol : null,
    exchangedElectrons: active ? n : 0, reaction, electronDirection: active ? `${anode.symbol} → ${cathode.symbol}` : 'Không có chiều tự phát' };
}
export function cellComparison(p: ElectrochemistryParameters) {
  electrochemistryReading(p);
  return (Object.keys(electrodes) as Electrode[]).map(key => ({ label: electrodes[key].symbol, voltage: electrodes[key].potential_V - electrodes[p.left].potential_V, selected: key === p.right }));
}

export const elements = [
  ['H', 'Hiđro'], ['He', 'Heli'], ['Li', 'Liti'], ['Be', 'Beri'], ['B', 'Bo'], ['C', 'Cacbon'], ['N', 'Nitơ'], ['O', 'Oxi'], ['F', 'Flo'], ['Ne', 'Neon'],
  ['Na', 'Natri'], ['Mg', 'Magie'], ['Al', 'Nhôm'], ['Si', 'Silic'], ['P', 'Photpho'], ['S', 'Lưu huỳnh'], ['Cl', 'Clo'], ['Ar', 'Argon'],
] as const;
export interface AtomicParameters { protons: number; neutrons: number; electrons: number }
export function atomicReading(p: AtomicParameters) {
  bound(p.protons, 'protons', 1, 18, true); bound(p.neutrons, 'neutrons', 0, 24, true); bound(p.electrons, 'electrons', 0, 18, true);
  const [symbol, name] = elements[p.protons - 1];
  const charge_e = p.protons - p.electrons;
  return { symbol, name, atomicNumber: p.protons, massNumber: p.protons + p.neutrons, charge_e,
    species: charge_e === 0 ? 'Nguyên tử trung hòa' : charge_e > 0 ? 'Ion dương' : 'Ion âm',
    shells: [Math.min(2, p.electrons), Math.min(8, Math.max(0, p.electrons - 2)), Math.max(0, p.electrons - 10)],
  };
}
