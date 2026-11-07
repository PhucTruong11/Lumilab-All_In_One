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
): Promise<{ requestId: string; values: Record<string, PreviewValue> }> {
  const response = await fetch(apiBase + '/api/v1/verification/labs/' + encodeURIComponent(labId), {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal,
  });
  if (!response.ok) throw new Error('Máy chủ chưa trả được kết quả. Hãy thử lại.');
  const data = await response.json();
  if (data?.code === 'REVISION_MISMATCH') throw new Error('Phiên bản lab khác máy chủ. Hãy tải lại trang.');
  if (data?.status !== 'INSUFFICIENT_DATA' || data.code !== 'REVIEWED_EVIDENCE_REQUIRED' ||
      data.model_version !== input.model_version || data.dataset_version !== input.dataset_version ||
      typeof data.request_id !== 'string' || !data.request_id || !isPreview(data.preview)) {
    throw new Error('Máy chủ chưa có bản xem trước phù hợp.');
  }
  return { requestId: data.request_id, values: data.preview };
}
