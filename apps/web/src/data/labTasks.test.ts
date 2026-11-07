import { describe, expect, it } from 'vitest';
import { createLabEngine, labDefinitions, type LabId, type ParameterMap } from '@lumilab/lab-engine';
import physicsSource from './physics-tasks.json';
import chemistrySource from './chemistry-tasks.json';

describe('lab tasks catalog', () => {
  const allTasks = [...physicsSource.tasks, ...chemistrySource.tasks];

  it('has valid tasks with unique IDs', () => {
    const ids = allTasks.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(allTasks.length).toBeGreaterThanOrEqual(17);
  });

  it('contains tasks for all quantitative chemistry labs', () => {
    const chemRuntimeIds = ['chemistry', 'precipitation', 'gas-reaction', 'electrochemistry', 'atomic'];
    for (const rId of chemRuntimeIds) {
      const found = chemistrySource.tasks.some(t => t.runtime_id === rId);
      expect(found, `Expected task for ${rId}`).toBe(true);
    }
  });

  for (const task of allTasks) {
    it(`task ${task.id} (${task.runtime_id}) applies sample cases cleanly to engine`, () => {
      const runtimeId = task.runtime_id as LabId;
      expect(labDefinitions[runtimeId]).toBeDefined();
      const engine = createLabEngine(runtimeId);
      for (const sample of task.cases) {
        expect(() => {
          engine.setParameters({
            ...labDefinitions[runtimeId].defaults,
            ...sample.parameters,
          } as Partial<ParameterMap[LabId]>);
        }).not.toThrow();
      }
    });
  }
});

