import { lazy, Suspense } from 'react';
import { capacitorReading, parallelCircuitReading } from '@lumilab/lab-engine';
import { useLab } from '../labSession';
import { useSvgDrag } from './useSvgDrag';
import { ExpandedFooter, ExpandedReadings, LabSlider } from './ExpandedLabParts';
import { ChartBoundary } from './AppBoundary';

const Chart = lazy(() => import('./AdditionalCharts').then(m => ({ default: m.AdditionalChart })));

function speedClass(currentA: number) {
  if (currentA >= 0.45) return 'current-fast';
  if (currentA >= 0.18) return 'current-medium';
  return 'current-slow';
}

function NetworkStage({
  parallel,
  closed,
  voltage,
  r1,
  r2,
  iTotal,
  i1,
  i2,
  u1,
  u2,
  onSwitch,
  onToggle,
  onSwap,
}: {
  parallel: boolean;
  closed: boolean;
  voltage: number;
  r1: number;
  r2: number;
  iTotal: number;
  i1: number;
  i2: number;
  u1: number;
  u2: number;
  onSwitch: () => void;
  onToggle: () => void;
  onSwap: () => void;
}) {
  const { drag, start, handlers } = useSvgDrag((key, x, y, moved) => {
    if (key === 'r1' && moved && x > 360 && x < 670 && y > 110 && y < 330) onSwap();
  });

  const active = closed && iTotal > 0;
  const wire = active ? '#1f7054' : '#8aa597';

  return (
    <svg className="interactive-stage" viewBox="0 0 760 440" {...handlers} aria-label="Mạch hai điện trở tương tác">
      <defs>
        <linearGradient id="net-bg" x2="1" y2="1">
          <stop stopColor="#edf6f1" />
          <stop offset="1" stopColor="#e4efe9" />
        </linearGradient>
        <pattern id="net-grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.9" fill="#9bc0ae" opacity="0.45" />
        </pattern>
      </defs>

      <rect x="10" y="5" width="740" height="422" rx="22" fill="url(#net-bg)" />
      <rect x="10" y="5" width="740" height="422" rx="22" fill="url(#net-grid)" />

      {/* Outer circuit loop */}
      <path d="M150 190V95h440v250H150V245" stroke={wire} strokeWidth="5.5" fill="none" strokeLinejoin="round" />
      {active && !parallel && (
        <path
          d="M150 190V95h440v250H150V245"
          stroke="#6ee7b7"
          strokeWidth="3.2"
          strokeDasharray="6 24"
          strokeLinecap="round"
          fill="none"
          className={speedClass(iTotal)}
        />
      )}

      {/* Parallel branch + differential animated currents */}
      {parallel && (
        <>
          <path d="M250 95v135h340" stroke={wire} strokeWidth="5.2" fill="none" strokeLinejoin="round" />
          <circle cx="250" cy="95" r="5.5" fill="#14798f" />
          <circle cx="590" cy="230" r="5.5" fill="#14798f" />
          {active && (
            <>
              {/* Main trunk */}
              <path
                d="M150 190V95h100M590 230v115H150V245"
                stroke="#6ee7b7"
                strokeWidth="3.5"
                strokeDasharray="6 22"
                fill="none"
                className={speedClass(iTotal)}
              />
              {/* Branch 1 */}
              <path
                d="M250 95h340v135"
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="5 22"
                fill="none"
                className={speedClass(i1)}
              />
              {/* Branch 2 */}
              <path
                d="M250 95v135h340"
                stroke="#fbbf24"
                strokeWidth="3"
                strokeDasharray="5 22"
                fill="none"
                className={speedClass(i2)}
              />
            </>
          )}
        </>
      )}

      {/* DC Source */}
      <rect x="122" y="188" width="56" height="58" rx="12" fill="#dff0e7" stroke="#28775c" strokeWidth="2.2" />
      <path d="M134 205h32m-24 14h16m-24 14h32" stroke="#1b4d39" strokeWidth="3.2" strokeLinecap="round" />
      <text x="108" y="274" textAnchor="end" fill="#1b382b" fontSize="14" fontWeight="700">
        U = {voltage.toFixed(1)} V
      </text>
      <text x="108" y="292" textAnchor="end" fill="#0f6275" fontSize="11.5" fontWeight="600">
        I = {iTotal.toFixed(3)} A
      </text>

      {/* Topology Toggle Pill */}
      <g
        role="button"
        tabIndex={0}
        aria-label="Đổi nối tiếp và song song"
        onClick={onToggle}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
        className="svg-button"
      >
        <rect x="275" y="24" width="220" height="38" rx="19" fill="#ffffff" stroke="#14798f" strokeWidth="2.2" />
        <text x="385" y="48" textAnchor="middle" fill="#0f6275" fontSize="13" fontWeight="700">
          Chế độ: {parallel ? 'Mắc song song' : 'Mắc nối tiếp'} ⇄
        </text>
      </g>

      {/* Draggable Resistor R1 */}
      <g
        data-testid="network-r1"
        role="button"
        tabIndex={0}
        aria-label="Điện trở R1: kéo sang R2 để hoán đổi"
        onPointerDown={e => start(e, 'r1')}
        onKeyDown={e => {
          if (e.key === 'Enter') onSwap();
        }}
        className="svg-draggable"
        opacity={drag?.key === 'r1' && drag.moved ? 0.3 : 1}
      >
        <rect x="305" y="76" width="126" height="38" rx="9" fill="#e0f2fe" stroke="#14798f" strokeWidth="2.4" className="tactile-grip" />
        <text x="368" y="100" textAnchor="middle" fill="#0c4a6e" fontSize="13.5" fontWeight="700">
          R₁ = {r1} Ω
        </text>
        <text x="368" y="130" textAnchor="middle" fill="#0f6275" fontSize="11" fontWeight="600">
          I₁ = {i1.toFixed(2)} A · U₁ = {u1.toFixed(1)} V
        </text>
      </g>

      {/* Resistor R2 */}
      <g>
        <rect
          x={parallel ? 382 : 571}
          y={parallel ? 211 : 168}
          width={parallel ? 126 : 38}
          height={parallel ? 38 : 112}
          rx="9"
          fill="#fef3c7"
          stroke="#c97a16"
          strokeWidth="2.4"
        />
        <text
          x={parallel ? 445 : 656}
          y={parallel ? 235 : 218}
          textAnchor="middle"
          fill="#7c4a0a"
          fontSize="13.5"
          fontWeight="700"
        >
          R₂ = {r2} Ω
        </text>
        <text
          x={parallel ? 445 : 656}
          y={parallel ? 265 : 238}
          textAnchor="middle"
          fill="#92540c"
          fontSize="11"
          fontWeight="600"
        >
          I₂ = {i2.toFixed(2)} A · U₂ = {u2.toFixed(1)} V
        </text>
      </g>

      {/* Interactive Switch */}
      <g
        role="button"
        tabIndex={0}
        aria-label={closed ? 'Mở công tắc mạng điện' : 'Đóng công tắc mạng điện'}
        onClick={onSwitch}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSwitch();
          }
        }}
        className="svg-button"
      >
        <rect x="298" y="313" width="130" height="68" rx="12" fill="#ffffffcc" stroke="#b6d0c2" strokeWidth="1.5" />
        <path d="M300 345h25m75 0h25" stroke={wire} strokeWidth="5" />
        <circle cx="325" cy="345" r="6" fill={wire} />
        <circle cx="400" cy="345" r="6" fill={wire} />
        <path d={closed ? 'M325 345h75' : 'M325 345l68-28'} stroke={closed ? '#1f7054' : '#c97a16'} strokeWidth="5" strokeLinecap="round" />
        <text x="363" y="372" textAnchor="middle" fill="#244b38" fontSize="11.5" fontWeight="700">
          {closed ? 'Khóa K đóng (Mạch kín)' : 'Khóa K mở (Mạch hở)'}
        </text>
      </g>

      {drag?.moved && (
        <g pointerEvents="none">
          <rect x={drag.x - 63} y={drag.y - 19} width="126" height="38" rx="9" fill="#bae6fd" stroke="#14798f" strokeWidth="2" opacity=".88" />
        </g>
      )}
    </svg>
  );
}

