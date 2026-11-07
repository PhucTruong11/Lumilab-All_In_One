import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import Ajv from 'ajv';
import { expect, test } from 'vitest';
import schema from '../schemas/lab.schema.json';

const validate = new Ajv({ strict: true }).compile(schema);
const directory = resolve('knowledge/labs');
test('all draft lab configs satisfy the public schema and parameter bounds', () => {
  for (const name of readdirSync(directory).filter(name => name.endsWith('.json'))) {
    const data = JSON.parse(readFileSync(resolve(directory, name), 'utf8'));
    expect(validate(data), JSON.stringify(validate.errors)).toBe(true);
    for (const parameter of Object.values(data.parameters) as { min: number; max: number; default: number }[]) {
      expect(parameter.default).toBeGreaterThanOrEqual(parameter.min);
      expect(parameter.default).toBeLessThanOrEqual(parameter.max);
    }
  }
});
test('configs cannot quietly advertise unimplemented verification', () => {
  const data = JSON.parse(readFileSync(resolve(directory, 'pendulum.lab.json'), 'utf8'));
  data.implementation_status = 'verified';
  expect(validate(data)).toBe(false);
});
