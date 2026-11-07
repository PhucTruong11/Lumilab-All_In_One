import { useState } from 'react';
import { labDefinitions, type LabId } from '@lumilab/lab-engine';
import { useLab } from '../labSession';
import { experimentParameters, labExperiments, manipulationHints, timedLabIds } from '../data/labExperiments';

export function ExperimentTools({ id, speed, onSpeed, focused, onFocus }: {
  id: LabId; speed: number; onSpeed: (value: number) => void; focused: boolean; onFocus: () => void;
}) {
  const { engine, state } = useLab(id);
  const [notice, setNotice] = useState('');
  const [expanded, setExpanded] = useState(false);
  const experiments = labExperiments[id];
  const timed = timedLabIds.includes(id);
  const duration = labDefinitions[id].duration_s;
  const activeExperiment = experiments?.find(experiment => {
    const parameters = experimentParameters(id, experiment);
    return Object.entries(parameters).every(([key, value]) => JSON.stringify(state.parameters[key as keyof typeof state.parameters]) === JSON.stringify(value));
  });
  const hasActed = timed ? state.elapsed_s > 0 || state.phase === 'running' : ('observed' in state.parameters ? Boolean(state.parameters.observed) : state.records.length > 0);
  const hasRecorded = state.records.length > 0;

  return <section className="experiment-tools" aria-label="Công cụ thực hành">
    <div className="experiment-toolbar">
      <div className="experiment-status">
        <span className={`phase-dot ${state.phase}`}/>
        <strong>{state.phase === 'running' ? 'Đang chạy' : state.phase === 'paused' ? 'Đã tạm dừng' : 'Sẵn sàng thử'}</strong>
        <span className="preview-label">Bản nháp</span>
        <div className="inquiry-steps" aria-label="Tiến độ thực hành">
          <span className="is-done">1. Thiết lập</span>
          <span className={hasActed ? 'is-done' : ''}>2. Thao tác</span>
          <span className={hasRecorded ? 'is-done' : ''}>3. Ghi sổ ({state.records.length})</span>
        </div>
      </div>
      <div className="experiment-controls">
        {timed && <>
          <output className="experiment-time" aria-label="Đồng hồ thực hành">{state.elapsed_s.toFixed(2)} s{duration ? ` / ${duration} s` : ''}</output>
          <label className="playback-speed">Tốc độ <select aria-label="Tốc độ mô phỏng" value={speed} onChange={e => onSpeed(Number(e.target.value))}>
            {[.25, .5, 1, 2].map(value => <option key={value} value={value}>{value}×</option>)}
          </select></label>
          <button type="button" disabled={state.phase === 'running' || (duration !== undefined && state.elapsed_s >= duration)}
            onClick={() => { engine.run(); engine.step(.1); engine.pause(); }}>Tiến 0,1 s</button>
          <button type="button" onClick={() => engine.setParameters(state.parameters)}>Về t = 0</button>
        </>}
        <button type="button" aria-pressed={focused} onClick={onFocus}>{focused ? 'Hiện đầy đủ' : 'Tập trung'}</button>
      </div>
    </div>
    {experiments && <details className="experiment-presets" open={expanded} onToggle={e => setExpanded(e.currentTarget.open)}>
      <summary>Cấu hình thử nhanh <span>Chọn kịch bản mẫu để so sánh · giữ nguyên sổ đo</span></summary>
      <div className="experiment-preset-list">{experiments.map((experiment, index) => {
        const parameters = experimentParameters(id, experiment);
        const selected = activeExperiment === experiment;
        return <button type="button" key={experiment.title} aria-pressed={selected} onClick={() => {
          engine.setParameters(parameters);
          setNotice(`Đã áp dụng “${experiment.title}”. ${timed ? 'Thời gian về 0.' : 'Sẵn sàng thao tác.'} Sổ đo được giữ lại.`);
        }}>
          <div className="preset-card-head">
            <em className="preset-step-num">TN {index + 1}</em>
            <strong>{experiment.title}</strong>
          </div>
          <span>{experiment.detail}</span>
        </button>;
      })}</div>
      {activeExperiment?.question && (
        <div className="scenario-prompt">
          <strong>Câu hỏi khám phá:</strong> {activeExperiment.question}
        </div>
      )}
    </details>}
    <p className="interaction-hint">{manipulationHints[id] ?? (timed ? 'Điều chỉnh thông số, chạy chậm hoặc tiến từng bước để theo dõi thay đổi.' : 'Tương tác trực tiếp với dụng cụ trên bàn hoặc chọn điều kiện, mở quan sát rồi ghi kết quả.')}</p>
    {notice && <p className="experiment-notice" role="status">{notice}</p>}
  </section>;
}
