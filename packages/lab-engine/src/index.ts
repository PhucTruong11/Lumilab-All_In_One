import type { LabDefinition } from '@lumilab/contracts';
export { defaultPendulum, pendulumPeriod, pendulumReading, pendulumAngleAtTime } from './pendulum';
export type { PendulumParameters } from './pendulum';
export * from './titration';
export * from './circuit';
export * from './runtime';
export * from './expanded-models';
export type { BrowserLabEngine as LabEngine } from './runtime';

// Input guard only; this does not establish server scientific verification.
export function validateParameters(lab: LabDefinition, parameters: Record<string, number>): string[] {
  const errors: string[] = [];
  for (const name of Object.keys(parameters)) {
    if (!Object.hasOwn(lab.parameters, name)) errors.push(`Unknown parameter: ${name}`);
  }
  for (const [name, definition] of Object.entries(lab.parameters)) {
    const value = parameters[name];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < definition.min || value > definition.max) {
      errors.push(`Out of range or missing: ${name}`);
    }
  }
  return errors;
}

export * from './additional-models';

export * from './curriculum-models';
