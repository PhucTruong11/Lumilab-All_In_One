import { ChartBoundary } from './AppBoundary';
import { lazy, Suspense, useCallback } from 'react';
import { type PendulumParameters } from '@lumilab/lab-engine';
import { PendulumCanvas } from './PendulumCanvas';
import { useLab } from '../labSession';

const Chart = lazy(() => import('./PendulumChart').then(module => ({ default: module.PendulumChart })));

export function PendulumLab() {
  const { engine, state } = useLab('pendulum');
  const { parameters, reading, elapsed_s: time, presentation, records } = state;
  const running = state.phase === 'running';
  const { side, material } = presentation;
  const change = (key: keyof PendulumParameters, value: number) => engine.setParameters({ [key]: value });
  const drag = useCallback((length: number, angle: number, releaseSide: number) => {
    engine.setParameters({ length_m: length, angle_deg: angle });
    engine.setPresentation({ side: releaseSide < 0 ? -1 : 1 });
  }, [engine]);
  function reset() { engine.reset(); }
  function record() { engine.record(); }
  return <>
    <div className="workbench-grid">
      <section className="stage-panel" aria-label="Bàn thí nghiệm con lắc">
        <div className="panel-title"><h2>Bàn thí nghiệm</h2><span className="mode-chip"><i/> {running ? 'Đang dao động' : parameters.angle_deg === 0 ? 'Ở vị trí cân bằng' : 'Sẵn sàng'}</span></div>
        <div className="canvas-wrap"><PendulumCanvas parameters={parameters} time={time} side={side} material={material} onDrag={drag}/><div className="stage-clock" aria-label="Thời gian mô phỏng"><span>t</span> <output>{time.toFixed(1)}</output> s</div></div>
        <div className="stage-actions"><button className="primary-button" onClick={() => running ? engine.pause() : engine.run()} disabled={parameters.angle_deg === 0}>{running ? 'Ⅱ Tạm dừng' : '▶ Chạy thí nghiệm'}</button><button className="secondary-button" onClick={reset}>↺ Đặt lại</button><button className="record-button" onClick={record}>＋ Ghi số đo</button></div>
        <div className="readings" aria-label="Kết quả mô hình"><div><span>Chu kỳ T</span><strong data-testid="period-reading">{reading.period_s === null ? '—' : reading.period_s.toFixed(3)} <small>s</small></strong></div><div><span>Tần số f</span><strong>{reading.frequency_hz === null ? '—' : reading.frequency_hz.toFixed(3)} <small>Hz</small></strong></div><div><span>Cơ năng E</span><strong>{reading.energy_j.toFixed(3)} <small>J</small></strong></div></div>
      </section>
      <aside className="experiment-sidebar">
        <section className="parameter-panel"><div className="panel-title"><h2>Thông số</h2><span>g = 9,81 m/s²</span></div>
          <label className="parameter"><span>Chiều dài dây <output>{parameters.length_m.toFixed(2)} m</output></span><input aria-label="Chiều dài dây" type="range" min="0.3" max="2" step="0.01" value={parameters.length_m} onChange={event => change('length_m', Number(event.target.value))}/><span className="range-limits"><span>0,30 m</span><span>2,00 m</span></span></label>
          <label className="parameter"><span>Khối lượng <output>{parameters.mass_kg.toFixed(2)} kg</output></span><input aria-label="Khối lượng" type="range" min="0.1" max="1" step="0.05" value={parameters.mass_kg} onChange={event => change('mass_kg', Number(event.target.value))}/><span className="range-limits"><span>0,10 kg</span><span>1,00 kg</span></span></label>
          <label className="parameter"><span>Góc thả <output>{parameters.angle_deg}°</output></span><input aria-label="Góc thả" type="range" min="0" max="90" step="1" value={parameters.angle_deg} onChange={event => change('angle_deg', Number(event.target.value))}/><span className="range-limits"><span>0°</span><span>90°</span></span></label>
          <fieldset className="materials"><legend>Quả nặng</legend>{([['steel', 'Thép'], ['copper', 'Đồng'], ['wood', 'Gỗ']] as const).map(([key, label]) => <button key={key} type="button" aria-pressed={material === key} onClick={() => engine.setPresentation({ material: key })}><i className={`material-dot ${key}`}/>{label}</button>)}</fieldset>
        </section>
        <section className="chart-panel"><div className="panel-title"><h2>Góc lệch theo thời gian</h2><span className="chart-legend"><i/> θ(t)</span></div><ChartBoundary><Suspense fallback={<div className="chart-area chart-loading">Đang mở đồ thị…</div>}><Chart parameters={parameters} side={side}/></Suspense></ChartBoundary></section>
      </aside>
    </div>
    <div className="below-lab"><details className="model-details"><summary>Kiến thức & giới hạn mô hình</summary><div className="model-content"><svg viewBox="0 0 120 90" aria-label="Sơ đồ dây và góc lệch" role="img"><path d="M25 12h65M58 12v67" stroke="#a0b9ab" strokeDasharray="4 4" fill="none"/><path d="M58 12l30 56" stroke="#3c6c56" strokeWidth="2"/><circle cx="88" cy="68" r="10" fill="#77a78d"/><path d="M58 38q8 0 13-5" stroke="#3c6c56" fill="none"/><text x="72" y="32" fill="#3c6c56" fontSize="12">θ</text></svg><div><p>Ở góc nhỏ: <strong>T ≈ 2π√(L/g)</strong>. Góc lớn dùng chu kỳ phi tuyến theo AGM; khối lượng không làm đổi chu kỳ trong mô hình này.</p><p>Vật chất điểm, dây không dãn, bỏ qua ma sát. Vật liệu chỉ đổi minh họa. Số liệu tính trên trình duyệt; chưa kiểm chứng hoặc lưu ở server.</p></div></div></details>
      <section className="notebook"><div className="panel-title"><h2>Sổ tay <span className="count">{records.length}</span></h2>{records.length > 0 && <button className="text-button" onClick={() => engine.clearRecords()}>Xóa số đo</button>}</div>{records.length === 0 ? <p className="empty-notebook">Ghi một lượt thử để so sánh.</p> : <div className="table-scroll"><table><thead><tr><th>L (m)</th><th>m (kg)</th><th>θ (°)</th><th>T (s)</th></tr></thead><tbody>{records.map((row, index) => <tr key={`${row.id}-${index}`}><td>{row.parameters.length_m.toFixed(2)}</td><td>{row.parameters.mass_kg.toFixed(2)}</td><td>{row.parameters.angle_deg}</td><td>{row.reading.period_s === null ? '—' : row.reading.period_s.toFixed(3)}</td></tr>)}</tbody></table></div>}</section>
    </div>
  </>;
}
