import { describe, expect, it } from 'vitest';
import vectors from '../../../tests/golden/server-readings.json';
import { createLabEngine, type LabId } from './runtime';

describe('shared server reading vectors', () => {
  it.each(vectors)('$lab at $time with $parameters', ({ lab, parameters, time, expected }) => {
    const engine = createLabEngine(lab as LabId);
    engine.setParameters(parameters);
    if (time) {
      engine.run();
      for (let remaining = time; remaining > 0;) {
        const step = Math.min(remaining, 0.25);
        engine.step(step);
        remaining -= step;
      }
    }
    const reading = engine.snapshot().reading as unknown as Record<string, unknown>;
    for (const [key, value] of Object.entries(expected)) {
      if (typeof value === 'number') expect(reading[key]).toBeCloseTo(value, 9);
      else expect(reading[key]).toEqual(value);
    }
    engine.dispose();
  });
});
