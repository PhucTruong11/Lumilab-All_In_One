import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createLabEngine, type BrowserLabEngine, type LabId } from '@lumilab/lab-engine';

export type Engines = { [K in LabId]: BrowserLabEngine<K> };
export const sessionKey = (id: LabId) => `lumilab-session-v1-${id}`;
const SessionContext = createContext<{
  engines: Engines;
  warnings: Partial<Record<LabId, string>>;
  speeds: Partial<Record<LabId, number>>;
  setSpeed: (id: LabId, speed: number) => void;
} | null>(null);

export function LabSessionProvider({ children }: { children: ReactNode }) {
  const [speeds, setSpeeds] = useState<Partial<Record<LabId, number>>>({});
  const setSpeed = useCallback((id: LabId, speed: number) => {
    setSpeeds(prev => ({ ...prev, [id]: speed }));
  }, []);

  const [initial] = useState(() => {
    const instances = {
      pendulum: createLabEngine('pendulum'),
      chemistry: createLabEngine('chemistry'),
      circuit: createLabEngine('circuit'),
      mechanics: createLabEngine('mechanics'),
      spring: createLabEngine('spring'),
      electrochemistry: createLabEngine('electrochemistry'),
      atomic: createLabEngine('atomic'),
      'parallel-circuit': createLabEngine('parallel-circuit'),
      capacitor: createLabEngine('capacitor'),
      precipitation: createLabEngine('precipitation'),
      'gas-reaction': createLabEngine('gas-reaction'),
      'spring-damped': createLabEngine('spring-damped'),
      'inclined-plane': createLabEngine('inclined-plane'),
      pulley: createLabEngine('pulley'),
      'alkali-water': createLabEngine('alkali-water'),
      'copper-nitric': createLabEngine('copper-nitric'),
      'chlorine-bleach': createLabEngine('chlorine-bleach'),
    };
    const warnings: Partial<Record<LabId, string>> = {};
    for (const id of Object.keys(instances) as LabId[]) {
      try {
        const saved = localStorage.getItem(sessionKey(id));
        if (saved) instances[id].restore(saved);
      } catch {
        warnings[id] =
          'Bản lưu trên máy không đọc được hoặc không tương thích. Bài thực hành đã mở với dữ liệu mặc định.';
      }
    }
    return { engines: instances, warnings };
  });

  const value = useMemo(
    () => ({
      engines: initial.engines,
      warnings: initial.warnings,
      speeds,
      setSpeed,
    }),
    [initial, speeds, setSpeed]
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('LabSessionProvider missing');
  return context;
}

export function useEngines() {
  return useSessionContext().engines;
}

export function useLab<K extends LabId>(id: K) {
  const engine = useEngines()[id] as BrowserLabEngine<K>;
  const state = useSyncExternalStore(engine.subscribe, engine.snapshot);
  return { engine, state };
}

export function useLabSpeed(id: LabId): [number, (speed: number) => void] {
  const context = useSessionContext();
  const speed = context.speeds[id] ?? 1;
  const setSpeed = (s: number) => context.setSpeed(id, s);
  return [speed, setSpeed];
}
