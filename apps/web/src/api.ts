import type { LabDefinition } from '@lumilab/contracts';

export const apiBase = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export async function loadLabs(signal: AbortSignal): Promise<LabDefinition[]> {
  const response = await fetch(`${apiBase}/api/v1/labs`, { signal });
  if (!response.ok) throw new Error(`Không tải được thư viện (HTTP ${response.status}).`);
  const data: { items: LabDefinition[] } = await response.json();
  if (!Array.isArray(data.items)) throw new Error('API trả về catalog không hợp lệ.');
  return data.items;
}

export type PreviewValue = number | boolean | string | null | number[];

export type PreviewInput = {
  model_version: string; dataset_version: string; parameters: object; elapsed_s: number;
};

export type PreviewVerification = {
  requestId: string;
  status: 'INSUFFICIENT_DATA' | 'VERIFIED';
  code: 'REVIEWED_EVIDENCE_REQUIRED' | 'VERIFIED';
  values: Record<string, PreviewValue>;
  facts: Record<string, number>;
  evidence: string[];
  stageChecks: { stage: string; status: string; code: string; reason: string }[];
  limitations: string[];
  checksSkipped: string[];
};

export function isPreview(value: unknown): value is Record<string, PreviewValue> {
  return !!value && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length > 0 && Object.values(value).every(item =>
      item === null || typeof item === 'string' || typeof item === 'boolean' ||
      (typeof item === 'number' && Number.isFinite(item)) ||
      (Array.isArray(item) && item.every(entry => typeof entry === 'number' && Number.isFinite(entry))));
}

export async function loadLabPreview(
  labId: string,
  input: PreviewInput,
  signal: AbortSignal,
): Promise<PreviewVerification> {
  const response = await fetch(apiBase + '/api/v1/verification/labs/' + encodeURIComponent(labId), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal,
  });
  if (!response.ok) {
    if (response.status === 422) throw new Error('Thông số gửi lên không đúng định dạng. Hãy kiểm tra và thử lại.');
    throw new Error('Máy chủ chưa trả được kết quả. Hãy thử lại.');
  }
  const data: unknown = await response.json();
  if (!data || typeof data !== 'object') throw new Error('API trả về kết quả không hợp lệ.');
  const result = data as Record<string, unknown>;
  if (result.code === 'REVISION_MISMATCH') throw new Error('Phiên bản lab khác máy chủ. Hãy tải lại trang.');
  const fields = Array.isArray(result.fields) && result.fields.every(item => typeof item === 'string')
    ? result.fields as string[] : [];
  const fieldNote = fields.length ? ` Trường liên quan: ${fields.join(', ')}.` : '';
  if (result.status === 'INVALID') throw new Error('Thông số hoặc kết quả không hợp lệ.' + fieldNote);
  if (result.status === 'UNSUPPORTED') throw new Error('Thông số nằm ngoài phạm vi mô hình.' + fieldNote);
  if (result.code === 'SCIENTIFIC_CHECKS_INCOMPLETE') {
    throw new Error('Máy chủ chưa hoàn thành các bước kiểm khoa học. Không có bản xem trước để lưu.');
  }
  if (result.code === 'MISSING_INPUT') throw new Error('Chưa đủ thông số để tính lại.' + fieldNote);
  const validDraft = result.status === 'INSUFFICIENT_DATA' && result.code === 'REVIEWED_EVIDENCE_REQUIRED';
  const validVerified = result.status === 'VERIFIED' && result.code === 'VERIFIED' &&
    !!result.facts && typeof result.facts === 'object' && !Array.isArray(result.facts) &&
    Object.keys(result.facts as object).length > 0 &&
    Object.values(result.facts as Record<string, unknown>).every(v => typeof v === 'number' && Number.isFinite(v)) &&
    Array.isArray(result.evidence) && result.evidence.length > 0 &&
    result.evidence.every(item => typeof item === 'string');
  if ((!validDraft && !validVerified) ||
      result.model_version !== input.model_version || result.dataset_version !== input.dataset_version ||
      typeof result.request_id !== 'string' || !result.request_id || !isPreview(result.preview) ||
      !Array.isArray(result.stage_checks) || !result.stage_checks.every(item =>
        !!item && typeof item === 'object' &&
        ['stage', 'status', 'code', 'reason'].every(key => typeof item[key] === 'string')) ||
      !Array.isArray(result.limitations) || !result.limitations.every(item => typeof item === 'string') ||
      !Array.isArray(result.checks_skipped) || !result.checks_skipped.every(item => typeof item === 'string')) {
    throw new Error('Máy chủ chưa có bản xem trước phù hợp.');
  }
  return {
    requestId: result.request_id,
    status: result.status as PreviewVerification['status'],
    code: result.code as PreviewVerification['code'],
    values: result.preview,
    facts: (validVerified ? result.facts : {}) as Record<string, number>,
    evidence: (validVerified ? result.evidence : []) as string[],
    stageChecks: result.stage_checks as PreviewVerification['stageChecks'],
    limitations: result.limitations as string[],
    checksSkipped: result.checks_skipped as string[],
  };
}
