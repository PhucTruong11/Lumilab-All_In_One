import { ChartBoundary } from './AppBoundary';
import { lazy, Suspense, useCallback, useState } from 'react';
import { pendulumAngleAtTime, type PendulumParameters } from '@lumilab/lab-engine';
import { PendulumCanvas, type PendulumVisualOptions } from './PendulumCanvas';
import { useLab } from '../labSession';

const Chart = lazy(() => import('./PendulumChart').then(module => ({ default: module.PendulumChart })));

export function PendulumLab() {
  const { engine, state } = useLab('pendulum');
  const { parameters, reading, elapsed_s: time, presentation, records } = state;
  const running = state.phase === 'running';
  const { side, material } = presentation;

  const [dampingEnabled, setDampingEnabled] = useState(false);
  const [dampingCoeff, setDampingCoeff] = useState(0.04);

  const [visualOptions, setVisualOptions] = useState<PendulumVisualOptions>({
    showVectors: true,
    showProtractor: true,
    showEnergyBar: true,
  });

  const change = (key: keyof PendulumParameters, value: number) => engine.setParameters({ [key]: value });

  const drag = useCallback(
    (length: number, angle: number, releaseSide: number) => {
      engine.setParameters({ length_m: length, angle_deg: angle });
      engine.setPresentation({ side: releaseSide < 0 ? -1 : 1 });
    },
    [engine]
  );

  function reset() {
    engine.reset();
  }

  function record() {
    engine.record();
  }

  // Telemetry instant values with optional damping
  const b = dampingEnabled ? dampingCoeff : 0;
  const beta = b / (2 * parameters.mass_kg);
  const decay = dampingEnabled ? Math.exp(-beta * time) : 1;
  const rawAngle = parameters.angle_deg === 0 ? 0 : side * pendulumAngleAtTime(parameters, time);
  const currentAngle = rawAngle * decay;
  const hMax = parameters.length_m * (1 - Math.cos((parameters.angle_deg * Math.PI) / 180));
  const baseTotalE = parameters.mass_kg * parameters.gravity_m_s2 * hMax;
  const totalE = dampingEnabled ? baseTotalE * (decay * decay) : baseTotalE;
  const hCurrent = parameters.length_m * (1 - Math.cos((currentAngle * Math.PI) / 180));
  const potE = parameters.mass_kg * parameters.gravity_m_s2 * hCurrent;
  const kinE = Math.max(0, totalE - potE);
  const currentSpeed = Math.sqrt((2 * kinE) / parameters.mass_kg);

  return (
    <>
      <div className="workbench-grid">
        <section className="stage-panel" aria-label="Bàn thí nghiệm con lắc">
          <div className="panel-title">
            <h2>Bàn thí nghiệm</h2>
            <span className="mode-chip">
              <i />{' '}
              {running
                ? 'Đang dao động'
                : parameters.angle_deg === 0
                ? 'Ở vị trí cân bằng'
                : 'Sẵn sàng'}
            </span>
          </div>

          <div className="visual-toggles" role="toolbar" aria-label="Tùy chọn hiển thị vật lý">
            <button
              type="button"
              className="visual-toggle-btn"
              aria-pressed={visualOptions.showVectors}
              onClick={() =>
                setVisualOptions(prev => ({ ...prev, showVectors: !prev.showVectors }))
              }
            >
              <span>Vectơ lực (P, T, v)</span>
            </button>
            <button
              type="button"
              className="visual-toggle-btn"
              aria-pressed={visualOptions.showProtractor}
              onClick={() =>
                setVisualOptions(prev => ({ ...prev, showProtractor: !prev.showProtractor }))
              }
            >
              <span>Thước đo góc</span>
            </button>
            <button
              type="button"
              className="visual-toggle-btn"
              aria-pressed={visualOptions.showEnergyBar}
              onClick={() =>
                setVisualOptions(prev => ({ ...prev, showEnergyBar: !prev.showEnergyBar }))
              }
            >
              <span>Thanh cơ năng</span>
            </button>
          </div>

          <div className="canvas-wrap">
            <PendulumCanvas
              parameters={parameters}
              time={time}
              side={side}
              material={material}
              onDrag={drag}
              visualOptions={{
                ...visualOptions,
                dampingEnabled,
                dampingCoeff,
              }}
            />
            <div className="stage-clock" aria-label="Thời gian mô phỏng">
              <span>t</span> <output>{time.toFixed(1)}</output> s
            </div>
          </div>

          <div className="stage-actions">
            <button
              className="primary-button"
              onClick={() => (running ? engine.pause() : engine.run())}
              disabled={parameters.angle_deg === 0}
            >
              {running ? 'Ⅱ Tạm dừng' : '▶ Chạy thí nghiệm'}
            </button>
            <button className="secondary-button" onClick={reset}>
              ↺ Đặt lại
            </button>
            <button className="record-button" onClick={record}>
              ＋ Ghi số đo
            </button>
          </div>

          <div className="readings readings-expanded" aria-label="Kết quả mô hình">
            <div>
              <span>Chu kỳ T</span>
              <strong data-testid="period-reading">
                {reading.period_s === null ? '—' : reading.period_s.toFixed(3)} <small>s</small>
              </strong>
            </div>
            <div>
              <span>Tần số f</span>
              <strong>
                {reading.frequency_hz === null ? '—' : reading.frequency_hz.toFixed(3)} <small>Hz</small>
              </strong>
            </div>
            <div>
              <span>Góc lệch θ</span>
              <strong>
                {parameters.angle_deg === 0 ? '0.0' : currentAngle.toFixed(1)} <small>°</small>
              </strong>
            </div>
            <div>
              <span>Vận tốc v</span>
              <strong>
                {parameters.angle_deg === 0 ? '0.00' : currentSpeed.toFixed(2)} <small>m/s</small>
              </strong>
            </div>
          </div>
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Thông số</h2>
              <span>g = 9,81 m/s² (Chuẩn Trái Đất)</span>
            </div>

            <label className="parameter">
              <span>
                Chiều dài dây <output>{parameters.length_m.toFixed(2)} m</output>
              </span>
              <input
                aria-label="Chiều dài dây"
                type="range"
                min="0.3"
                max="2"
                step="0.01"
                value={parameters.length_m}
                onChange={event => change('length_m', Number(event.target.value))}
              />
              <span className="range-limits">
                <span>0,30 m</span>
                <span>2,00 m</span>
              </span>
              <div className="preset-row">
                {[0.5, 1.0, 1.5, 2.0].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`preset-pill ${Math.abs(parameters.length_m - val) < 0.01 ? 'active' : ''}`}
                    onClick={() => change('length_m', val)}
                  >
                    {val.toFixed(1)} m
                  </button>
                ))}
              </div>
            </label>

            <label className="parameter">
              <span>
                Khối lượng <output>{parameters.mass_kg.toFixed(2)} kg</output>
              </span>
              <input
                aria-label="Khối lượng"
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={parameters.mass_kg}
                onChange={event => change('mass_kg', Number(event.target.value))}
              />
              <span className="range-limits">
                <span>0,10 kg</span>
                <span>1,00 kg</span>
              </span>
              <div className="preset-row">
                {[0.1, 0.2, 0.5, 1.0].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`preset-pill ${Math.abs(parameters.mass_kg - val) < 0.01 ? 'active' : ''}`}
                    onClick={() => change('mass_kg', val)}
                  >
                    {val.toFixed(1)} kg
                  </button>
                ))}
              </div>
            </label>

            <label className="parameter">
              <span>
                Góc thả biên độ <output>{parameters.angle_deg}°</output>
              </span>
              <input
                aria-label="Góc thả"
                type="range"
                min="0"
                max="90"
                step="1"
                value={parameters.angle_deg}
                onChange={event => change('angle_deg', Number(event.target.value))}
              />
              <span className="range-limits">
                <span>0°</span>
                <span>90°</span>
              </span>
              <div className="preset-row">
                {[5, 15, 30, 45, 60].map(val => (
                  <button
                    key={val}
                    type="button"
                    className={`preset-pill ${parameters.angle_deg === val ? 'active' : ''}`}
                    onClick={() => change('angle_deg', val)}
                  >
                    {val === 5 ? '5° (Nhỏ)' : `${val}°`}
                  </button>
                ))}
              </div>
            </label>

            <fieldset className="materials">
              <legend>Quả nặng</legend>
              {([['steel', 'Thép'], ['copper', 'Đồng'], ['wood', 'Gỗ']] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  aria-label={label}
                  aria-pressed={material === key}
                  onClick={() => engine.setPresentation({ material: key })}
                ><i className={`material-dot ${key}`}/>{label}</button>
              ))}
            </fieldset>

            <div className="damping-control-card">
              <div className="damping-header">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={dampingEnabled}
                    onChange={e => setDampingEnabled(e.target.checked)}
                  />
                  <span className="toggle-slider" />
                  <span>Lực cản môi trường (Tắt dần)</span>
                </label>
              </div>
              {dampingEnabled && (
                <div className="damping-slider-wrap">
                  <div className="damping-labels">
                    <span>Hệ số cản b: <strong>{dampingCoeff.toFixed(3)} N·s/m</strong></span>
                    <span className="sub-hint">
                      {dampingCoeff <= 0.03 ? 'Không khí loãng' : dampingCoeff <= 0.08 ? 'Không khí chuẩn' : 'Chất lưu nhớt'}
                    </span>
                  </div>
                  <input
                    aria-label="Hệ số lực cản không khí"
                    type="range"
                    min="0.01"
                    max="0.20"
                    step="0.005"
                    value={dampingCoeff}
                    onChange={e => setDampingCoeff(Number(e.target.value))}
                  />
                  <div className="range-limits">
                    <span>0,01 (Cản nhẹ)</span>
                    <span>0,10 (Vừa)</span>
                    <span>0,20 (Mạnh)</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Đồ thị phân tích</h2>
              <span>Đường truyền sóng thời gian thực</span>
            </div>
            <ChartBoundary>
              <Suspense fallback={<div className="chart-area chart-loading">Đang mở đồ thị…</div>}>
                <Chart
                  parameters={parameters}
                  side={side}
                  currentTime={time}
                  dampingEnabled={dampingEnabled}
                  dampingCoeff={dampingCoeff}
                />
              </Suspense>
            </ChartBoundary>
          </section>
        </aside>
      </div>

      <div className="below-lab">
        <details className="model-details">
          <summary>Kiến thức & giới hạn mô hình</summary>
          <div className="model-content">
            <svg viewBox="0 0 120 90" aria-label="Sơ đồ dây và góc lệch" role="img">
              <path d="M25 12h65M58 12v67" stroke="#a0b9ab" strokeDasharray="4 4" fill="none" />
              <path d="M58 12l30 56" stroke="#3c6c56" strokeWidth="2" />
              <circle cx="88" cy="68" r="10" fill="#77a78d" />
              <path d="M58 38q8 0 13-5" stroke="#3c6c56" fill="none" />
              <text x="72" y="32" fill="#3c6c56" fontSize="12">
                θ
              </text>
            </svg>
            <div>
              <p>
                Ở góc nhỏ (θ &lt; 10°): <strong>T ≈ 2π√(L/g)</strong>. Khi góc lớn, chu kỳ phi tuyến
                được tính chính xác theo tích phân elip (AGM). Khối lượng quả nặng không ảnh hưởng đến
                chu kỳ dao động (đặc tính đẳng thời).
              </p>
              <p>
                <strong>Bảo toàn cơ năng:</strong> Khi con lắc chuyển động, thế năng Wt chuyển hóa liên tục
                thành động năng Wđ và ngược lại; tổng cơ năng E = Wt + Wđ không đổi trong suốt quá trình dao
                động nếu bỏ qua ma sát.
              </p>
            </div>
          </div>
        </details>

        <section className="notebook">
          <div className="panel-title">
            <h2>
              Sổ tay số đo <span className="count">{records.length}</span>
            </h2>
            {records.length > 0 && (
              <button className="text-button" onClick={() => engine.clearRecords()}>
                Xóa tất cả
              </button>
            )}
          </div>
          {records.length === 0 ? (
            <p className="empty-notebook">Ghi một lượt thử để so sánh số đo giữa các lần thay đổi.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>L (m)</th>
                    <th>m (kg)</th>
                    <th>θ (°)</th>
                    <th>T (s)</th>
                    <th>E (J)</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row, index) => (
                    <tr key={`${row.id}-${index}`}>
                      <td>{row.parameters.length_m.toFixed(2)}</td>
                      <td>{row.parameters.mass_kg.toFixed(2)}</td>
                      <td>{row.parameters.angle_deg}</td>
                      <td>{row.reading.period_s === null ? '—' : row.reading.period_s.toFixed(3)}</td>
                      <td>{row.reading.energy_j.toFixed(3)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