export function ParallelCircuitLab() {
  const { engine, state } = useLab('parallel-circuit');
  const { parameters: p, reading: r } = state;
  const data = Array.from({ length: 25 }, (_, i) => {
    const voltage_V = i / 2;
    return { x: voltage_V, y: parallelCircuitReading({ ...p, voltage_V }).totalCurrent_A };
  });

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel">
          <div className="panel-title">
            <h2>Hai điện trở: Nối tiếp & Song song</h2>
            <span className="mode-chip">
              <i /> {p.topology === 'parallel' ? 'Phân nhánh dòng (I = I₁ + I₂)' : 'Cùng dòng điện (U = U₁ + U₂)'}
            </span>
          </div>

          <NetworkStage
            parallel={p.topology === 'parallel'}
            closed={p.switchClosed}
            voltage={p.voltage_V}
            r1={p.resistance1_ohm}
            r2={p.resistance2_ohm}
            iTotal={r.totalCurrent_A}
            i1={r.branch1Current_A}
            i2={r.branch2Current_A}
            u1={r.resistor1Voltage_V}
            u2={r.resistor2Voltage_V}
            onSwitch={() => engine.setParameters({ switchClosed: !p.switchClosed })}
            onToggle={() => engine.setParameters({ topology: p.topology === 'series' ? 'parallel' : 'series' })}
            onSwap={() => engine.setParameters({ resistance1_ohm: p.resistance2_ohm, resistance2_ohm: p.resistance1_ohm })}
          />

          <div className="stage-actions">
            <button className="primary-button" onClick={() => engine.setParameters({ switchClosed: !p.switchClosed })}>
              {p.switchClosed ? 'Mở công tắc' : 'Đóng công tắc'}
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
              { label: 'R tương đương', value: r.equivalentResistance_ohm.toFixed(2), unit: 'Ω', testId: 'network-resistance' },
              { label: 'I toàn mạch', value: r.totalCurrent_A.toFixed(3), unit: 'A', testId: 'network-current' },
              { label: 'Dòng qua R₁ / R₂', value: `${r.branch1Current_A.toFixed(3)} / ${r.branch2Current_A.toFixed(3)}`, unit: 'A' },
              { label: 'Công suất P', value: r.totalPower_W.toFixed(2), unit: 'W' },
            ]}
          />
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Thông số</h2>
              <span>Nguồn lý tưởng</span>
            </div>
            <label className="field">
              Cách nối
              <select
                aria-label="Kiểu mạng điện"
                value={p.topology}
                onChange={e => engine.setParameters({ topology: e.target.value as 'series' | 'parallel' })}
              >
                <option value="series">Nối tiếp</option>
                <option value="parallel">Song song</option>
              </select>
            </label>
            <LabSlider
              label="Điện áp mạng"
              unit="V"
              value={p.voltage_V}
              min={0}
              max={12}
              step={0.5}
              presets={[3, 6, 9, 12]}
              onChange={voltage_V => engine.setParameters({ voltage_V })}
            />
            <LabSlider
              label="Điện trở R1"
              unit="Ω"
              value={p.resistance1_ohm}
              min={5}
              max={100}
              presets={[10, 20, 30, 60]}
              onChange={resistance1_ohm => engine.setParameters({ resistance1_ohm })}
            />
            <LabSlider
              label="Điện trở R2"
              unit="Ω"
              value={p.resistance2_ohm}
              min={5}
              max={100}
              presets={[10, 20, 30, 60]}
              onChange={resistance2_ohm => engine.setParameters({ resistance2_ohm })}
            />
            <p className="lab-notice">
              Kéo R₁ thả sang R₂ để hoán đổi nhanh. Sụt áp: U₁ = {r.resistor1Voltage_V.toFixed(2)} V · U₂ = {r.resistor2Voltage_V.toFixed(2)} V.
            </p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Dòng điện theo điện áp</h2>
              <span>I(U)</span>
            </div>
            <ChartBoundary>
              <Suspense fallback={<p>Đang mở đồ thị…</p>}>
                <Chart data={data} xLabel="U (V)" yLabel="I (A)" />
              </Suspense>
            </ChartBoundary>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="parallel-circuit"
        formulas={<p><strong>Rnt = R₁ + R₂ · Rss = R₁R₂/(R₁ + R₂) · I = U/Rtđ</strong></p>}
        columns={['Kiểu', 'U (V)', 'R₁ (Ω)', 'R₂ (Ω)', 'I (A)']}
        rows={state.records.map(row => [
          row.parameters.topology,
          row.parameters.voltage_V,
          row.parameters.resistance1_ohm,
          row.parameters.resistance2_ohm,
          row.reading.totalCurrent_A.toFixed(3),
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}

export function CapacitorLab() {
  const { engine, state } = useLab('capacitor');
  const { parameters: p, reading: r } = state;
  const horizon = Math.min(120, Math.max(0.05, r.timeConstant_s * 5));
  const data = Array.from({ length: 81 }, (_, i) => ({
    x: (i * horizon) / 80,
    y: capacitorReading(p, (i * horizon) / 80).capacitorVoltage_V,
  }));

  const { drag, start, handlers } = useSvgDrag((key, x, y, moved) => {
    if (key === 'capacitor' && moved && x > 480 && x < 670 && y > 130 && y < 300) {
      engine.setParameters({ capacitance_uF: Math.min(1000, p.capacitance_uF + 100) });
    }
  });

  const chargeRatio = p.voltage_V > 0 ? Math.min(1, Math.max(0, r.capacitorVoltage_V / p.voltage_V)) : 0;
  const chargeCount = Math.round(chargeRatio * 5);
  const absCurrentMa = Math.abs(r.current_A * 1000);
  const flowing = state.phase === 'running' && absCurrentMa > 0.02;

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel">
          <div className="panel-title">
            <h2>{p.mode === 'charge' ? 'Nạp tụ điện' : 'Phóng điện tụ'} qua điện trở R</h2>
            <span className="mode-chip">
              <i /> t = {state.elapsed_s.toFixed(2)} s · τ = {r.timeConstant_s.toFixed(2)} s
            </span>
          </div>

          <svg className="interactive-stage" viewBox="0 0 760 440" {...handlers} aria-label="Mạch RC tương tác">
            <defs>
              <linearGradient id="rc-bg" x2="1" y2="1">
                <stop stopColor="#edf6f1" />
                <stop offset="1" stopColor="#e4efe9" />
              </linearGradient>
              <pattern id="rc-grid" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="0.9" fill="#9bc0ae" opacity="0.45" />
              </pattern>
            </defs>

            <rect x="10" y="5" width="740" height="422" rx="22" fill="url(#rc-bg)" />
            <rect x="10" y="5" width="740" height="422" rx="22" fill="url(#rc-grid)" />

            {/* RC Loop */}
            <path d="M150 195V100h450v90m0 50v100H150V245" fill="none" stroke="#286d55" strokeWidth="5.2" strokeLinejoin="round" />
            {flowing && (
              <path
                d="M150 195V100h450v90m0 50v100H150V245"
                fill="none"
                stroke={p.mode === 'charge' ? '#38bdf8' : '#fbbf24'}
                strokeWidth="3.2"
                strokeDasharray="6 22"
                className={p.mode === 'charge' ? 'current-fast' : 'current-reverse'}
                opacity={Math.min(1, 0.25 + absCurrentMa / 3)}
              />
            )}

            {/* Resistor R */}
            <rect x="315" y="82" width="120" height="36" rx="8" fill="#fef3c7" stroke="#c97a16" strokeWidth="2.2" />
            <text x="375" y="105" textAnchor="middle" fontSize="13" fontWeight="700" fill="#7c4a0a">
              R = {p.resistance_ohm} Ω
            </text>

            {/* Source or Discharge Bypass */}
            {p.mode === 'charge' ? (
              <g data-testid="rc-connected-source">
                <path d="M150 195v15m0 25v10M127 210h46M137 235h26" fill="none" stroke="#1f7054" strokeWidth="5" strokeLinecap="round" />
              </g>
            ) : (
              <path data-testid="rc-source-bypass" d="M150 195v50" stroke="#14798f" strokeWidth="5" />
            )}
            <text x="150" y="276" textAnchor="middle" fontSize="13" fontWeight="700" fill="#1b382b">
              {p.mode === 'charge' ? `Nguồn ${p.voltage_V} V` : 'Dây nối tắt (Xả)'}
            </text>

            {/* Interactive Capacitor Plates with + / - Charges & Electric Field */}
            <g
              role="button"
              tabIndex={0}
              className="svg-draggable"
              aria-label="Đổi chế độ nạp xả"
              onClick={() => engine.setParameters({ mode: p.mode === 'charge' ? 'discharge' : 'charge' })}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  engine.setParameters({ mode: p.mode === 'charge' ? 'discharge' : 'charge' });
                }
              }}
            >
              <rect x="506" y="168" width="188" height="108" rx="16" fill="#ffffffd9" stroke="#14798f" strokeWidth="2.2" className="tactile-grip" />
              <path d="M600 168v38m0 32v38" stroke="#286d55" strokeWidth="5" />
              {/* Plates */}
              <path d="M556 206h88" stroke="#dc2626" strokeWidth="7" strokeLinecap="round" />
              <path d="M556 238h88" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" />

              {/* Electric field arrows & +/- symbols proportional to capacitor voltage */}
              {Array.from({ length: chargeCount }).map((_, idx) => {
                const cx = 566 + idx * 17;
                return (
                  <g key={idx}>
                    <text x={cx} y="199" textAnchor="middle" fontSize="11" fontWeight="700" fill="#dc2626">
                      +
                    </text>
                    <line x1={cx} y1="211" x2={cx} y2="232" stroke="#14798f" strokeWidth="1.3" strokeDasharray="2 2" opacity={0.35 + chargeRatio * 0.6} />
                    <text x={cx} y="252" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0284c7">
                      −
                    </text>
                  </g>
                );
              })}

              <text x="600" y="295" textAnchor="middle" fill="#1b382b" fontSize="13.5" fontWeight="700">
                C = {p.capacitance_uF} µF ({p.mode === 'charge' ? 'Nạp ⇄' : 'Xả ⇄'})
              </text>
            </g>

            {/* Center Digital Meter + Charge Fill Bar */}
            <g transform="translate(274 162)">
              <rect width="186" height="118" rx="15" fill="#ffffffeb" stroke="#c5ddd0" strokeWidth="1.8" />
              <text x="93" y="24" textAnchor="middle" fill="#486857" fontSize="11" fontWeight="700">
                Điện áp bản tụ Uc
              </text>
              <text x="93" y="54" textAnchor="middle" fill="#1b382b" fontSize="24" fontWeight="700">
                {r.capacitorVoltage_V.toFixed(3)} V
              </text>
              <rect x="18" y="68" width="150" height="10" rx="5" fill="#e2ece6" />
              <rect x="18" y="68" width={150 * chargeRatio} height="10" rx="5" fill="#14798f" />
              <text x="18" y="96" fill="#0f6275" fontSize="10.5" fontWeight="600">
                {(chargeRatio * 100).toFixed(0)}% U₀
              </text>
              <text x="168" y="96" textAnchor="end" fill="#8a520d" fontSize="10.5" fontWeight="600">
                q = {(r.charge_C * 1000).toFixed(2)} mC
              </text>
            </g>

            {/* Draggable +100 uF Spare Capacitor */}
            <g
              data-testid="rc-spare"
              role="button"
              tabIndex={0}
              className="svg-draggable"
              aria-label="Thêm 100 microfarad"
              onPointerDown={e => start(e, 'capacitor')}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  engine.setParameters({ capacitance_uF: Math.min(1000, p.capacitance_uF + 100) });
                }
              }}
            >
              <rect x="64" y="362" width="142" height="42" rx="10" fill="#fffaf0" stroke="#c97a16" strokeWidth="2" />
              <text x="135" y="381" textAnchor="middle" fill="#7c4a0a" fontSize="12" fontWeight="700">
                ＋ Tụ phụ 100 µF
              </text>
              <text x="135" y="396" textAnchor="middle" fill="#9a6418" fontSize="10">
                Kéo thả vào tụ C
              </text>
            </g>

            {drag?.moved && (
              <rect x={drag.x - 45} y={drag.y - 20} width="90" height="40" rx="8" fill="#bae6fd" stroke="#14798f" strokeWidth="2" opacity=".88" pointerEvents="none" />
            )}
          </svg>

          <div className="stage-actions">
            <button className="primary-button" onClick={() => (state.phase === 'running' ? engine.pause() : engine.run())}>
              {state.phase === 'running' ? 'Ⅱ Tạm dừng' : '▶ Bắt đầu'}
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
              { label: 'Điện áp tụ', value: r.capacitorVoltage_V.toFixed(3), unit: 'V', testId: 'rc-voltage' },
              { label: 'Hằng số τ', value: r.timeConstant_s.toFixed(3), unit: 's' },
              { label: 'Dòng điện', value: (r.current_A * 1000).toFixed(3), unit: 'mA' },
              { label: 'Năng lượng W', value: (r.energy_J * 1000).toFixed(2), unit: 'mJ' },
            ]}
          />
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Thông số</h2>
              <span>Tụ lý tưởng</span>
            </div>
            <label className="field">
              Chế độ
              <select
                aria-label="Chế độ tụ điện"
                value={p.mode}
                onChange={e => engine.setParameters({ mode: e.target.value as 'charge' | 'discharge' })}
              >
                <option value="charge">Nạp từ tụ chưa tích điện</option>
                <option value="discharge">Xả từ U ban đầu</option>
              </select>
            </label>
            <LabSlider
              label="Điện áp ban đầu/nguồn"
              unit="V"
              min={0}
              max={12}
              step={0.5}
              presets={[3, 6, 9, 12]}
              onChange={voltage_V => engine.setParameters({ voltage_V })}
              value={p.voltage_V}
            />
            <LabSlider
              label="Điện trở RC"
              unit="Ω"
              min={100}
              max={10000}
              step={100}
              presets={[1000, 2000, 5000, 8000]}
              value={p.resistance_ohm}
              onChange={resistance_ohm => engine.setParameters({ resistance_ohm })}
            />
            <LabSlider
              label="Điện dung"
              unit="µF"
              min={10}
              max={1000}
              step={10}
              presets={[100, 250, 500, 1000]}
              value={p.capacitance_uF}
              onChange={capacitance_uF => engine.setParameters({ capacitance_uF })}
            />
            <p className="lab-notice">Kéo tụ phụ 100 µF vào tụ C để ghép song song tăng điện dung. Đổi thông số đưa đồng hồ về t = 0.</p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Điện áp theo thời gian</h2>
              <span>Uc(t)</span>
            </div>
            <ChartBoundary>
              <Suspense fallback={<p>Đang mở đồ thị…</p>}>
                <Chart data={data} xLabel="t (s)" yLabel="Uc (V)" />
              </Suspense>
            </ChartBoundary>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="capacitor"
        formulas={<p><strong>τ = RC · Nạp: Uc = U(1 − e⁻ᵗ/τ) · Xả: Uc = Ue⁻ᵗ/τ · W = ½CUc²</strong></p>}
        columns={['t (s)', 'Chế độ', 'Uc (V)', 'I (mA)']}
        rows={state.records.map(row => [
          row.elapsed_s.toFixed(3),
          row.parameters.mode,
          row.reading.capacitorVoltage_V.toFixed(3),
          (row.reading.current_A * 1000).toFixed(3),
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}
