import practiceMap from '../practice-map.json';

export interface PracticeGroup {
  id: string; primary: string; title: string; runtime_ids: readonly string[];
}
export interface PracticeMap {
  schema_version: 'practice-map-1.0'; revision: string; practices: readonly PracticeGroup[];
  tutor_pilot_runtime_ids: readonly string[];
}
export const practiceMapping = practiceMap as PracticeMap;
export interface WebBuildInfo {
  schema_version: 'web-build-1.0'; git_sha: string; mapping_revision: string;
  mapping_fingerprint: string; runtime_fingerprint: string;
}
export interface SystemInfo {
  schema_version: 'system-info-1.0'; git_sha: string; mapping: PracticeMap;
  mapping_fingerprint: string; runtime_fingerprint: string;
  runtimes: { id: string; lifecycle: 'active' | 'archived'; model_version: string;
    dataset_version: string; tutor_pilot: boolean }[];
  corpus_revision: string; registry_revision: string;
  retrieval: { available: boolean; fingerprint: string | null; corpus_revision: string | null;
    embedding_id: string | null; matches_corpus: boolean };
}
