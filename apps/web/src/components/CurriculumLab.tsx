import { useMemo, useState } from 'react';
import { dampedSpringReading, inclineReading } from '@lumilab/lab-engine';
import { useLab } from '../labSession';
import { ExpandedFooter, ExpandedReadings, LabSlider } from './ExpandedLabParts';
import { useSvgDrag } from './useSvgDrag';

const number = (value: number) => Number(value.toFixed(3)).toString();

function MotionActions({
  running,
  onToggle,
  onReset,
  onRecord,
}: {
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  onRecord: () => void;
}) {
  return (
    <>
      <button className="primary-button" onClick={onToggle}>
        {running ? 'Ⅱ Tạm dừng' : '▶ Chạy mô phỏng'}
      </button>
      <button className="secondary-button" onClick={onReset}>
        ↺ Đặt lại
      </button>
      <button className="record-button" onClick={onRecord}>
        Ghi số đo
      </button>
    </>
  );
}

export function DampedSpringLab() {
  const { engine, state } = useLab('spring-damped');
  const { parameters: p, reading: r } = state;
  const running = state.phase === 'running';
  const [showVectors, setShowVectors] = useState(true);

  const { drag, start, handlers } = useSvgDrag((key, x, _y, moved) => {
    if (key === 'bob' && moved) {
      engine.setParameters({
        displacement_m: Math.max(-0.4, Math.min(0.4, Math.round(((x - 420) / 420) * 100) / 100)),
      });
    }
  });

  const bobX = drag?.key === 'bob' && drag.moved ? Math.max(252, Math.min(588, drag.x)) : 420 + r.displacement_m * 420;
  const springPath = Array.from(
    { length: 23 },
    (_, i) => `${i ? 'L' : 'M'}${118 + ((bobX - 162) * i) / 22} ${i === 0 || i === 22 ? 195 : 195 + (i % 2 ? -13 : 13)}`
  ).join(' ');

  const initialE = 0.5 * p.stiffness_N_m * p.displacement_m ** 2;
  const energyRatio = initialE > 0 ? Math.min(1, Math.max(0, r.energy_J / initialE)) : 0;
  const dampingCoeff = 2 * p.damping_ratio * Math.sqrt(p.stiffness_N_m * p.mass_kg);
  const hookeForce = -p.stiffness_N_m * r.displacement_m;
  const dragForce = -dampingCoeff * r.velocity_m_s;

  const samples = useMemo(() => Array.from({ length: 601 }, (_, i) => dampedSpringReading(p, i / 50)), [p]);
  const x = (t: number) => 44 + t * 42;
  const y = (value: number) => 128 - (value * 88) / Math.max(0.1, samples[0].envelope_m);
  const curve = (key: 'displacement_m' | 'envelope_m', sign = 1) =>
    samples.map(sample => `${x(sample.time_s)},${y(sign * sample[key])}`).join(' ');

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel" aria-label="Bàn lò xo có giảm chấn">
          <div className="panel-title">
            <h2>Hệ lò xo & Pít-tông giảm chấn nhớt</h2>
            <span className="mode-chip">
              <i /> {p.damping_ratio === 0 ? 'Dao động lý tưởng (ζ = 0)' : `Tắt dần (ζ = ${p.damping_ratio})`}
            </span>
          </div>

          <div className="visual-toggles" role="toolbar" aria-label="Tùy chọn hiển thị lò xo tắt dần">
            <button
              type="button"
              className="visual-toggle-btn"
              aria-pressed={showVectors}
              onClick={() => setShowVectors(v => !v)}
            >
              <span>Vectơ lực (Fđh, Fcản) & Tiêu tán cơ năng</span>
            </button>
          </div>

          <svg
            className="interactive-stage"
            viewBox="0 0 760 400"
            {...handlers}
            aria-label="Kéo khối nặng để đặt li độ thả ban đầu cho lò xo tắt dần"
          >
            <defs>
              <linearGradient id="damped-bg" x2="1" y2="1">
                <stop stopColor="#edf6f1" />
                <stop offset="1" stopColor="#e4efe9" />
              </linearGradient>
            </defs>

            <rect x="10" y="5" width="740" height="384" rx="22" fill="url(#damped-bg)" />

            {/* Energy dissipation bar */}
            {showVectors && (
              <g transform="translate(26 20)">
                <rect width="218" height="64" rx="11" fill="#ffffffeb" stroke="#c8ddd1" />
                <text x="12" y="18" fill="#1f5d44" fontSize="11" fontWeight="700">
                  Cơ năng còn lại: {r.energy_J.toFixed(3)} / {initialE.toFixed(3)} J
                </text>
                <rect x="12" y="27" width="194" height="10" rx="5" fill="#fee2e2" />
                <rect x="12" y="27" width={194 * energyRatio} height="10" rx="5" fill="#1f7054" />
                <text x="12" y="52" fill="#991b1b" fontSize="10" fontWeight="600">
                  Hao phí do cản: {Math.max(0, initialE - r.energy_J).toFixed(3)} J
                </text>
              </g>
            )}

            {/* Equilibrium & envelope guides on track */}
            <path d="M420 96v204" stroke="#6d9984" strokeDasharray="5 5" strokeWidth="1.5" />
            {r.envelope_m > 0.005 && (
              <g opacity="0.65">
                <path d={`M${420 - Math.min(0.45, r.envelope_m) * 420} 152v138`} stroke="#c97a16" strokeDasharray="3 3" />
                <path d={`M${420 + Math.min(0.45, r.envelope_m) * 420} 152v138`} stroke="#c97a16" strokeDasharray="3 3" />
              </g>
            )}

            {/* Anchor wall & track */}
            <rect x="86" y="288" width="612" height="9" rx="4.5" fill="#96b6a6" />
            <rect x="92" y="146" width="26" height="146" rx="6" fill="#4f7061" stroke="#355044" strokeWidth="2" />

            {/* Top: Helical spring */}
            <path d={springPath} fill="none" stroke="#296952" strokeWidth="3.4" strokeLinejoin="round" />

            {/* Bottom: Viscous dashpot (cylinder + oil + sliding piston) */}
            <g>
              <line x1="118" y1="250" x2="152" y2="250" stroke="#536b60" strokeWidth="4" />
              <rect x="152" y="230" width="136" height="40" rx="6" fill="#ffffffcc" stroke="#5d786b" strokeWidth="2.5" />
              <rect
                x="155"
                y="233"
                width="130"
                height="34"
                rx="4"
                fill="#f59e0b"
                opacity={0.08 + p.damping_ratio * 0.68}
              />
              <line
                x1={Math.max(168, Math.min(274, 220 + r.displacement_m * 115))}
                y1="235"
                x2={Math.max(168, Math.min(274, 220 + r.displacement_m * 115))}
                y2="265"
                stroke="#234236"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <line
                x1={Math.max(168, Math.min(274, 220 + r.displacement_m * 115))}
                y1="250"
                x2={bobX - 40}
                y2="250"
                stroke="#466356"
                strokeWidth="4"
              />
              <text x="220" y="223" textAnchor="middle" fill="#7c5011" fontSize="10.5" fontWeight="600">
                Giảm chấn nhớt (ζ = {p.damping_ratio})
              </text>
            </g>

            {/* Scale ticks */}
            {[-0.4, -0.2, 0, 0.2, 0.4].map(mark => (
              <g key={mark}>
                <path d={`M${420 + mark * 420} 297v9`} stroke="#587c6a" />
                <text x={420 + mark * 420} y="322" textAnchor="middle" fill="#3d6350" fontSize="11">
                  {mark > 0 ? `+${mark.toFixed(1)}` : mark.toFixed(1)} m
                </text>
              </g>
            ))}

            {/* Draggable Mass Block */}
            <g
              data-testid="damped-spring-bob"
              transform={`translate(${bobX} 226)`}
              role="button"
              tabIndex={0}
              aria-label="Khối nặng lò xo tắt dần: kéo để đổi li độ thả"
              className="svg-draggable"
              onPointerDown={e => {
                engine.pause();
                start(e, 'bob');
              }}
              onKeyDown={e => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault();
                  engine.setParameters({
                    displacement_m: Math.max(
                      -0.4,
                      Math.min(0.4, Math.round((p.displacement_m + (e.key === 'ArrowRight' ? 0.02 : -0.02)) * 100) / 100)
                    ),
                  });
                }
              }}
            >
              <rect x="-42" y="-44" width="84" height="88" rx="13" fill="#276952" stroke="#164233" strokeWidth="2" />
              <circle cx="0" cy="-16" r="9" fill="#fff" stroke="#14798f" strokeWidth="2.5" className="tactile-grip" />
              <text y="12" textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
                {p.mass_kg.toFixed(1)} kg
              </text>
              <text y="29" textAnchor="middle" fill="#bce3d2" fontSize="10">
                ±A(t) = {r.envelope_m.toFixed(2)} m
              </text>
              <circle cx="-24" cy="52" r="9" fill="#466859" />
              <circle cx="24" cy="52" r="9" fill="#466859" />
            </g>

            {/* Force vectors */}
            {showVectors && Math.abs(hookeForce) > 0.3 && (
              <g pointerEvents="none">
                <line
                  x1={bobX}
                  y1="162"
                  x2={bobX + Math.max(-95, Math.min(95, hookeForce * 3))}
                  y2="162"
                  stroke="#14798f"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text x={bobX} y="152" textAnchor="middle" fill="#0f6275" fontSize="10.5" fontWeight="700">
                  Fđh = {hookeForce.toFixed(1)} N
                </text>
              </g>
            )}
            {showVectors && Math.abs(dragForce) > 0.15 && (
              <g pointerEvents="none">
                <line
                  x1={bobX}
                  y1="138"
                  x2={bobX + Math.max(-85, Math.min(85, dragForce * 6))}
                  y2="138"
                  stroke="#dc2626"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <text x={bobX} y="128" textAnchor="middle" fill="#b91c1c" fontSize="10.5" fontWeight="700">
                  Fcản = {dragForce.toFixed(2)} N
                </text>
              </g>
            )}

            <text x="420" y="362" textAnchor="middle" fill="#3f6552" fontSize="11.5" fontWeight="600">
              Kéo vật để đặt biên độ đầu · Đường đứt cam thể hiện biên độ đường bao ±A(t)
            </text>
          </svg>

          <div className="stage-actions">
            <MotionActions
              running={running}
              onToggle={() => (running ? engine.pause() : engine.run())}
              onReset={() => engine.reset()}
              onRecord={() => engine.record()}
            />
          </div>

          <ExpandedReadings
            items={[
              { label: 'Thời gian', value: number(r.time_s), unit: 's' },
              { label: 'Li độ', value: number(r.displacement_m), unit: 'm' },
              { label: 'Cơ năng', value: number(r.energy_J), unit: 'J' },
              { label: 'Chu kỳ mô hình', value: r.period_s === null ? '—' : number(r.period_s), unit: 's' },
            ]}
          />
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Điều kiện</h2>
              <span>Dao động tắt dần</span>
            </div>
            <LabSlider
              label="Khối lượng"
              value={p.mass_kg}
              unit="kg"
              min={0.1}
              max={2}
              step={0.1}
              onChange={mass_kg => engine.setParameters({ mass_kg })}
            />
            <LabSlider
              label="Độ cứng"
              value={p.stiffness_N_m}
              unit="N/m"
              min={5}
              max={100}
              onChange={stiffness_N_m => engine.setParameters({ stiffness_N_m })}
            />
            <LabSlider
              label="Li độ thả"
              value={p.displacement_m}
              unit="m"
              min={-0.4}
              max={0.4}
              step={0.01}
              onChange={displacement_m => engine.setParameters({ displacement_m })}
            />
            <LabSlider
              label="Tỉ số cản"
              value={p.damping_ratio}
              unit=""
              min={0}
              max={0.9}
              step={0.05}
              presets={[0, 0.15, 0.4, 0.7]}
              onChange={damping_ratio => engine.setParameters({ damping_ratio })}
            />
            <p className="content-note">Đường nét đứt là đường bao biên độ. Đặt tỉ số cản bằng 0 để đối chiếu với lò xo lý tưởng.</p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Đồ thị đường bao tắt dần</h2>
              <span>x(t) & ±A(t)</span>
            </div>
            <svg
              className="interactive-stage"
              viewBox="0 0 580 250"
              role="img"
              aria-label="Đồ thị li độ lò xo tắt dần theo thời gian"
            >
              <rect x="6" y="6" width="568" height="238" rx="14" fill="#f4faf7" />
              <path d="M44 24v204h504M44 128h504" fill="none" stroke="#6c8f7f" strokeWidth="1.4" />
              <text x="16" y="28" fill="#305954" fontSize="11">
                x (m)
              </text>
              <text x="536" y="241" fill="#305954" fontSize="11">
                t (s)
              </text>
              {[0, 3, 6, 9, 12].map(t => (
                <text key={t} x={x(t)} y="241" textAnchor="middle" fill="#305954" fontSize="10.5">
                  {t}
                </text>
              ))}
              <polyline points={curve('envelope_m')} fill="none" stroke="#c97a16" strokeWidth="1.6" strokeDasharray="5 4" />
              <polyline points={curve('envelope_m', -1)} fill="none" stroke="#c97a16" strokeWidth="1.6" strokeDasharray="5 4" />
              <polyline points={curve('displacement_m')} fill="none" stroke="#1f7054" strokeWidth="2.2" />
              <circle cx={x(r.time_s)} cy={y(r.displacement_m)} r="5.5" fill="#14798f" stroke="#fff" strokeWidth="1.8" />
            </svg>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="spring-damped"
        formulas={<p>ωd = √(k/m)√(1 − ζ²). Lực cản nhớt làm cơ năng giảm khi ζ &gt; 0.</p>}
        columns={['t (s)', 'ζ', 'm (kg)', 'k (N/m)', 'x (m)', 'E (J)']}
        rows={state.records.map(row => [
          number(row.elapsed_s),
          row.parameters.damping_ratio,
          row.parameters.mass_kg,
          row.parameters.stiffness_N_m,
          number(row.reading.displacement_m),
          number(row.reading.energy_J),
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}

export function InclineLab() {
  const { engine, state } = useLab('inclined-plane');
  const { parameters: p, reading: r } = state;
  const running = state.phase === 'running';
  const [showForces, setShowForces] = useState(true);

  const pivotX = 140;
  const pivotY = 72;
  const slopeLen = 250;

  const { start, handlers } = useSvgDrag((_key, x, y, moved) => {
    if (moved) {
      engine.setParameters({
        angle_deg: Math.max(0, Math.min(60, Math.round((Math.atan2(y - pivotY, x - pivotX) * 180) / Math.PI))),
      });
    }
  });

  const rad = (p.angle_deg * Math.PI) / 180;
  const endX = pivotX + slopeLen * Math.cos(rad);
  const endY = pivotY + slopeLen * Math.sin(rad);
  const criticalDeg = (Math.atan(p.static_friction) * 180) / Math.PI;
  const weightN = p.mass_kg * 9.81;
  const fScale = 1.65;

  const curvePoints = useMemo(
    () =>
      Array.from({ length: 61 }, (_, deg) => {
        const sample = inclineReading({ ...p, angle_deg: deg }, 0);
        return `${44 + deg * 8.2},${196 - sample.acceleration_m_s2 * 16}`;
      }).join(' '),
    [p]
  );

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel" aria-label="Bàn mặt phẳng nghiêng">
          <div className="panel-title">
            <h2>Vật trượt trên mặt phẳng nghiêng</h2>
            <span className="mode-chip">
              <i /> {r.state} · Ngưỡng trượt αgh ≈ {criticalDeg.toFixed(1)}°
            </span>
          </div>

          <div className="visual-toggles" role="toolbar" aria-label="Tùy chọn hiển thị lực mặt phẳng nghiêng">
            <button
              type="button"
              className="visual-toggle-btn"
              aria-pressed={showForces}
              onClick={() => setShowForces(v => !v)}
            >
              <span>Phân tích lực (P, N, P∥, Fms)</span>
            </button>
          </div>

          <svg
            className="interactive-stage"
            viewBox="0 0 680 360"
            {...handlers}
            aria-label="Vật trượt trên mặt phẳng nghiêng"
          >
            <defs>
              <linearGradient id="incline-bg" x2="1" y2="1">
                <stop stopColor="#edf6f1" />
                <stop offset="1" stopColor="#e4efe9" />
              </linearGradient>
            </defs>

            <rect x="8" y="6" width="664" height="348" rx="20" fill="url(#incline-bg)" />

            {/* Base reference line & wedge body */}
            <line x1={pivotX - 24} y1={endY} x2={endX + 60} y2={endY} stroke="#88a898" strokeWidth="3" />
            {p.angle_deg > 0 && (
              <polygon
                points={`${pivotX},${pivotY} ${endX},${endY} ${pivotX},${endY}`}
                fill="#d8eae0"
                stroke="#7da18f"
                strokeWidth="2"
              />
            )}

            {/* Angle arc α near bottom-right corner of wedge */}
            {p.angle_deg >= 4 && (
              <g>
                <path
                  d={`M${endX - 46} ${endY}A46 46 0 0 1 ${endX - 46 * Math.cos(rad)} ${endY - 46 * Math.sin(rad)}`}
                  fill="none"
                  stroke="#14798f"
                  strokeWidth="2.2"
                />
                <text x={endX - 66} y={endY - 10} fill="#0f6275" fontSize="12" fontWeight="700">
                  α = {p.angle_deg}°
                </text>
              </g>
            )}

            {/* Rotated slope group */}
            <g transform={`translate(${pivotX} ${pivotY}) rotate(${p.angle_deg})`}>
              {/* Slope surface */}
              <path d={`M-16 0h${slopeLen + 16}`} stroke="#426a58" strokeWidth="6" strokeLinecap="round" />

              {/* Surface roughness teeth proportional to static_friction */}
              {p.static_friction > 0.02 &&
                Array.from({ length: Math.round(6 + p.static_friction * 18) }, (_, idx) => {
                  const tx = (idx * slopeLen) / Math.round(6 + p.static_friction * 18);
                  return (
                    <path
                      key={idx}
                      d={`M${tx} 0l3 ${2 + p.static_friction * 4}l3 -${2 + p.static_friction * 4}`}
                      fill="none"
                      stroke="#9a6b25"
                      strokeWidth="1.4"
                      opacity="0.7"
                    />
                  );
                })}

              {/* 0..5 m ticks along the ramp */}
              {[0, 1, 2, 3, 4, 5].map(m => (
                <g key={m} transform={`translate(${m * 42} 0)`}>
                  <line x1="0" y1="0" x2="0" y2="7" stroke="#426a58" strokeWidth="1.4" />
                  <text y="18" textAnchor="middle" fill="#3d6350" fontSize="9.5">
                    {m}m
                  </text>
                </g>
              ))}

              {/* Sliding Block + Force Vectors */}
              <g transform={`translate(${r.position_m * 42} 0)`}>
                <rect x="-18" y="-34" width="36" height="32" rx="6" fill="#1f7054" stroke="#134735" strokeWidth="2" />
                <text x="0" y="-14" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700">
                  {p.mass_kg}kg
                </text>

                {showForces && (
                  <g pointerEvents="none">
                    {/* Normal force N (perpendicular up from slope) */}
                    <line x1="0" y1="-18" x2="0" y2={-18 - Math.min(72, r.normal_N * fScale)} stroke="#7c3aed" strokeWidth="2.6" />
                    <text x="6" y={-22 - Math.min(72, r.normal_N * fScale)} fill="#6d28d9" fontSize="10.5" fontWeight="700">
                      N
                    </text>

                    {/* Downhill component P∥ */}
                    {r.downhill_N > 0.2 && (
                      <>
                        <line x1="0" y1="-18" x2={Math.min(78, r.downhill_N * fScale)} y2="-18" stroke="#c97a16" strokeWidth="2.8" />
                        <text x={Math.min(78, r.downhill_N * fScale) + 5} y="-14" fill="#b45309" fontSize="10.5" fontWeight="700">
                          P∥
                        </text>
                      </>
                    )}

                    {/* Friction Fms (uphill) */}
                    {r.friction_N > 0.2 && (
                      <>
                        <line x1="0" y1="-10" x2={-Math.min(78, r.friction_N * fScale)} y2="-10" stroke="#dc2626" strokeWidth="2.8" />
                        <text x={-Math.min(78, r.friction_N * fScale) - 5} y="-6" textAnchor="end" fill="#b91c1c" fontSize="10.5" fontWeight="700">
                          Fms
                        </text>
                      </>
                    )}

                    {/* Gravity P (always straight vertically downward in world space -> rotate(-angle_deg)) */}
                    <g transform={`translate(0 -18) rotate(${-p.angle_deg})`}>
                      <line x1="0" y1="0" x2="0" y2={Math.min(76, weightN * fScale)} stroke="#0f766e" strokeWidth="2.4" strokeDasharray="3 2" />
                      <text x="6" y={Math.min(76, weightN * fScale)} fill="#0f766e" fontSize="10.5" fontWeight="700">
                        P
                      </text>
                    </g>
                  </g>
                )}
              </g>

              {/* Draggable Angle Handle */}
              <g
                transform={`translate(${slopeLen} 0)`}
                className="svg-draggable"
                role="button"
                tabIndex={0}
                aria-label="Đầu dốc: kéo để đổi góc"
                data-testid="incline-angle-handle"
                onPointerDown={e => {
                  engine.pause();
                  start(e, 'angle');
                }}
                onKeyDown={e => {
                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    engine.setParameters({
                      angle_deg: Math.max(0, Math.min(60, p.angle_deg + (e.key === 'ArrowUp' ? 1 : -1))),
                    });
                  }
                }}
              >
                <circle r="19" fill="#ffffff" stroke="#14798f" strokeWidth="3" className="tactile-grip" />
                <path d="M-6 0h12M0-6v12" stroke="#14798f" strokeWidth="2.2" strokeLinecap="round" />
              </g>
            </g>

            {/* Status & Force Balance Card on stage */}
            <g transform="translate(432 28)">
              <rect width="220" height="106" rx="12" fill="#ffffffeb" stroke="#c8ddd1" />
              <text x="14" y="26" fill="#1b382b" fontSize="16" fontWeight="700">
                {r.state}
              </text>
              <text x="14" y="48" fill="#355d48" fontSize="12">
                Góc dốc α = {p.angle_deg}° (tan α = {Math.tan(rad).toFixed(2)})
              </text>
              <text x="14" y="68" fill="#b45309" fontSize="11.5" fontWeight="600">
                Kéo xuống P∥ = {number(r.downhill_N)} N
              </text>
              <text x="14" y="88" fill="#b91c1c" fontSize="11.5" fontWeight="600">
                Cản ma sát Fms = {number(r.friction_N)} N
              </text>
            </g>
          </svg>

          <div className="stage-actions">
            <MotionActions
              running={running}
              onToggle={() => (running ? engine.pause() : engine.run())}
              onReset={() => engine.reset()}
              onRecord={() => engine.record()}
            />
          </div>

          <ExpandedReadings
            items={[
              { label: 'Trạng thái', value: r.state },
              { label: 'Phản lực', value: number(r.normal_N), unit: 'N' },
              { label: 'Ma sát', value: number(r.friction_N), unit: 'N' },
              { label: 'Gia tốc dọc dốc', value: number(r.acceleration_m_s2), unit: 'm/s²' },
              { label: 'Vận tốc', value: number(r.velocity_m_s), unit: 'm/s' },
              { label: 'Quãng đường', value: number(r.position_m), unit: 'm' },
            ]}
          />
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Điều kiện</h2>
              <span>Mặt phẳng nghiêng</span>
            </div>
            <LabSlider
              label="Góc nghiêng"
              value={p.angle_deg}
              unit="°"
              min={0}
              max={60}
              presets={[10, 20, 30, 45]}
              onChange={angle_deg => engine.setParameters({ angle_deg })}
            />
            <LabSlider
              label="Khối lượng"
              value={p.mass_kg}
              unit="kg"
              min={0.5}
              max={5}
              step={0.1}
              onChange={mass_kg => engine.setParameters({ mass_kg })}
            />
            <LabSlider
              label="Hệ số ma sát nghỉ"
              value={p.static_friction}
              unit=""
              min={0}
              max={1}
              step={0.01}
              presets={[0, 0.25, 0.4, 0.7]}
              onChange={static_friction => engine.setParameters({ static_friction })}
            />
            <p className="content-note">Bài dùng μₖ = 0,8 μₛ. Kéo tay nắm tròn ở đầu dốc để tìm đúng góc bắt đầu trượt.</p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Gia tốc theo góc nghiêng</h2>
              <span>a(α) & ngưỡng trượt</span>
            </div>
            <svg viewBox="0 0 560 225" className="interactive-stage" role="img" aria-label="Đồ thị gia tốc theo góc nghiêng">
              <rect x="6" y="6" width="548" height="213" rx="14" fill="#f4faf7" />
              {criticalDeg > 0 && (
                <rect x="44" y="24" width={Math.min(60, criticalDeg) * 8.2} height="172" fill="#fef3c7" opacity="0.65" />
              )}
              <path d="M44 24v172h492" fill="none" stroke="#6c8f7f" strokeWidth="1.4" />
              {[0, 15, 30, 45, 60].map(deg => (
                <text key={deg} x={44 + deg * 8.2} y="213" textAnchor="middle" fill="#305954" fontSize="10.5">
                  {deg}°
                </text>
              ))}
              <text x="14" y="30" fill="#305954" fontSize="10.5">
                a (m/s²)
              </text>
              <polyline points={curvePoints} fill="none" stroke="#1f7054" strokeWidth="2.4" />
              <circle
                cx={44 + p.angle_deg * 8.2}
                cy={196 - r.acceleration_m_s2 * 16}
                r="5.5"
                fill="#14798f"
                stroke="#fff"
                strokeWidth="1.8"
              />
            </svg>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="inclined-plane"
        formulas={<p>N = mg cos α. Nếu tan α ≤ μₛ thì vật đứng yên. Khi trượt, a = g(sin α − μₖ cos α).</p>}
        columns={['α (°)', 'm (kg)', 'μₛ', 't trên dốc (s)', 'a (m/s²)', 's (m)']}
        rows={state.records.map(row => [
          row.parameters.angle_deg,
          row.parameters.mass_kg,
          row.parameters.static_friction,
          number(row.reading.time_s),
          number(row.reading.acceleration_m_s2),
          number(row.reading.position_m),
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}
