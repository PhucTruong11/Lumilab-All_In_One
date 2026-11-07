import Ajv, { type AnySchema, type ValidateFunction } from 'ajv';
import catalog from '../labs/catalog.json';
import catalogSchema from '../schemas/catalog.schema.json';
import configSchema from '../schemas/runtime-lab.schema.json';
import sessionSchema from '../schemas/session.schema.json';
import pendulumConfig from '../labs/pendulum/lab.json';
import chemistryConfig from '../labs/chemistry/lab.json';
import circuitConfig from '../labs/circuit/lab.json';
import mechanicsConfig from '../labs/mechanics/lab.json';
import springConfig from '../labs/spring/lab.json';
import electrochemistryConfig from '../labs/electrochemistry/lab.json';
import atomicConfig from '../labs/atomic/lab.json';
import { mechanicsReading, springReading, electrochemistryReading, atomicReading, type MechanicsParameters, type SpringParameters, type ElectrochemistryParameters, type AtomicParameters } from './expanded-models';
import { pendulumReading, type PendulumParameters } from './pendulum';
import { titrationReading, type TitrationParameters } from './titration';
import { parallelCircuitReading, capacitorReading, precipitationReading, gasReactionReading, type ParallelCircuitParameters, type CapacitorParameters, type PrecipitationParameters, type GasReactionParameters } from './additional-models';
import parallelCircuitConfig from '../labs/parallel-circuit/lab.json';
import capacitorConfig from '../labs/capacitor/lab.json';
import precipitationConfig from '../labs/precipitation/lab.json';
import gasReactionConfig from '../labs/gas-reaction/lab.json';
import { circuitReading, type CircuitParameters } from './circuit';

import damped_springConfig from "../labs/spring-damped/lab.json";
import inclineConfig from "../labs/inclined-plane/lab.json";
import pulleyConfig from "../labs/pulley/lab.json";
import alkaliConfig from "../labs/alkali-water/lab.json";
import nitricConfig from "../labs/copper-nitric/lab.json";
import chlorineConfig from "../labs/chlorine-bleach/lab.json";
import { dampedSpringReading, type DampedSpringParameters, inclineReading, type InclineParameters, pulleyReading, type PulleyParameters, alkaliReading, type AlkaliParameters, nitricReading, type NitricParameters, chlorineReading, type ChlorineParameters } from './curriculum-models';

export const labIds = ['pendulum', 'chemistry', 'circuit', 'mechanics', 'spring', 'electrochemistry', 'atomic', 'parallel-circuit', 'capacitor', 'precipitation', 'gas-reaction', 'spring-damped', 'inclined-plane', 'pulley', 'alkali-water', 'copper-nitric', 'chlorine-bleach'] as const;
export type LabId = typeof labIds[number];
export function isLabId(value: string): value is LabId { return (labIds as readonly string[]).includes(value); }
export interface ParameterMap { pendulum: PendulumParameters; chemistry: TitrationParameters; circuit: CircuitParameters; mechanics: MechanicsParameters; spring: SpringParameters; electrochemistry: ElectrochemistryParameters; atomic: AtomicParameters; 'parallel-circuit': ParallelCircuitParameters; capacitor: CapacitorParameters; precipitation: PrecipitationParameters; 'gas-reaction': GasReactionParameters; 'spring-damped': DampedSpringParameters; 'inclined-plane': InclineParameters; 'pulley': PulleyParameters; 'alkali-water': AlkaliParameters; 'copper-nitric': NitricParameters; 'chlorine-bleach': ChlorineParameters }
export interface ReadingMap { pendulum: ReturnType<typeof pendulumReading>; chemistry: ReturnType<typeof titrationReading>; circuit: ReturnType<typeof circuitReading>; mechanics: ReturnType<typeof mechanicsReading>; spring: ReturnType<typeof springReading>; electrochemistry: ReturnType<typeof electrochemistryReading>; atomic: ReturnType<typeof atomicReading>; 'parallel-circuit': ReturnType<typeof parallelCircuitReading>; capacitor: ReturnType<typeof capacitorReading>; precipitation: ReturnType<typeof precipitationReading>; 'gas-reaction': ReturnType<typeof gasReactionReading>; 'spring-damped': ReturnType<typeof dampedSpringReading>; 'inclined-plane': ReturnType<typeof inclineReading>; 'pulley': ReturnType<typeof pulleyReading>; 'alkali-water': ReturnType<typeof alkaliReading>; 'copper-nitric': ReturnType<typeof nitricReading>; 'chlorine-bleach': ReturnType<typeof chlorineReading> }
export interface RuntimeLabDefinition {
  schema_version: '1.0'; id: LabId; title: string; subject: 'physics' | 'chemistry';
  model_version: string; dataset_version: string; implementation_status: 'client'; review_status: 'draft';
  constants?: Record<string, number>; constant_units?: Record<string, string>;
  duration_s?: number;
  assumptions: string[]; sources: { label: string; url: string }[];
  parameter_schema: { properties: Record<string, { type?: string; minimum?: number; maximum?: number; enum?: unknown[]; const?: unknown; description?: string }> } & Record<string, unknown>;
  defaults: ParameterMap[LabId];
}
export type Presentation = { side: -1 | 1; material: 'steel' | 'copper' | 'wood' };
export interface LabRecord<K extends LabId> { id: number; parameters: ParameterMap[K]; reading: ReadingMap[K]; elapsed_s: number }
export interface LabSnapshot<K extends LabId> {
  lab_id: K; phase: 'ready' | 'running' | 'paused'; revision: number; elapsed_s: number;
  parameters: ParameterMap[K]; reading: ReadingMap[K]; presentation: Presentation;
  notes: { prediction: string; reflection: string }; records: LabRecord<K>[];
}

