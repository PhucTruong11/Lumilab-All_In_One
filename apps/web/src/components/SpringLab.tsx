import { lazy, Suspense, useState } from 'react';
import { useLab } from '../labSession';
import { useSvgDrag } from './useSvgDrag';
import { ChartBoundary } from './AppBoundary';
import { ExpandedFooter, ExpandedReadings, LabSlider } from './ExpandedLabParts';

const Chart = lazy(() => import('./ExpandedCharts').then(m => ({ default: m.MotionChart })));

function VectorArrow({ x, y, dx, color, label }: { x: number; y: number; dx: number; color: string; label: string }) {
  if (Math.abs(dx) < 4) return null;
  const dir = Math.sign(dx);
  const endX = x + dx;
  return (
    <g pointerEvents="none">
      <line x1={x} y1={y} x2={endX} y2={y} stroke={color} strokeWidth="3.2" strokeLinecap="round" />
      <path
        d={`M${endX - dir * 8} ${y - 5}L${endX} ${y}L${endX - dir * 8} ${y + 5}`}
        fill="none"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x={endX + dir * 10} y={y + 4} textAnchor={dir > 0 ? 'start' : 'end'} fill={color} fontSize="11.5" fontWeight="700">
        {label}
      </text>
    </g>
  );
}

export function SpringLab() {
  const { engine, state } = useLab('spring');
  const { parameters: p, reading: r } = state;
  const [showVectors, setShowVectors] = useState(true);
  const [showEnergy, setShowEnergy] = useState(true);

  const { drag, start, handlers } = useSvgDrag((key, x, y, moved) => {
    if (key === 'bob' && moved) {
      engine.setParameters({ displacement_m: Math.max(-0.4, Math.min(0.4, Math.round(((x - 400) / 500) * 100) / 100)) });
    }
    if (key === 'mass' && (!moved || (Math.abs(x - (400 + r.displacement_m * 500)) < 80 && y > 150 && y < 320))) {
      engine.setParameters({ mass_kg: Math.min(2, Math.round((p.mass_kg + 0.1) * 10) / 10) });
    }
  });

  const bobX = drag?.key === 'bob' && drag.moved ? Math.max(200, Math.min(600, drag.x)) : 400 + r.displacement_m * 500;
  const dispShown = (bobX - 400) / 500;
  const coilStroke = 2.8 + (p.stiffness_N_m / 100) * 2.6;
  const spring = Array.from(
    { length: 27 },
    (_, i) => `${i ? 'L' : 'M'}${120 + ((bobX - 158) * i) / 26} ${i === 0 || i === 26 ? 230 : 230 + (i % 2 ? -16 : 16)}`
  ).join(' ');

  const extraPlates = Math.min(5, Math.floor((p.mass_kg - 0.1) / 0.35));
  const safeTotalE = r.totalEnergy_J > 0 ? r.totalEnergy_J : 1e-6;
  const kinRatio = Math.min(1, Math.max(0, r.kineticEnergy_J / safeTotalE));
  const forcePx = Math.max(-110, Math.min(110, r.force_N * 3.2));
  const velPx = Math.max(-100, Math.min(100, r.velocity_m_s * 34));

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel" aria-label="Bàn con lắc lò xo">
          <div className="panel-title">
            <h2>Lò xo trên mặt phẳng ngang</h2>
            <span className="mode-chip">
              <i /> {state.phase === 'running' ? 'Đang dao động điều hòa' : 'Kéo vật ra biên để thả'}
            </span>
          </div>

          <div className="visual-toggles" role="toolbar" aria-label="Tùy chọn hiển thị lò xo">
            <button
              type="button"
              className="visual-toggle-btn"
              aria-pressed={showVectors}
              onClick={() => setShowVectors(v => !v)}
            >
              <span>Vectơ lực & vận tốc (Fđh, v)</span>
            </button>
            <button
              type="button"
              className="visual-toggle-btn"
              aria-pressed={showEnergy}
              onClick={() => setShowEnergy(v => !v)}
            >
              <span>Thanh bảo toàn cơ năng</span>
            </button>
          </div>

          <svg className="interactive-stage" viewBox="0 0 760 440" {...handlers} aria-label="Kéo vật lò xo để đổi li độ thả">
            <defs>
              <linearGradient id="spring-bench-bg" x2="1" y2="1">
                <stop stopColor="#edf6f1" />
                <stop offset="1" stopColor="#e4efe9" />
              </linearGradient>
              <pattern id="spring-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.9" fill="#9fc0af" opacity="0.45" />
              </pattern>
              <linearGradient id="spring-block-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#357a60" />
                <stop offset="100%" stopColor="#1f5440" />
              </linearGradient>
            </defs>

            <rect x="10" y="5" width="740" height="422" rx="22" fill="url(#spring-bench-bg)" />
            <rect x="10" y="5" width="740" height="422" rx="22" fill="url(#spring-dots)" />

            {/* Energy HUD */}
            {showEnergy && (
              <g transform="translate(28 22)">
                <rect width="196" height="68" rx="11" fill="#ffffffeb" stroke="#c8ddd1" />
                <text x="12" y="18" fill="#1f5d44" fontSize="11" fontWeight="700">
                  Bảo toàn cơ năng (E = {r.totalEnergy_J.toFixed(3)} J)
                </text>
                <rect x="12" y="27" width="172" height="10" rx="5" fill="#e5ece8" />
                {r.totalEnergy_J > 0 && (
                  <>
                    <rect x="12" y="27" width={172 * kinRatio} height="10" rx="4" fill="#10b981" />
                    <rect x={12 + 172 * kinRatio} y="27" width={172 * (1 - kinRatio)} height="10" rx="4" fill="#f59e0b" />
                  </>
                )}
                <text x="12" y="54" fill="#0f766e" fontSize="10.5" fontWeight="600">
                  Wđ: {r.kineticEnergy_J.toFixed(3)} J
                </text>
                <text x="184" y="54" textAnchor="end" fill="#b45309" fontSize="10.5" fontWeight="600">
                  Wt: {r.potentialEnergy_J.toFixed(3)} J
                </text>
              </g>
            )}

            {/* Equilibrium & amplitude markers */}
            <path d="M400 92v222" stroke="#6d9984" strokeDasharray="5 5" strokeWidth="1.6" />
            <text x="400" y="80" textAnchor="middle" fill="#2f664d" fontSize="12" fontWeight="600">
              Vị trí cân bằng (O)
            </text>
            {Math.abs(p.displacement_m) > 0.01 && (
              <g opacity="0.55">
                <path d={`M${400 - Math.abs(p.displacement_m) * 500} 175v115`} stroke="#14798f" strokeDasharray="3 4" />
                <path d={`M${400 + Math.abs(p.displacement_m) * 500} 175v115`} stroke="#14798f" strokeDasharray="3 4" />
              </g>
            )}

            {/* Track & left steel wall */}
            <rect x="76" y="290" width="625" height="10" rx="5" fill="#9ebbb0" />
            <rect x="92" y="148" width="28" height="146" rx="6" fill="#527364" stroke="#385447" strokeWidth="2" />
            {[164, 192, 220, 248, 276].map(y => (
              <line key={y} x1="92" y1={y} x2="80" y2={y + 10} stroke="#6d8d7e" strokeWidth="2.5" />
            ))}

            {/* Ruler scale */}
            {[-0.4, -0.2, 0, 0.2, 0.4].map(x => (
              <g key={x}>
                <path d={`M${400 + x * 500} 300v10`} stroke="#587c6a" strokeWidth={x === 0 ? 2.2 : 1.4} />
                <text x={400 + x * 500} y="326" textAnchor="middle" fill="#3d6350" fontSize="11" fontWeight={x === 0 ? '700' : '500'}>
                  {x > 0 ? `+${x.toFixed(1)}` : x.toFixed(1)} m
                </text>
              </g>
            ))}

            {/* Helical spring */}
            <path d={spring} stroke="#2f6a54" strokeWidth={coilStroke} fill="none" strokeLinejoin="round" strokeLinecap="round" />

            {/* Oscillating block */}
            <g
              data-testid="spring-bob"
              transform={`translate(${bobX} 230)`}
              role="button"
              tabIndex={0}
              aria-label="Vật lò xo: kéo để đổi li độ"
              className="svg-draggable"
              onPointerDown={e => {
                engine.pause();
                start(e, 'bob');
              }}
              onKeyDown={e => {
                if (['ArrowRight', 'ArrowLeft'].includes(e.key)) {
                  e.preventDefault();
                  engine.setParameters({
                    displacement_m: Math.max(
                      -0.4,
                      Math.min(0.4, Math.round((p.displacement_m + (e.key === 'ArrowRight' ? 0.01 : -0.01)) * 100) / 100)
                    ),
                  });
                }
              }}
            >
              {/* Stacked brass mass plates */}
              {Array.from({ length: extraPlates }).map((_, idx) => (
                <rect
                  key={idx}
                  x="-28"
                  y={-50 - idx * 9}
                  width="56"
                  height="8"
                  rx="3"
                  fill="#d49a45"
                  stroke="#9c6c22"
                  strokeWidth="1.2"
                />
              ))}
              <rect x="-40" y="-40" width="80" height="80" rx="13" fill="url(#spring-block-grad)" stroke="#173f30" strokeWidth="2" />
              <circle cx="0" cy="-14" r="9" fill="#ffffff" stroke="#14798f" strokeWidth="2.5" className="tactile-grip" />
              <path d="M-4 -14h8M-2 -17l-3 3 3 3M2 -17l3 3-3 3" stroke="#14798f" strokeWidth="1.4" fill="none" strokeLinecap="round" />
              <text y="15" textAnchor="middle" fontSize="13" fontWeight="700" fill="#ffffff">
                {p.mass_kg.toFixed(1)} kg
              </text>
              <text y="31" textAnchor="middle" fontSize="10" fill="#b7e0cd">
                x = {dispShown >= 0 ? `+${dispShown.toFixed(2)}` : dispShown.toFixed(2)} m
              </text>
              <circle cx="-23" cy="49" r="9" fill="#466859" stroke="#264035" strokeWidth="2" />
              <circle cx="23" cy="49" r="9" fill="#466859" stroke="#264035" strokeWidth="2" />
            </g>

            {/* Physics vectors */}
            {showVectors && (
              <>
                <VectorArrow x={bobX} y={170} dx={forcePx} color="#c97a16" label={`Fđh = ${r.force_N.toFixed(1)} N`} />
                <VectorArrow x={bobX} y={145} dx={velPx} color="#14798f" label={`v = ${r.velocity_m_s.toFixed(2)} m/s`} />
              </>
            )}

            {/* Add-mass weight shelf */}
            <g
              data-testid="spring-mass"
              role="button"
              tabIndex={0}
              aria-label="Thêm quả cân 0,1 kg"
              className="svg-draggable"
              onPointerDown={e => {
                engine.pause();
                start(e, 'mass');
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  engine.setParameters({ mass_kg: Math.min(2, Math.round((p.mass_kg + 0.1) * 10) / 10) });
                }
              }}
            >
              <rect x="86" y="352" width="112" height="46" rx="10" fill="#fffaf0" stroke="#d49a45" strokeWidth="2" />
              <circle cx="108" cy="375" r="10" fill="#d49a45" />
              <text x="108" y="379" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
                +
              </text>
              <text x="156" y="372" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#7c5011">
                Quả cân 0,1 kg
              </text>
              <text x="156" y="387" textAnchor="middle" fontSize="10" fill="#9c6c22">
                Kéo lên vật nặng
              </text>
            </g>

            <text x="560" y="382" textAnchor="middle" fill="#3f6552" fontSize="12" fontWeight="600">
              t = {state.elapsed_s.toFixed(2)} s · k = {p.stiffness_N_m} N/m (Không ma sát)
            </text>

            {drag?.key === 'mass' && drag.moved && (
              <rect x={drag.x - 28} y={drag.y - 18} width="56" height="36" rx="7" fill="#d49a45" opacity=".88" pointerEvents="none" />
            )}
          </svg>

          <div className="stage-actions">
            <button
              className="primary-button"
              disabled={p.displacement_m === 0}
              onClick={() => (state.phase === 'running' ? engine.pause() : engine.run())}
            >
              {state.phase === 'running' ? 'Ⅱ Tạm dừng' : '▶ Thả vật'}
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
              { label: 'Chu kỳ T', value: r.period_s?.toFixed(3) ?? '—', unit: 's', testId: 'spring-period' },
              { label: 'Li độ x', value: r.displacement_m.toFixed(3), unit: 'm', testId: 'spring-displacement' },
              { label: 'Lực đàn hồi Fđh', value: r.force_N.toFixed(2), unit: 'N' },
              { label: 'Cơ năng E', value: r.totalEnergy_J.toFixed(3), unit: 'J' },
            ]}
          />
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Thông số</h2>
              <span>Định luật Hooke</span>
            </div>
            <LabSlider
              label="Khối lượng vật"
              unit="kg"
              min={0.1}
              max={2}
              step={0.1}
              value={p.mass_kg}
              presets={[0.2, 0.5, 1, 2]}
              onChange={mass_kg => engine.setParameters({ mass_kg })}
            />
            <LabSlider
              label="Độ cứng lò xo"
              unit="N/m"
              min={5}
              max={100}
              value={p.stiffness_N_m}
              presets={[20, 40, 80]}
              onChange={stiffness_N_m => engine.setParameters({ stiffness_N_m })}
            />
            <LabSlider
              label="Li độ thả"
              unit="m"
              min={-0.4}
              max={0.4}
              step={0.01}
              value={p.displacement_m}
              presets={[-0.3, -0.15, 0.15, 0.3]}
              onChange={displacement_m => engine.setParameters({ displacement_m })}
            />
            <p className="lab-notice">Kéo trực tiếp vật sang hai phía hoặc thả thêm quả cân 0,1 kg lên khối trượt.</p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Li độ theo thời gian</h2>
              <span>x(t)</span>
            </div>
            <ChartBoundary>
              <Suspense fallback={<div className="chart-area chart-loading">Đang mở đồ thị…</div>}>
                <Chart parameters={p} time={state.elapsed_s} kind="spring" />
              </Suspense>
            </ChartBoundary>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="spring"
        formulas={<p><strong>ω = √(k/m) · T = 2π√(m/k) · x = x₀cos(ωt) · E = ½kx₀²</strong></p>}
        columns={['t(s)', 'm(kg)', 'k(N/m)', 'x(m)', 'T(s)']}
        rows={state.records.map(row => [
          row.elapsed_s.toFixed(2),
          row.parameters.mass_kg,
          row.parameters.stiffness_N_m,
          row.reading.displacement_m.toFixed(3),
          row.reading.period_s?.toFixed(3) ?? '—',
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}
