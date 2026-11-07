import type { LabId } from '@lumilab/lab-engine';
import { apiBase, type PreviewInput, type PreviewValue } from './api';
import type { DraftLabRun } from './runHistory';

type Session = { session_id: string; session_token: string; expires_at: string };
export type ServerRun = {
  run_id: string;
  lab_id: LabId;
  saved_at: string;
  input: PreviewInput;
  result: {
    status: 'INSUFFICIENT_DATA' | 'VERIFIED';
    code: 'REVIEWED_EVIDENCE_REQUIRED' | 'VERIFIED';
    preview: Record<string, PreviewValue>;
    facts?: Record<string, number>;
    evidence?: string[];
  };
};
export type ServerRunPage = { items: ServerRun[]; next_offset: number | null };

const sessionKey = 'lumilab-server-session-v1:' + apiBase;
let pendingSession: Promise<Session> | undefined;

export function readServerSession(): Session | null {
  const raw = sessionStorage.getItem(sessionKey);
  if (!raw) return null;
  const session: Session = JSON.parse(raw);
  if (typeof session.session_id !== 'string' || typeof session.session_token !== 'string' ||
      !(Date.parse(session.expires_at) > Date.now())) return null;
  return session;
}

async function request<T>(path: string, init: RequestInit = {}, session?: Session): Promise<T> {
  const response = await fetch(apiBase + '/api/v1/sessions' + path, {
    ...init, cache: 'no-store', signal: init.signal ?? AbortSignal.timeout(8000),
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(session ? { Authorization: 'Bearer ' + session.session_token } : {}),
    },
  });
  if (response.status === 401 && session) {
    if (readServerSession()?.session_id === session.session_id) sessionStorage.removeItem(sessionKey);
    throw new Error('Phiên máy chủ đã hết hiệu lực. Hãy bấm lưu lại để mở phiên mới.');
  }
  if (!response.ok) throw new Error(response.status === 503 ?
    'PostgreSQL chưa sẵn sàng. Hãy thử lại khi máy chủ kết nối được cơ sở dữ liệu.' :
    'Máy chủ chưa hoàn tất yêu cầu lịch sử. Hãy thử lại.');
  return response.json();
}

async function getOrCreateSession(): Promise<Session> {
  const existing = readServerSession();
  if (existing) return existing;
  pendingSession ??= request<Session>('', { method: 'POST' }).then(session => {
    sessionStorage.setItem(sessionKey, JSON.stringify(session));
    return session;
  }).finally(() => { pendingSession = undefined; });
  return pendingSession;
}

export async function saveServerRun(run: DraftLabRun): Promise<ServerRun> {
  const session = await getOrCreateSession();
  const { lab_id, parameters, elapsed_s, model_version, dataset_version, request_id } = run;
  return request('/' + encodeURIComponent(session.session_id) + '/runs', {
    method: 'POST',
    body: JSON.stringify({ lab_id, parameters, elapsed_s, model_version, dataset_version, idempotency_key: request_id }),
  }, session);
}

export async function listServerRuns(id: LabId, offset = 0, signal?: AbortSignal): Promise<ServerRunPage> {
  const session = readServerSession();
  if (!session) return { items: [], next_offset: null };
  const query = new URLSearchParams({ lab_id: id, offset: String(offset) });
  return request('/' + encodeURIComponent(session.session_id) + '/runs?' + query, { signal }, session);
}

export async function getServerRun(runId: string, signal: AbortSignal): Promise<ServerRun> {
  const session = readServerSession();
  if (!session) throw new Error('Phiên máy chủ đã hết hiệu lực.');
  const run = await request<ServerRun>(
    '/' + encodeURIComponent(session.session_id) + '/runs/' + encodeURIComponent(runId), { signal }, session,
  );
  if (readServerSession()?.session_id !== session.session_id) throw new Error('Phiên máy chủ đã thay đổi.');
  return run;
}


export type TutorResult = {
  request_id: string;
  answer: { status: string; notice: string; response_source: 'template' | 'llm' | 'cache';
    degraded_reason: string | null; model: string | null; attempts: number;
    guard_attempts?: number; input_guard?: string;
    output: { message: string; citation_ids: string[]; follow_up: string | null } };
  retrieval: import('./retrieval').RetrievalResponse;
  run: { run_id: string; lab_id: string; notice: string; preview: Record<string, PreviewValue> } | null;
};
export async function askServerTutor(input: { lab_id: string; question: string;
  mode: 'qa' | 'hint' | 'explanation' | 'feedback'; hint_level: number;
  run_id: string | null; include_drafts: boolean;
  level?: 'THCS' | 'THPT';
  history: { role: 'user' | 'assistant'; text: string }[] }, signal: AbortSignal): Promise<TutorResult> {
  const session = await getOrCreateSession();
  const result = await request<TutorResult>('/' + encodeURIComponent(session.session_id) + '/tutor', {
    method: 'POST', body: JSON.stringify(input), signal,
  }, session);
  if (!['template', 'llm', 'cache'].includes(result.answer.response_source) ||
      !result.retrieval.hits.every(hit => hit.document.lab_id === input.lab_id) ||
      (input.run_id && (result.run?.run_id !== input.run_id || result.run.lab_id !== input.lab_id))) {
    throw new Error('Ngữ cảnh Tutor trả về không khớp.');
  }
  return result;
}
