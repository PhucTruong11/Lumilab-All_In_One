import { describe, expect, it } from 'vitest';
import { activeLabIds, createLabEngine, type LabId } from '@lumilab/lab-engine';
import { experimentParameters, labExperiments } from './labExperiments';

describe('starting configurations', () => {
  it('covers every active runtime', () => {
    expect(activeLabIds.every(id => (labExperiments[id]?.length ?? 0) >= 3)).toBe(true);
  });
  for (const id of Object.keys(labExperiments) as LabId[]) {
    it(`${id}: each configuration passes the real engine validation`, () => {
      const engine = createLabEngine(id);
      for (const experiment of labExperiments[id]!) {
        const parameters = experimentParameters(id, experiment);
        engine.setParameters(parameters);
        expect(engine.snapshot().parameters).toEqual(parameters);
        expect(engine.snapshot().elapsed_s).toBe(0);
      }
    });
  }
});
