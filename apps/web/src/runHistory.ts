import type { LabId } from '@lumilab/lab-engine';
import { isPreview, type PreviewInput, type PreviewValue } from './api';

export const historyLimit = 20;
export const runHistoryKey = (id: LabId) => 'lumilab-preview-history-v1-' + id;

export interface DraftLabRun extends PreviewInput {
  schema_version: 1;
  lab_id: LabId;
  request_id: string;
  saved_at: string;
  status: 'INSUFFICIENT_DATA' | 'VERIFIED';
  code: 'REVIEWED_EVIDENCE_REQUIRED' | 'VERIFIED';
  preview: Record<string, PreviewValue>;
  facts?: Record<string, number>;
  evidence?: string[];
}

function isDraftRun(value: unknown, id: LabId): value is DraftLabRun {
  if (!value || typeof value !== 'object') return false;
  const run = value as Partial<DraftLabRun>;
  const validStatus =
    (run.status === 'INSUFFICIENT_DATA' && run.code === 'REVIEWED_EVIDENCE_REQUIRED') ||
    (run.status === 'VERIFIED' && run.code === 'VERIFIED');
  return run.schema_version === 1 && run.lab_id === id && validStatus &&
    typeof run.request_id === 'string' && !!run.request_id &&
    typeof run.saved_at === 'string' && Number.isFinite(Date.parse(run.saved_at)) &&
    typeof run.model_version === 'string' && typeof run.dataset_version === 'string' &&
    typeof run.elapsed_s === 'number' && Number.isFinite(run.elapsed_s) && run.elapsed_s >= 0 &&
    !!run.parameters && typeof run.parameters === 'object' && !Array.isArray(run.parameters) &&
    isPreview(run.preview);
}

export function readRunHistory(id: LabId): DraftLabRun[] {
  const raw = localStorage.getItem(runHistoryKey(id));
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(run => isDraftRun(run, id))) {
    throw new Error('Invalid draft run history');
  }
  return parsed.slice(0, historyLimit);
}

export function saveDraftRun(run: DraftLabRun): DraftLabRun[] {
  const previous = readRunHistory(run.lab_id);
  const next = [run, ...previous.filter(item => item.request_id !== run.request_id)].slice(0, historyLimit);
  localStorage.setItem(runHistoryKey(run.lab_id), JSON.stringify(next));
  return next;
}
