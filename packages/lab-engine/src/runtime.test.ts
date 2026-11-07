import { describe, expect, it, vi } from 'vitest';
import { createLabEngine, labDefinitions, validateLabDefinition, type LabId } from './runtime';

describe('runtime config, state machine and portable sessions', () => {
  it('loads each reviewed-scope client config; rejects missing/unknown metadata or invalid defaults', () => {
    for (const id of Object.keys(labDefinitions) as LabId[]) expect(createLabEngine(id).snapshot().lab_id).toBe(id);
    for (const patch of [{ schema_version: '2.0' }, { subject: 'chemistry' }, { model_version: 'llm-v1' }, { id: 'zn-hcl' }, { defaults: { length_m: 99 } }, { arbitrary: true }]) expect(() => validateLabDefinition({ ...labDefinitions.pendulum, ...patch })).toThrow();
    expect(() => validateLabDefinition({})).toThrow();
  });
  it('applies validated changes atomically, freezes snapshots, gives stable snapshots until an event', () => {
    const engine = createLabEngine('pendulum'); const initial = engine.snapshot();
    expect(engine.snapshot()).toBe(initial);
    for (const patch of [{ length_m: -1 }, { mass_kg: NaN }, { length_m: Infinity }, { gravity_m_s2: 10 }, { unknown: 10 }]) expect(() => engine.setParameters(patch)).toThrow();
    expect(engine.snapshot()).toBe(initial);
    expect(() => { engine.snapshot().parameters.length_m = 2; }).toThrow();
    const notify = vi.fn(); const off = engine.subscribe(notify);
    engine.setParameters({ length_m: 2 }); expect(engine.snapshot().reading.period_s).toBeGreaterThan(initial.reading.period_s!);
    expect(notify).toHaveBeenCalledTimes(1); off(); engine.pause(); expect(notify).toHaveBeenCalledTimes(1);
  });
  it('owns elapsed time, pause/resume, zero release, reset and disposal', () => {
    const engine = createLabEngine('pendulum'); engine.step(.1); expect(engine.snapshot().elapsed_s).toBe(0);
    engine.run(); engine.step(.1); engine.pause(); engine.step(.1); expect(engine.snapshot().elapsed_s).toBe(.1);
    engine.run(); engine.step(.1); expect(engine.snapshot().elapsed_s).toBe(.2);
    for (const delta of [-1, Infinity, NaN, 1]) expect(() => engine.step(delta)).toThrow();
    engine.record(); engine.reset(); expect(engine.snapshot().elapsed_s).toBe(0); expect(engine.snapshot().records).toHaveLength(1);
    engine.setParameters({ angle_deg: 0 }); engine.run(); expect(engine.snapshot().phase).toBe('ready');
    engine.dispose(); expect(() => engine.run()).toThrow(); expect(() => engine.subscribe(() => {})).toThrow();
  });
  it('caps records and restores snapshots by recomputing inputs, with no imported reading', () => {
    const original = createLabEngine('chemistry'); original.setParameters({ baseVolume_ml: 25 });
    original.setNotes({ prediction: 'pH khoảng7', reflection: 'Đã đối chiếu số mol' });
    for (let i = 0; i < 25; i++) original.record(); expect(original.snapshot().records).toHaveLength(20);
    const json = original.serialize(); expect(JSON.parse(json).records[0]).not.toHaveProperty('reading');
    const restored = createLabEngine('chemistry'); restored.restore(json);
    expect(restored.snapshot().reading.pH).toBe(7); expect(restored.snapshot().records[0].reading.pH).toBe(7); expect(restored.snapshot().notes).toEqual(original.snapshot().notes);
    restored.clearRecords(); expect(restored.snapshot().records).toHaveLength(0);
  });
  it('rejects forged facts, version/units/record errors without losing a good session', () => {
    const engine = createLabEngine('circuit'); engine.setParameters({ voltage_V: 12 }); const good = engine.snapshot(); const value = JSON.parse(engine.serialize());
    for (const patch of [{ lab_id: 'pendulum' }, { model_version: 'old' }, { dataset_version: 'old' }, { reading: { current_A: 999 } }, { elapsed_s: Infinity }, { parameters: { ...value.parameters, voltage_V: 13 } }, { records: [{ parameters: {}, elapsed_s: 0 }] }, { notes: { prediction: 'x'.repeat(1001), reflection: '' } }, { presentation: { side: 0, material: 'steel' } }]) {
      expect(() => engine.restore(JSON.stringify({ ...value, ...patch }))).toThrow(); expect(engine.snapshot()).toBe(good);
    }
    expect(() => engine.restore('x'.repeat(64001))).toThrow(); expect(() => engine.restore('{')).toThrow();
    engine.setParameters({ ammeter: 'parallel' }); expect(() => engine.record()).toThrow();
    expect(() => engine.setParameters({ slots: ['switchInstalled', 'switchInstalled', null] })).toThrow();
  });
  it('restores paused and allows continuing without running autonomously', () => {
    const engine = createLabEngine('pendulum'); engine.run(); engine.step(.2);
    const restored = createLabEngine('pendulum'); restored.restore(engine.serialize());
    expect(restored.snapshot().phase).toBe('paused'); expect(restored.snapshot().elapsed_s).toBe(.2);
    restored.run(); restored.step(.1); expect(restored.snapshot().elapsed_s).toBeCloseTo(.3);
  });
  it('restores a valid circuit v1 session, then writes v2', () => {
    const engine = createLabEngine('circuit');
    const old = JSON.parse(engine.serialize()); old.model_version = 'ideal-series-circuit-ts-v1';
    old.parameters.slots = ['bulb', 'extraResistor', null];
    engine.restore(JSON.stringify(old));
    expect(engine.snapshot().reading.current_A).toBeCloseTo(.12);
    expect(JSON.parse(engine.serialize()).model_version).toBe('ideal-series-circuit-ts-v2');
    old.parameters.slots = ['bulb', 'bulb', null];
    expect(() => engine.restore(JSON.stringify(old))).toThrow();
  });
});