const ajv = new Ajv({ allErrors: true, strictNumbers: true });
const checkDefinition = ajv.compile(configSchema);
const checkSession = ajv.compile(sessionSchema);
const versions: Record<LabId, string> = { pendulum: 'pendulum-agm-v1', chemistry: 'ideal-strong-titration-ts-v1', circuit: 'ideal-series-circuit-ts-v1', mechanics: 'constant-force-motion-v1', spring: 'horizontal-hooke-oscillator-v1', electrochemistry: 'standard-galvanic-cell-v1', atomic: 'atomic-particle-counts-v1', 'parallel-circuit': 'ideal-two-resistor-network-v1', capacitor: 'ideal-rc-step-v1', precipitation: 'ideal-agcl-precipitation-v1', 'gas-reaction': 'ideal-bicarbonate-gas-v1',
  'spring-damped': 'viscous-spring-underdamped-v1',
  'inclined-plane': 'rest-release-incline-v1',
  'pulley': 'vertical-ideal-pulley-v1',
  'alkali-water': 'alkali-water-flame-qualitative-v1',
  'copper-nitric': 'copper-nitric-qualitative-v1',
  'chlorine-bleach': 'chlorine-moisture-qualitative-v1',
};
function clone<T>(value: T): T { return structuredClone(value); }
function freeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export function validateLabDefinition(value: unknown): RuntimeLabDefinition {
  if (!checkDefinition(value)) throw new Error(`Lab config: ${ajv.errorsText(checkDefinition.errors)}`);
  const definition = value as unknown as RuntimeLabDefinition;
  if (definition.subject !== (['chemistry', 'electrochemistry', 'atomic', 'precipitation', 'gas-reaction', 'alkali-water', 'copper-nitric', 'chlorine-bleach'].includes(definition.id) ? 'chemistry' : 'physics')) throw new Error('Subject/model mismatch');
  if (versions[definition.id] !== definition.model_version) throw new Error('Unsupported model version');
  const validate = ajv.compile(definition.parameter_schema as AnySchema);
  if (!validate(definition.defaults)) throw new Error(`Invalid lab defaults: ${ajv.errorsText(validate.errors)}`);
  calculate(definition.id, definition.defaults);
  return freeze(clone(definition));
}
export const labDefinitions: Record<LabId, RuntimeLabDefinition> = freeze({
  pendulum: validateLabDefinition(pendulumConfig), chemistry: validateLabDefinition(chemistryConfig), circuit: validateLabDefinition(circuitConfig),
  mechanics: validateLabDefinition(mechanicsConfig), spring: validateLabDefinition(springConfig), electrochemistry: validateLabDefinition(electrochemistryConfig), atomic: validateLabDefinition(atomicConfig),
  'parallel-circuit': validateLabDefinition(parallelCircuitConfig), capacitor: validateLabDefinition(capacitorConfig), precipitation: validateLabDefinition(precipitationConfig), 'gas-reaction': validateLabDefinition(gasReactionConfig),
  'spring-damped': validateLabDefinition(damped_springConfig),
  'inclined-plane': validateLabDefinition(inclineConfig),
  'pulley': validateLabDefinition(pulleyConfig),
  'alkali-water': validateLabDefinition(alkaliConfig),
  'copper-nitric': validateLabDefinition(nitricConfig),
  'chlorine-bleach': validateLabDefinition(chlorineConfig),
});
const checkCatalog = ajv.compile(catalogSchema);
if (!checkCatalog(catalog) || catalog.active.length + catalog.archived.length !== labIds.length || new Set([...catalog.active, ...catalog.archived]).size !== labIds.length ||
    [...catalog.active, ...catalog.archived].some(id => !isLabId(id))) throw new Error('Invalid runtime catalog');
