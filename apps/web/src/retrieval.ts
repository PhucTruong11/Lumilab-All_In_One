import { apiBase } from './api';

export interface RetrievalHit {
  chunk_id: string;
  score?: number | null;
  document: {
    title: string; text: string; lab_id: string; review_status: 'draft' | 'cross_checked' | 'reviewed';
    reviewer: string | null; reviewed_at: string | null;
    provenance?: { book: string; chapter: string; section: string; license: string; level: string } | null;
    references: { label: string; url: string }[]; assumptions: string[];
  };
}
export interface RetrievalResponse {
  corpus_revision: string;
  retrieval_method: 'local-lexical' | 'local-hash-vector' | 'local-semantic-vector' | 'local-hybrid-hash' | 'local-hybrid-semantic';
  embedding_id?: string | null; index_revision?: string | null;
  status: 'FOUND' | 'NO_MATCH';
  hits: RetrievalHit[];
}

export async function retrieveLearning(labId: string, query: string, includeDrafts: boolean, signal: AbortSignal, method: 'lexical' | 'vector' | 'hybrid' = 'lexical', level: 'THCS' | 'THPT' = 'THPT') {
  const response = await fetch(apiBase + '/api/v1/retrieval/query', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lab_id: labId, query, include_drafts: includeDrafts, retrieval_method: method, level }), signal,
  });
  if (!response.ok) throw new Error('Không tải được học liệu từ API local.');
  const data: RetrievalResponse = await response.json();
  if (!['local-lexical', 'local-hash-vector', 'local-semantic-vector', 'local-hybrid-hash', 'local-hybrid-semantic'].includes(data.retrieval_method) || !Array.isArray(data.hits) ||
      !data.hits.every(hit => hit.document.lab_id === labId && (!hit.document.provenance || hit.document.provenance.level === level) &&
        ['draft', 'cross_checked', 'reviewed'].includes(hit.document.review_status))) {
    throw new Error('API trả về học liệu không phù hợp.');
  }
  return data;
}
