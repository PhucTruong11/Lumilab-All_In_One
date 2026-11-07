import { expect, it } from 'vitest';
import Ajv from 'ajv';
import { practiceMapping } from './system';
import { practiceGroups } from '../../../apps/web/src/data/practice';
import { activeLabIds, archivedLabIds } from '../../lab-engine/src/runtime';
import schema from '../schemas/practice-map.schema.json';

it('shared mapping covers every active mode exactly once and preserves the reviewed pilot scope', () => {
  // Generated Pydantic schema uses draft 2020-style defs but this schema has no draft-specific keywords.
  const validator = new Ajv({ strict: false }).compile(schema);
  expect(validator(practiceMapping), JSON.stringify(validator.errors)).toBe(true);
  const modes = practiceMapping.practices.flatMap(p => p.runtime_ids);
  expect(new Set(modes).size).toBe(modes.length);
  expect([...modes].sort()).toEqual([...activeLabIds].sort());
  expect(practiceGroups.map(p => p.primary)).toEqual(practiceMapping.practices.map(p => p.primary));
  expect(practiceMapping.practices).toHaveLength(11);
  expect(practiceMapping.tutor_pilot_runtime_ids).toEqual(['pendulum', 'circuit', 'chemistry']);
  expect(activeLabIds).toContain('chemistry');
  expect(archivedLabIds).toEqual(['alkali-water', 'copper-nitric', 'chlorine-bleach']);
  for (const p of practiceMapping.practices) expect(p.runtime_ids).toContain(p.primary);
});
