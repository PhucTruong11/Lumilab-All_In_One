// Keep public types aligned with schemas/lab.schema.json. T3 owns contract changes.
export * from './system';
export type Domain = 'physics' | 'chemistry';
export interface ParameterDefinition { unit: string; min: number; max: number; default: number }
export interface LabDefinition {
  id: string; title: string; summary: string; domain: Domain; schema_version: '1.0';
  model_version: string; dataset_version: string; implementation_status: 'planned';
  review_status: 'draft'; parameters: Record<string, ParameterDefinition>; evidence_ids: string[];
}
export type VerificationStatus = 'VERIFIED' | 'INVALID' | 'UNSUPPORTED' | 'INSUFFICIENT_DATA';
