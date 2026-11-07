import { isLabId, type LabId } from '@lumilab/lab-engine';

export type View = 'lab' | 'library' | 'workspace' | 'lumi';

export const tabs: { id: View; label: string }[] = [
  { id: 'lab', label: 'Phòng thực hành' },
  { id: 'library', label: 'Thư viện bài học' },
  { id: 'workspace', label: 'Không gian học tập' },
  { id: 'lumi', label: '✦ Lumi' },
];

export interface ParsedRoute {
  view: View;
  labOpen: boolean;
  labId?: LabId;
}

export function parseRoute(hash: string): ParsedRoute | null {
  const raw = hash.replace(/^#\/?/, '').trim();
  if (!raw) {
    return { view: 'lab', labOpen: false };
  }
  const [segment, id] = raw.split('/');
  if (tabs.some(tab => tab.id === segment)) {
    const view = segment as View;
    if (view === 'lab') {
      const open = isLabId(id || '');
      return {
        view: 'lab',
        labOpen: open,
        labId: open ? (id as LabId) : undefined,
      };
    }
    return { view, labOpen: false };
  }
  return null;
}
