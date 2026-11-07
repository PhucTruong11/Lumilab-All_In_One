import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createLabEngine, type BrowserLabEngine, type LabId } from '@lumilab/lab-engine';

export type Engines = { [K in LabId]: BrowserLabEngine<K> };
export const sessionKey = (id: LabId) => `lumilab-session-v1-${id}`;
const SessionContext = createContext<{ engines: Engines; warnings: Partial<Record<LabId, string>> } | null>(null);
export function LabSessionProvider({ children }: { children: ReactNode }) {
  const [value] = useState(() => {
    const instances = { pendulum: createLabEngine('pendulum'), chemistry: createLabEngine('chemistry'), circuit: createLabEngine('circuit'), mechanics: createLabEngine('mechanics'), spring: createLabEngine('spring'), electrochemistry: createLabEngine('electrochemistry'), atomic: createLabEngine('atomic'), 'parallel-circuit': createLabEngine('parallel-circuit'), capacitor: createLabEngine('capacitor'), precipitation: createLabEngine('precipitation'), 'gas-reaction': createLabEngine('gas-reaction') };
    const warnings: Partial<Record<LabId, string>> = {};
    for (const id of Object.keys(instances) as LabId[]) {
      try { const saved = localStorage.getItem(sessionKey(id)); if (saved) instances[id].restore(saved); }
      catch { warnings[id] = 'Bản lưu không đọc được hoặc đã khác phiên bản. Phiên mới đã mở; bạn có thể nhập tệp khác.'; }
    }
    return { engines: instances, warnings };
  });
  return <SessionContext value={value}>{children}</SessionContext>;
}
export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('LabSessionProvider missing');
  return context;
}
export function useEngines() { return useSessionContext().engines; }
export function useLab<K extends LabId>(id: K) {
  const engine = useEngines()[id] as BrowserLabEngine<K>;
  const state = useSyncExternalStore(engine.subscribe, engine.snapshot);
  return { engine, state };
}