export const activeLabIds = Object.freeze(catalog.active as LabId[]);
export const archivedLabIds = Object.freeze(catalog.archived as LabId[]);
function calculate<K extends LabId>(id: K, parameters: ParameterMap[K], elapsed_s = 0): ReadingMap[K] {
  let reading: ReadingMap[LabId];
  switch (id) {
    case 'pendulum': reading = pendulumReading(parameters as PendulumParameters); break;
    case 'chemistry': reading = titrationReading(parameters as TitrationParameters); break;
    case 'circuit': reading = circuitReading(parameters as CircuitParameters); break;
    case 'mechanics': reading = mechanicsReading(parameters as MechanicsParameters, elapsed_s); break;
    case 'spring': reading = springReading(parameters as SpringParameters, elapsed_s); break;
    case 'electrochemistry': reading = electrochemistryReading(parameters as ElectrochemistryParameters); break;
    case 'atomic': reading = atomicReading(parameters as AtomicParameters); break;
    case 'parallel-circuit': reading = parallelCircuitReading(parameters as ParallelCircuitParameters); break;
    case 'capacitor': reading = capacitorReading(parameters as CapacitorParameters, elapsed_s); break;
    case 'precipitation': reading = precipitationReading(parameters as PrecipitationParameters); break;
    case 'gas-reaction': reading = gasReactionReading(parameters as GasReactionParameters); break;
    case 'spring-damped': reading = dampedSpringReading(parameters as DampedSpringParameters, elapsed_s); break;
    case 'inclined-plane': reading = inclineReading(parameters as InclineParameters, elapsed_s); break;
    case 'pulley': reading = pulleyReading(parameters as PulleyParameters); break;
    case 'alkali-water': reading = alkaliReading(parameters as AlkaliParameters); break;
    case 'copper-nitric': reading = nitricReading(parameters as NitricParameters); break;
    case 'chlorine-bleach': reading = chlorineReading(parameters as ChlorineParameters); break;
    default: throw new Error('Unsupported lab');
  }
  return reading as ReadingMap[K];
}

/** Pure browser runtime. Host supplies time; no React, DOM, network or storage. */
export class BrowserLabEngine<K extends LabId> {
  readonly definition: RuntimeLabDefinition;
  readonly modelVersion: string;
  private state: LabSnapshot<K>;
  private validator: ValidateFunction;
  private listeners = new Set<() => void>();
  private disposed = false;
  private nextRecordId = 1;

