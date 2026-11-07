import { expect, test } from 'vitest';
import type { LabDefinition } from '@lumilab/contracts';
import lab from '../../../knowledge/labs/pendulum.lab.json';
import { validateParameters } from './index';

const config = lab as LabDefinition;
const defaults = Object.fromEntries(Object.entries(config.parameters).map(([key, value]) => [key, value.default]));
test('defaults and stationary/large-angle boundaries are accepted', () => {
  expect(validateParameters(config, defaults)).toEqual([]);
  for (const angle_deg of [0, 90]) expect(validateParameters(config, { ...defaults, angle_deg })).toEqual([]);
});
test('missing, unknown, non-finite and unsupported parameters are rejected', () => {
  expect(validateParameters(config, {})).toHaveLength(4);
  for (const angle_deg of [-1, 91, NaN, Infinity]) expect(validateParameters(config, { ...defaults, angle_deg })).not.toEqual([]);
  expect(validateParameters(config, { ...defaults, wrong: 1 })).toContain('Unknown parameter: wrong');
  expect(validateParameters(config, { ...defaults, toString: 1 })).toContain('Unknown parameter: toString');
});
