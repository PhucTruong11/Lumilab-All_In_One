import { useEffect, useRef } from 'react';
import { labDefinitions, type LabId } from '@lumilab/lab-engine';
import { sessionKey, useLab, useLabSpeed, useSessionContext } from '../labSession';
import { archivedPracticeIds, practiceInfo } from '../data/practice';

export function useLabClock(id: LabId, externalSpeed?: number) {
  const { engine, state } = useLab(id);
  const [sessionSpeed] = useLabSpeed(id);
  const speed = externalSpeed ?? sessionSpeed;
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (state.phase !== 'running') return;
    let frame = 0,
      last = 0;
    function tick(now: number) {
      if (!last) last = now;
      if (now - last >= 1000 / 30) {
        const delta = Math.min((now - last) / 1000, 0.1);
        engine.step(delta * speedRef.current);
        last = now;
      }
      frame = requestAnimationFrame(tick);
    }
    const hidden = () => {
      if (document.hidden) engine.pause();
    };
    document.addEventListener('visibilitychange', hidden);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', hidden);
      engine.pause();
    };
  }, [engine, state.phase]);
}

export function LabSessionPersistence({ id }: { id: LabId }) {
  const { engine, state } = useLab(id);
  const { warnings } = useSessionContext();

  // Preserve measurements and parameters when the page reloads.
  useEffect(() => {
    try {
      localStorage.setItem(sessionKey(id), engine.serialize());
    } catch {
      // ignore quota errors
    }
  }, [id, engine, state.records, state.notes, state.parameters]);

  return warnings[id] ? <p className="lab-notice" role="status">{warnings[id]}</p> : null;
}

export function LearningJourney({
  id,
  onLesson,
  onLumi,
}: {
  id: LabId;
  onLesson: () => void;
  onLumi: () => void;
}) {
  const { engine, state } = useLab(id);
  return (
    <details className="learning-journey">
      <summary>
        <span>Dự đoán & giải thích</span>
        <span className="journey-progress">
          {state.notes.prediction.trim() ? '✓ Dự đoán' : 'Dự đoán'} <span>→</span>{' '}
          {state.records.length ? '✓ Số đo' : 'Số đo'} <span>→</span>{' '}
          {state.notes.reflection.trim() ? '✓ Kết luận' : 'Kết luận'}
        </span>
      </summary>
      <div className="journey-body">
        <label className="field">
          Trước khi thử, bạn dự đoán gì?
          <textarea
            maxLength={1000}
            value={state.notes.prediction}
            onChange={event => engine.setNotes({ prediction: event.target.value })}
            placeholder={
              id === 'pendulum'
                ? 'Nếu tăng khối lượng, chu kỳ sẽ…'
                : id === 'chemistry'
                ? 'Gần 25 mL bazơ, màu và pH sẽ…'
                : id === 'circuit'
                ? 'Khi thêm điện trở nối tiếp, dòng điện sẽ…'
                : id === 'mechanics'
                ? 'Nếu giữ lực và tăng khối lượng, gia tốc sẽ…'
                : id === 'spring'
                ? 'Nếu tăng độ cứng lò xo, chu kỳ sẽ…'
                : id === 'electrochemistry'
                ? 'Nếu đổi vị trí hai điện cực, điện áp sẽ…'
                : id === 'atomic'
                ? 'Nếu thêm một electron, điện tích sẽ…'
                : id === 'parallel-circuit'
                ? 'Nếu chuyển sang song song, dòng nguồn sẽ…'
                : id === 'capacitor'
                ? 'Nếu tăng điện dung, thời gian nạp sẽ…'
                : id === 'precipitation'
                ? 'Nếu chỉ thêm NaCl khi AgNO₃ hết, khối lượng kết tủa sẽ…'
                : id === 'gas-reaction'
                ? 'Nếu chỉ tăng NaHCO₃ khi axit hết, thể tích khí sẽ…'
                : practiceInfo[id].lead
            }
          />
        </label>
        <label className="field">
          Số liệu giúp bạn kết luận điều gì?
          <textarea
            maxLength={1000}
            value={state.notes.reflection}
            onChange={event => engine.setNotes({ reflection: event.target.value })}
            placeholder="Mình thay đổi…, quan sát…, nên kết luận…"
          />
        </label>
        <div className="journey-links">
          <button className="secondary-button" onClick={onLesson}>
            Kiến thức & bài tập
          </button>
          <button className="primary-button" onClick={onLumi}>
            Hỏi Lumi về lượt thử
          </button>
          {archivedPracticeIds.includes(id) && <span>Mô phỏng lưu trữ, tương thích phiên cũ.</span>}
          <span>{labDefinitions[id].title} · Ghi chú tự lưu trên máy này</span>
        </div>
      </div>
    </details>
  );
}