  constructor(readonly id: K) {
    if (!Object.hasOwn(labDefinitions, id)) throw new Error('Unknown lab');
    this.definition = labDefinitions[id]; this.modelVersion = this.definition.model_version;
    this.validator = ajv.compile(this.definition.parameter_schema as AnySchema);
    const parameters = clone(this.definition.defaults) as ParameterMap[K];
    this.state = freeze({ lab_id: id, phase: 'ready', revision: 0, elapsed_s: 0, parameters, reading: calculate(id, parameters), presentation: { side: 1, material: 'steel' }, notes: { prediction: '', reflection: '' }, records: [] });
  }
  snapshot = (): LabSnapshot<K> => this.state;
  subscribe = (listener: () => void): (() => void) => {
    this.assertAlive(); this.listeners.add(listener); return () => { this.listeners.delete(listener); };
  };
  private assertAlive() { if (this.disposed) throw new Error('Engine disposed'); }
  private parameters(value: unknown): ParameterMap[K] {
    if (!this.validator(value)) throw new Error(`Thông số không hợp lệ: ${ajv.errorsText(this.validator.errors)}`);
    calculate(this.id, value as ParameterMap[K]);
    return clone(value as ParameterMap[K]);
  }
  private publish(patch: Partial<LabSnapshot<K>>) {
    this.assertAlive(); this.state = freeze({ ...this.state, ...patch, revision: this.state.revision + 1 });
    this.listeners.forEach(listener => listener());
  }
  setParameters(patch: Partial<ParameterMap[K]>) {
    this.assertAlive();
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new Error('Parameters patch must be an object');
    const parameters = this.parameters({ ...this.state.parameters, ...patch });
    this.publish({ parameters, reading: calculate(this.id, parameters), elapsed_s: 0, phase: 'ready' });
  }
  run() {
    this.assertAlive();
    if (this.id === 'pendulum' && (this.state.parameters as PendulumParameters).angle_deg === 0) return;
    if (this.id === 'spring' && (this.state.parameters as SpringParameters).displacement_m === 0) return;
    if (this.state.phase !== 'running') {
      const rewind = this.definition.duration_s !== undefined && this.state.elapsed_s >= this.definition.duration_s;
      this.publish({ phase: 'running', ...(rewind ? { elapsed_s: 0, reading: calculate(this.id, this.state.parameters, 0) } : {}) });
    }
  }
  pause() { this.assertAlive(); if (this.state.phase === 'running') this.publish({ phase: 'paused' }); }
  step(delta_s: number) {
    this.assertAlive();
    if (!Number.isFinite(delta_s) || delta_s < 0 || delta_s > .25) throw new RangeError('Step must be 0–0.25 s');
    if (this.state.phase === 'running' && delta_s > 0) {
      const limit = this.definition.duration_s ?? 86400;
      const elapsed_s = Math.min(limit, this.state.elapsed_s + delta_s);
      this.publish({ elapsed_s, reading: calculate(this.id, this.state.parameters, elapsed_s), ...(elapsed_s >= limit ? { phase: 'paused' as const } : {}) });
    }
  }
  reset() {
    const parameters = clone(this.definition.defaults) as ParameterMap[K];
    this.publish({ parameters, reading: calculate(this.id, parameters), elapsed_s: 0, phase: 'ready', presentation: { side: 1, material: 'steel' } });
  }
  setPresentation(patch: Partial<Presentation>) {
    this.assertAlive();
    if (!patch || typeof patch !== 'object' || Object.keys(patch).some(key => !['side', 'material'].includes(key))) throw new Error('Invalid presentation');
    const presentation = { ...this.state.presentation, ...patch };
    if (![1, -1].includes(presentation.side) || !['steel', 'copper', 'wood'].includes(presentation.material)) throw new Error('Invalid presentation');
    this.publish({ presentation });
  }
  setNotes(patch: Partial<LabSnapshot<K>['notes']>) {
    this.assertAlive();
    if (!patch || typeof patch !== 'object') throw new Error('Invalid learning notes');
    const notes = { ...this.state.notes, ...patch };
    if (Object.values(notes).some(value => typeof value !== 'string' || value.length > 1000) || Object.keys(notes).some(key => !['prediction', 'reflection'].includes(key))) throw new Error('Invalid learning notes');
    this.publish({ notes });
  }
  record() {
    if (this.id === 'circuit' && !(this.state.reading as ReadingMap['circuit']).valid) throw new Error('Sửa cách mắc trước khi ghi số đo');
    const row = { id: this.nextRecordId++, parameters: clone(this.state.parameters), reading: clone(this.state.reading), elapsed_s: this.state.elapsed_s };
    this.publish({ records: [...this.state.records.slice(-19), row] });
  }
  clearRecords() { this.publish({ records: [] }); }
  serialize(): string {
    const { parameters, elapsed_s, presentation, notes, records } = this.state;
    // Export inputs only; readings are recomputed when restored, never trusted from a file.
    return JSON.stringify({ schema_version: 'session-1.0', lab_id: this.id, model_version: this.modelVersion, dataset_version: this.definition.dataset_version, parameters, elapsed_s, presentation, notes, records: records.map(row => ({ parameters: row.parameters, elapsed_s: row.elapsed_s })) }, null, 2);
  }
  restore(json: string) {
    this.assertAlive();
    if (json.length > 64000) throw new Error('Tệp phiên vượt 64 KB');
    const value: unknown = JSON.parse(json);
    if (!checkSession(value)) throw new Error(`Tệp phiên không hợp lệ: ${ajv.errorsText(checkSession.errors)}`);
    const session = value as { lab_id: string; model_version: string; dataset_version: string; parameters: unknown; elapsed_s: number; presentation: Presentation; notes: LabSnapshot<K>['notes']; records: { parameters: unknown; elapsed_s: number }[] };
    if (session.lab_id !== this.id || session.model_version !== this.modelVersion || session.dataset_version !== this.definition.dataset_version) throw new Error('Phiên khác bài hoặc phiên bản mô hình/học liệu');
    if (session.elapsed_s > (this.definition.duration_s ?? 86400) || session.records.some(row => row.elapsed_s > (this.definition.duration_s ?? 86400))) throw new Error('Time outside lab duration');
    const parameters = this.parameters(session.parameters);
    const records = session.records.map((row, index) => { const p = this.parameters(row.parameters); return { id: index + 1, parameters: p, elapsed_s: row.elapsed_s, reading: calculate(this.id, p, row.elapsed_s) }; });
    this.publish({ parameters, reading: calculate(this.id, parameters, session.elapsed_s), elapsed_s: session.elapsed_s, phase: session.elapsed_s > 0 ? 'paused' : 'ready', records, presentation: clone(session.presentation), notes: clone(session.notes) });
    this.nextRecordId = records.length + 1;
  }
  dispose() { this.disposed = true; this.listeners.clear(); }
}
export function createLabEngine<K extends LabId>(id: K) { return new BrowserLabEngine(id); }
