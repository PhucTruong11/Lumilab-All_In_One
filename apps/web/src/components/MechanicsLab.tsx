import { lazy, Suspense, useState } from 'react';
import { mechanicsReading } from '@lumilab/lab-engine';
import { useLab } from '../labSession';
import { useSvgDrag } from './useSvgDrag';
import { ChartBoundary } from './AppBoundary';
import { ExpandedFooter, ExpandedReadings, LabSlider } from './ExpandedLabParts';

const Chart = lazy(() => import('./ExpandedCharts').then(m => ({ default: m.MotionChart })));

export function MechanicsLab() {
  const { engine, state } = useLab('mechanics');
  const { parameters: p, reading: r } = state;
  const [showStrobe, setShowStrobe] = useState(true);

  const scale = Math.max(10, Math.abs(mechanicsReading(p, 10).position_m));
  const cartX = 380 + (r.position_m / scale) * 200;

  const { drag, start, handlers } = useSvgDrag((key, x, y, moved) => {
    if (key === 'force' && moved) {
      engine.setParameters({ force_N: Math.max(-10, Math.min(10, Math.round(((x - cartX) / 15) * 10) / 10)) });
    } else if (key === 'cart' && moved) {
      engine.setParameters({ initialVelocity_m_s: Math.max(-3, Math.min(3, Math.round(((x - cartX) / 60) * 10) / 10)) });
    } else if (key === 'mass' && (moved ? Math.abs(x - cartX) < 80 && y > 160 && y < 320 : true)) {
      engine.setParameters({ mass_kg: Math.min(5, p.mass_kg + 0.5) });
    }
  });

  const arrowEnd = drag?.key === 'force' && drag.moved ? drag.x : cartX + p.force_N * 15;
  const velArrowEnd = cartX + Math.max(-95, Math.min(95, r.velocity_m_s * 18));
  const wheelDeg = (r.position_m * 140) % 360;
  const weightBlocks = Math.min(6, Math.floor((p.mass_kg - 0.5) / 0.5));
  const elapsedWholeSeconds = Math.floor(state.elapsed_s);

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel" aria-label="Bàn định luật II Newton">
          <div className="panel-title">
            <h2>Xe trên đường ray</h2>
            <span className="mode-chip">
              <i /> {state.phase === 'running' ? 'Đang chuyển động' : 'Sẵn sàng'} · 0–10 s
            </span>
          </div>

          <div className="visual-toggles" role="toolbar" aria-label="Tùy chọn hiển thị xe động lực học">
            <button
              type="button"
              className="visual-toggle-btn"
              aria-pressed={showStrobe}
              onClick={() => setShowStrobe(v => !v)}
            >
              <span>Dấu vết vị trí mỗi giây & Động năng</span>
            </button>
          </div>

          <svg
            className="interactive-stage"
            viewBox="0 0 760 440"
            {...handlers}
            aria-label="Kéo mũi tên để đổi lực hoặc kéo xe để đặt vận tốc đầu"
          >
            <defs>
              <linearGradient id="newton-bg" x2="1" y2="1">
                <stop stopColor="#edf6f1" />
                <stop offset="1" stopColor="#e3efe8" />
              </linearGradient>
              <pattern id="newton-grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.9" fill="#9dc0af" opacity="0.45" />
              </pattern>
            </defs>

            <rect x="10" y="5" width="740" height="422" rx="22" fill="url(#newton-bg)" />
            <rect x="10" y="5" width="740" height="422" rx="22" fill="url(#newton-grid)" />

            {/* Telemetry HUD */}
            {showStrobe && (
              <g transform="translate(26 22)">
                <rect width="194" height="58" rx="11" fill="#ffffffeb" stroke="#c8ddd1" />
                <text x="12" y="20" fill="#1f5d44" fontSize="11" fontWeight="700">
                  Động năng Wđ = {r.kineticEnergy_J.toFixed(2)} J
                </text>
                <text x="12" y="41" fill="#496a59" fontSize="10.5">
                  a = F/m = {r.acceleration_m_s2.toFixed(2)} m/s² · v₀ = {p.initialVelocity_m_s.toFixed(1)} m/s
                </text>
              </g>
            )}

            {/* Optical rail & distance ruler */}
            <rect x="50" y="292" width="660" height="9" rx="4.5" fill="#89ad9b" />
            <line x1="380" y1="210" x2="380" y2="292" stroke="#85ab97" strokeDasharray="4 4" />
            {[-1, -0.5, 0, 0.5, 1].map(f => (
              <g key={f}>
                <path d={`M${380 + f * 200} 301v10`} stroke="#587c6a" strokeWidth={f === 0 ? 2.2 : 1.4} />
                <text x={380 + f * 200} y="328" textAnchor="middle" fill="#3d6350" fontSize="11" fontWeight={f === 0 ? '700' : '500'}>
                  {(f * scale).toFixed(1)} m
                </text>
              </g>
            ))}

            {/* Strobe dots showing x(t) spacing per second */}
            {showStrobe &&
              Array.from({ length: elapsedWholeSeconds + 1 }, (_, sec) => {
                const pos = mechanicsReading(p, sec).position_m;
                const sx = 380 + (pos / scale) * 200;
                if (sx < 55 || sx > 705) return null;
                return (
                  <g key={sec} opacity="0.72" pointerEvents="none">
                    <circle cx={sx} cy="296" r="4.5" fill="#14798f" stroke="#fff" strokeWidth="1.2" />
                    <text x={sx} y="344" textAnchor="middle" fontSize="9.5" fill="#14798f" fontWeight="600">
                      {sec}s
                    </text>
                  </g>
                );
              })}

            {/* Velocity vector v */}
            {Math.abs(r.velocity_m_s) >= 0.08 && (
              <g pointerEvents="none">
                <line x1={cartX} y1={206} x2={velArrowEnd} y2={206} stroke="#14798f" strokeWidth="3.2" strokeLinecap="round" />
                <path
                  d={`M${velArrowEnd - Math.sign(r.velocity_m_s) * 7} 201l${Math.sign(r.velocity_m_s) * 8} 5l${-Math.sign(r.velocity_m_s) * 8} 5`}
                  fill="none"
                  stroke="#14798f"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <text x={velArrowEnd} y="196" textAnchor="middle" fill="#0f6275" fontSize="11" fontWeight="700">
                  v = {r.velocity_m_s.toFixed(1)} m/s
                </text>
              </g>
            )}

            {/* Dynamics Cart */}
            <g
              data-testid="newton-cart"
              role="button"
              tabIndex={0}
              aria-label="Xe: kéo để đặt vận tốc đầu"
              className="svg-draggable"
              transform={`translate(${cartX} 248)`}
              onPointerDown={e => {
                engine.pause();
                start(e, 'cart');
              }}
              onKeyDown={e => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  e.preventDefault();
                  engine.setParameters({
                    initialVelocity_m_s: Math.max(-3, Math.min(3, Number((p.initialVelocity_m_s + (e.key === 'ArrowRight' ? 0.1 : -0.1)).toFixed(1)))),
                  });
                }
              }}
            >
              {/* Stacked weights on cart */}
              {Array.from({ length: weightBlocks }).map((_, idx) => (
                <rect
                  key={idx}
                  x={-28 + (idx % 2) * 29}
                  y={-41 - Math.floor(idx / 2) * 13}
                  width="27"
                  height="12"
                  rx="3"
                  fill="#d49a45"
                  stroke="#9c6c22"
                  strokeWidth="1.2"
                />
              ))}
              <rect x="-48" y="-26" width="96" height="48" rx="11" fill="#296e59" stroke="#18493a" strokeWidth="2" />
              <rect x="-36" y="-18" width="72" height="7" rx="3.5" fill="#529a82" opacity="0.5" />
              <text y="6" textAnchor="middle" fontSize="13" fontWeight="700" fill="#ffffff">
                {p.mass_kg.toFixed(1)} kg
              </text>
              {[-30, 30].map(wx => (
                <g key={wx} transform={`translate(${wx} 32) rotate(${wheelDeg})`}>
                  <circle r="13" fill="#3a5a4c" stroke="#1e352b" strokeWidth="2" />
                  <line x1="-9" y1="0" x2="9" y2="0" stroke="#b6d3c4" strokeWidth="2" />
                  <line x1="0" y1="-9" x2="0" y2="9" stroke="#b6d3c4" strokeWidth="2" />
                  <circle r="3.5" fill="#ffffff" />
                </g>
              ))}
            </g>

            {/* Draggable Force Vector Handle */}
            <g
              data-testid="newton-force"
              role="button"
              tabIndex={0}
              aria-label="Mũi tên lực: kéo để đổi lực"
              className="svg-draggable"
              onPointerDown={e => {
                engine.pause();
                start(e, 'force');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') engine.setParameters({ force_N: Math.min(10, p.force_N + 1) });
              }}
            >
              <path d={`M${cartX} 170H${arrowEnd}`} stroke="#c97a16" strokeWidth="6.5" strokeLinecap="round" />
              <circle cx={arrowEnd} cy="170" r="15" fill="#fff8eb" stroke="#14798f" strokeWidth="2.8" className="tactile-grip" />
              {Math.abs(arrowEnd - cartX) > 3 ? (
                <path
                  d={`M${arrowEnd - Math.sign(arrowEnd - cartX) * 5} 165l${Math.sign(arrowEnd - cartX) * 8} 5l${-Math.sign(arrowEnd - cartX) * 8} 5`}
                  fill="none"
                  stroke="#c97a16"
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                />
              ) : (
                <circle cx={arrowEnd} cy="170" r="4" fill="#c97a16" />
              )}
              <text x={(cartX + arrowEnd) / 2} y="142" textAnchor="middle" fill="#9a5808" fontSize="13.5" fontWeight="700">
                F = {p.force_N.toFixed(1)} N
              </text>
              <rect x={Math.min(cartX, arrowEnd) - 22} y="145" width={Math.abs(arrowEnd - cartX) + 44} height="50" fill="transparent" />
            </g>

            {/* Add 0.5 kg weight block */}
            <g
              data-testid="newton-mass"
              role="button"
              tabIndex={0}
              aria-label="Thêm quả cân 0,5 kg"
              className="svg-draggable"
              onPointerDown={e => {
                engine.pause();
                start(e, 'mass');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  engine.setParameters({ mass_kg: Math.min(5, p.mass_kg + 0.5) });
                }
              }}
            >
              <rect x="58" y="354" width="122" height="46" rx="10" fill="#fffaf0" stroke="#d49a45" strokeWidth="2" />
              <circle cx="80" cy="377" r="10" fill="#d49a45" />
              <text x="80" y="381" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
                +
              </text>
              <text x="132" y="374" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#7c5011">
                Quả cân 0,5 kg
              </text>
              <text x="132" y="389" textAnchor="middle" fontSize="10" fill="#9c6c22">
                Kéo đặt lên xe
              </text>
            </g>

            <text x="430" y="385" textAnchor="middle" fontSize="11.5" fontWeight="600" fill="#3f6552">
              Thước tự điều chỉnh (±{scale.toFixed(1)} m) · t = {state.elapsed_s.toFixed(2)} s
            </text>

            {drag?.key === 'mass' && drag.moved && (
              <rect x={drag.x - 26} y={drag.y - 18} width="52" height="36" rx="7" fill="#d49a45" opacity=".88" pointerEvents="none" />
            )}
          </svg>

          <div className="stage-actions">
            <button className="primary-button" onClick={() => (state.phase === 'running' ? engine.pause() : engine.run())}>
              {state.phase === 'running' ? 'Ⅱ Tạm dừng' : state.elapsed_s >= 10 ? '▶ Chạy lại' : '▶ Chạy thí nghiệm'}
            </button>
            <button className="secondary-button" onClick={() => engine.reset()}>
              ↺ Đặt lại
            </button>
            <button className="record-button" onClick={() => engine.record()}>
              ＋ Ghi số đo
            </button>
          </div>

          <ExpandedReadings
            items={[
              { label: 'Gia tốc a', value: r.acceleration_m_s2.toFixed(2), unit: 'm/s²', testId: 'newton-acceleration' },
              { label: 'Vận tốc v', value: r.velocity_m_s.toFixed(2), unit: 'm/s', testId: 'newton-velocity' },
              { label: 'Vị trí x', value: r.position_m.toFixed(2), unit: 'm' },
              { label: 'Động năng Wđ', value: r.kineticEnergy_J.toFixed(2), unit: 'J' },
            ]}
          />
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Thông số</h2>
              <span>Không ma sát</span>
            </div>
            <LabSlider
              label="Hợp lực"
              unit="N"
              min={-10}
              max={10}
              step={0.1}
              value={p.force_N}
              presets={[-4, 0, 4, 8]}
              onChange={force_N => engine.setParameters({ force_N })}
            />
            <LabSlider
              label="Khối lượng xe"
              unit="kg"
              min={0.5}
              max={5}
              step={0.1}
              value={p.mass_kg}
              presets={[1, 2, 4]}
              onChange={mass_kg => engine.setParameters({ mass_kg })}
            />
            <LabSlider
              label="Vận tốc đầu"
              unit="m/s"
              min={-3}
              max={3}
              step={0.1}
              value={p.initialVelocity_m_s}
              presets={[-2, 0, 2]}
              onChange={initialVelocity_m_s => engine.setParameters({ initialVelocity_m_s })}
            />
            <p className="lab-notice">Kéo tay nắm lực F, kéo thân xe để đặt v₀, hoặc thả quả cân 0,5 kg lên xe.</p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Vận tốc theo thời gian</h2>
              <span>v(t)</span>
            </div>
            <ChartBoundary>
              <Suspense fallback={<div className="chart-area chart-loading">Đang mở đồ thị…</div>}>
                <Chart parameters={p} time={state.elapsed_s} kind="mechanics" />
              </Suspense>
            </ChartBoundary>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="mechanics"
        formulas={<p><strong>a = F/m · v = v₀ + at · x = v₀t + ½at²</strong></p>}
        columns={['t(s)', 'm(kg)', 'F(N)', 'a(m/s²)', 'v(m/s)']}
        rows={state.records.map(row => [
          row.elapsed_s.toFixed(2),
          row.parameters.mass_kg,
          row.parameters.force_N,
          row.reading.acceleration_m_s2.toFixed(2),
          row.reading.velocity_m_s.toFixed(2),
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}
