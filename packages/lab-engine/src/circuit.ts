/** Ideal series DC load. A in series; V across main resistor. No real short-circuit model. */
export const circuitModelVersion = 'ideal-series-circuit-ts-v1';
export const circuitParts = { extraResistor: { name: 'Điện trở phụ', resistance: 20 }, bulb: { name: 'Bóng đèn', resistance: 10 }, switchInstalled: { name: 'Công tắc', resistance: 0 } } as const;
export type CircuitPart = keyof typeof circuitParts;
export type Connection = 'series' | 'parallel';
export interface CircuitParameters {
  voltage_V: number; resistance_ohm: number; ammeter: Connection; voltmeter: Connection;
  slots: (CircuitPart | null)[]; switchClosed: boolean;
}
export const defaultCircuit: CircuitParameters = { voltage_V: 6, resistance_ohm: 20, ammeter: 'series', voltmeter: 'parallel', slots: [null, null, null], switchClosed: true };
export function validateCircuit(parameters: CircuitParameters) {
  const { voltage_V, resistance_ohm, slots, ammeter, voltmeter, switchClosed } = parameters;
  if (!Number.isFinite(voltage_V) || voltage_V < 0 || voltage_V > 12 || !Number.isFinite(resistance_ohm) || resistance_ohm < 5 || resistance_ohm > 100) throw new RangeError('Circuit parameter outside bounds');
  if (!['series', 'parallel'].includes(ammeter) || !['series', 'parallel'].includes(voltmeter) || typeof switchClosed !== 'boolean') throw new TypeError('Invalid meter/switch');
  if (!Array.isArray(slots) || slots.length !== 3 || slots.some(part => part !== null && !Object.hasOwn(circuitParts, part)) || new Set(slots.filter(Boolean)).size !== slots.filter(Boolean).length) throw new RangeError('Invalid component layout');
}
export function placeCircuitPart(parameters: CircuitParameters, part: CircuitPart, index: number): CircuitParameters {
  validateCircuit(parameters);
  if (!Object.hasOwn(circuitParts, part) || !Number.isInteger(index) || index < 0 || index > 2) throw new RangeError('Invalid component or slot');
  const slots = [...parameters.slots];
  const origin = slots.indexOf(part);
  if (origin >= 0 && origin !== index) slots[origin] = slots[index];
  slots[index] = part;
  return { ...parameters, slots, switchClosed: part === 'switchInstalled' && origin < 0 ? true : parameters.switchClosed };
}
export function removeCircuitPart(parameters: CircuitParameters, part: CircuitPart): CircuitParameters {
  validateCircuit(parameters);
  return { ...parameters, slots: parameters.slots.map(item => item === part ? null : item), switchClosed: part === 'switchInstalled' ? true : parameters.switchClosed };
}
export function circuitReading(parameters: CircuitParameters) {
  validateCircuit(parameters);
  const { slots, resistance_ohm, voltage_V, ammeter, voltmeter } = parameters;
  const totalResistance_ohm = resistance_ohm + slots.reduce<number>((sum, part) => sum + (part ? circuitParts[part].resistance : 0), 0);
  const closed = !slots.includes('switchInstalled') || parameters.switchClosed;
  const valid = ammeter === 'series' && voltmeter === 'parallel';
  const current_A = valid ? closed ? voltage_V / totalResistance_ohm : 0 : null;
  return { valid, closed, totalResistance_ohm, current_A,
    resistorVoltage_V: current_A === null ? null : current_A * resistance_ohm,
    power_W: current_A === null ? null : voltage_V * current_A,
    bulbPower_W: current_A === null ? null : current_A ** 2 * (slots.includes('bulb') ? 10 : 0),
  };
}
export function circuitCurve(parameters: CircuitParameters) {
  const reading = circuitReading(parameters);
  return Array.from({ length: 13 }, (_, voltage) => ({ voltage, current: reading.valid ? reading.closed ? voltage / reading.totalResistance_ohm : 0 : null }));
}
