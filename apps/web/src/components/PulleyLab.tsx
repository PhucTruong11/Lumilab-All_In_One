import { useState } from 'react';
import type { PulleyParameters } from '@lumilab/lab-engine';
import { useLab } from '../labSession';
import { useSvgDrag } from './useSvgDrag';
import { ExpandedFooter, LabSlider } from './ExpandedLabParts';

export function PulleyLab() {
  const { engine, state } = useLab('pulley');
  const { parameters: params, reading } = state;
  const n = params.strands;
  const pulleyType = n === 1 ? 'fixed' : n === 4 ? 'palang_4' : 'single_movable';
  const [lowered, setLowered] = useState(false);

  const update = (key: keyof PulleyParameters, value: number) => {
    engine.setParameters({ [key]: value });
    if (key === 'lift_m') setLowered(false);
  };

  const { drag, start, handlers } = useSvgDrag((key, _x, y, moved) => {
    if (!moved) return;
    if (key === 'load') {
      update('lift_m', Math.max(0, Math.min(2, Math.round(((280 - (y - 35)) / 85) * 100) / 100)));
    } else if (key === 'dyno') {
      update('lift_m', Math.max(0, Math.min(2, Math.round(((y - 200) / 75) * 100) / 100)));
    }
  });

  const activeLift = lowered ? 0 : params.lift_m;
  const loadY = drag?.key === 'load' && drag.moved ? Math.max(110, Math.min(280, drag.y - 35)) : 280 - activeLift * 85;
  const pullX = n === 1 ? 416 : n === 2 ? 512 : 532;
  const pullY = drag?.key === 'dyno' && drag.moved ? Math.max(155, Math.min(340, drag.y - 35)) : 165 + activeLift * 75;

  const forceRatio = Math.min(1, reading.pull_N / Math.max(1, reading.weight_N));
  const ropeRatio = Math.min(1, reading.rope_m / 8);

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel" aria-label="Bàn thí nghiệm ròng rọc">
          <div className="panel-title">
            <h2>Hệ thống ròng rọc & Pa-lăng</h2>
            <span className="mode-chip">
              <i /> {n === 1 ? 'Đổi hướng lực (n = 1)' : `Lợi ${n} lần về lực · Thiệt ${n} lần đường đi`}
            </span>
          </div>

          <svg
            className="interactive-stage"
            {...handlers}
            viewBox="0 0 760 460"
            aria-label="Minh họa hệ thống ròng rọc kéo tải"
          >
            <defs>
              <linearGradient id="pulley-bg" x2="1" y2="1">
                <stop stopColor="#edf6f1" />
                <stop offset="1" stopColor="#e4efe9" />
              </linearGradient>
              <linearGradient id="weight-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2c7056" />
                <stop offset="100%" stopColor="#194233" />
              </linearGradient>
            </defs>

            <rect x="10" y="5" width="740" height="442" rx="22" fill="url(#pulley-bg)" />

            {/* Floor reference */}
            <path d="M90 364h580" stroke="#9ab8a8" strokeWidth="4" strokeLinecap="round" />
            <text x="655" y="382" textAnchor="end" fill="#4e6e5d" fontSize="11" fontWeight="600">
              Mốc h = 0 m
            </text>

            {/* Ceiling beam */}
            <rect x="175" y="28" width="420" height="16" rx="5" fill="#506c5e" />
            {[210, 270, 330, 390, 450, 510, 560].map(bx => (
              <line key={bx} x1={bx} y1="28" x2={bx - 16} y2="16" stroke="#789686" strokeWidth="2.8" />
            ))}

            {/* Rigging & Sheaves by mechanism */}
            {pulleyType === 'fixed' && (
              <>
                <line x1="344" y1="76" x2="344" y2={loadY} stroke="#b07d3c" strokeWidth="5" />
                <line x1="416" y1="76" x2="416" y2={pullY} stroke="#b07d3c" strokeWidth="5" />
                <g transform="translate(380 76)">
                  <rect x="-6" y="-32" width="12" height="32" fill="#688476" />
                  <circle r="36" fill="#d8e8df" stroke="#3c6652" strokeWidth="4" />
                  <circle r="12" fill="#fff" stroke="#3c6652" strokeWidth="3" />
                  <circle r="4" fill="#1f4232" />
                </g>
              </>
            )}

            {pulleyType === 'single_movable' && (
              <>
                {/* 2 supporting strands + pull strand */}
                <circle cx="344" cy="46" r="5" fill="#355244" />
                <path
                  d={`M344 46V${loadY - 45}a36 36 0 0 0 72 0V76a32 32 0 0 1 64 0`}
                  fill="none"
                  stroke="#b07d3c"
                  strokeWidth="5"
                />
                <line x1="512" y1="76" x2="512" y2={pullY} stroke="#b07d3c" strokeWidth="5" />

                {/* Ceiling guide pulley */}
                <g transform="translate(480 76)">
                  <rect x="-6" y="-32" width="12" height="32" fill="#688476" />
                  <circle r="32" fill="#d8e8df" stroke="#3c6652" strokeWidth="4" />
                  <circle r="10" fill="#fff" stroke="#3c6652" strokeWidth="3" />
                </g>

                {/* Movable pulley attached to load */}
                <g transform={`translate(380 ${loadY - 45})`}>
                  <circle r="36" fill="#cde3d6" stroke="#1f7054" strokeWidth="4" />
                  <circle r="12" fill="#fff" stroke="#1f7054" strokeWidth="3" />
                  <path d="M-6 0v45h12V0" fill="#466859" />
                </g>
              </>
            )}

            {pulleyType === 'palang_4' && (
              <>
                {/* 4 supporting strands between double-sheave upper & lower blocks + pull strand */}
                <line x1="342" y1="80" x2="342" y2={loadY - 48} stroke="#b07d3c" strokeWidth="4.4" />
                <line x1="360" y1="80" x2="360" y2={loadY - 48} stroke="#c5924f" strokeWidth="4.4" />
                <line x1="400" y1="80" x2="400" y2={loadY - 48} stroke="#c5924f" strokeWidth="4.4" />
                <line x1="418" y1="80" x2="418" y2={loadY - 48} stroke="#b07d3c" strokeWidth="4.4" />
                <line x1="418" y1="52" x2="500" y2="52" stroke="#b07d3c" strokeWidth="4.4" />
                <line x1="532" y1="78" x2="532" y2={pullY} stroke="#b07d3c" strokeWidth="4.8" />

                {/* Upper double-sheave fixed block */}
                <g transform="translate(380 80)">
                  <rect x="-8" y="-36" width="16" height="36" fill="#5d7a6c" />
                  <circle r="38" fill="#d8e8df" stroke="#3c6652" strokeWidth="3.8" />
                  <circle r="21" fill="#eef6f2" stroke="#14798f" strokeWidth="3.2" />
                  <circle r="6" fill="#1f4232" />
                </g>

                {/* Guide pulley */}
                <g transform="translate(500 78)">
                  <rect x="-5" y="-34" width="10" height="34" fill="#688476" />
                  <circle r="32" fill="#d8e8df" stroke="#3c6652" strokeWidth="3.8" />
                  <circle r="10" fill="#fff" stroke="#3c6652" strokeWidth="2.8" />
                </g>

                {/* Lower double-sheave movable block */}
                <g transform={`translate(380 ${loadY - 48})`}>
                  <circle r="38" fill="#cde3d6" stroke="#1f7054" strokeWidth="3.8" />
                  <circle r="21" fill="#e6f4ec" stroke="#14798f" strokeWidth="3.2" />
                  <path d="M-6 0v48h12V0" fill="#466859" />
                </g>
              </>
            )}

            {/* Strand count badge */}
            <g transform="translate(232 62)">
              <rect x="-54" y="-15" width="108" height="28" rx="14" fill="#ffffffeb" stroke="#bdd5c8" />
              <text y="3" textAnchor="middle" fill="#1f5d44" fontSize="11.5" fontWeight="700">
                n = {n} nhánh dây
              </text>
            </g>

            {/* Draggable Load Mass */}
            <g
              transform={`translate(380 ${loadY})`}
              className="svg-draggable"
              role="button"
              tabIndex={0}
              aria-label="Tải ròng rọc: kéo để đổi độ cao"
              data-testid="pulley-load"
              onPointerDown={e => start(e, 'load')}
              onKeyDown={e => {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  update(
                    'lift_m',
                    Math.max(0, Math.min(2, Number((params.lift_m + (e.key === 'ArrowUp' ? 0.05 : -0.05)).toFixed(2))))
                  );
                }
              }}
            >
              <rect
                x="-48"
                y="0"
                width="96"
                height="75"
                rx="13"
                fill="url(#weight-grad)"
                stroke="#143326"
                strokeWidth="2"
              />
              <path d="M-18 0q18-22 36 0" fill="none" stroke="#cfdfd6" strokeWidth="4.5" />
              <circle cx="34" cy="16" r="6" fill="#fff" stroke="#14798f" strokeWidth="2" className="tactile-grip" />
              <text x="0" y="34" textAnchor="middle" fill="#ffffff" fontSize="15.5" fontWeight="700">
                {params.mass_kg.toFixed(1)} kg
              </text>
              <text x="0" y="54" textAnchor="middle" fill="#b7e4ce" fontSize="11.5" fontWeight="600">
                P = {reading.weight_N.toFixed(1)} N
              </text>
              <text x="0" y="68" textAnchor="middle" fill="#d1fae5" fontSize="10">
                h = {activeLift.toFixed(2)} m
              </text>
            </g>

            {/* Draggable Dynamometer (Lực kế kéo tay) */}
            <g
              transform={`translate(${pullX} ${pullY})`}
              className="svg-draggable"
              role="button"
              tabIndex={0}
              aria-label="Lực kế ròng rọc: kéo xuống để nâng tải"
              data-testid="pulley-dynamometer"
              onPointerDown={e => start(e, 'dyno')}
              onKeyDown={e => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  update(
                    'lift_m',
                    Math.max(0, Math.min(2, Number((params.lift_m + (e.key === 'ArrowDown' ? 0.05 : -0.05)).toFixed(2))))
                  );
                }
              }}
            >
              <rect x="-18" y="0" width="36" height="74" rx="9" fill="#fef3c7" stroke="#c97a16" strokeWidth="2.2" className="tactile-grip" />
              <line x1="0" y1="12" x2="0" y2="58" stroke="#b45309" strokeWidth="2.8" />
              <circle cx="0" cy={18 + forceRatio * 34} r="5.5" fill="#dc2626" />
              <path d="M-10 74q10 14 20 0" fill="none" stroke="#92400e" strokeWidth="3" />
              <text x="26" y="28" fill="#7c4a0a" fontSize="13" fontWeight="700">
                F = {reading.pull_N.toFixed(1)} N
              </text>
              <text x="26" y="45" fill="#0f6275" fontSize="11" fontWeight="600">
                s = {reading.rope_m.toFixed(2)} m dây
              </text>
              <text x="26" y="61" fill="#92540c" fontSize="10.5">
                (Kéo lực kế ↓)
              </text>
            </g>

            {/* Height Ruler h (0..2 m) */}
            <g transform="translate(136 185)">
              <line x1="0" y1="0" x2="0" y2="170" stroke="#5e8270" strokeWidth="3" />
              {[0, 0.5, 1.0, 1.5, 2.0].map(m => (
                <g key={m} transform={`translate(0 ${170 - m * 85})`}>
                  <line x1="-8" y1="0" x2="8" y2="0" stroke="#5e8270" strokeWidth="2" />
                  <text x="-14" y="4" textAnchor="end" fontSize="11" fill="#3b5e4c" fontWeight="600">
                    {m.toFixed(1)} m
                  </text>
                </g>
              ))}
              {/* Live height pointer */}
              <path
                d={`M12 ${170 - activeLift * 85}l10 -5v10z`}
                fill="#14798f"
              />
            </g>
          </svg>

          <div className="stage-actions">
            <button className="record-button" onClick={() => engine.record()}>
              Ghi số đo
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => setLowered(prev => !prev)}
            >
              {lowered ? '▲ Kéo nâng tải trọng lên' : '▼ Hạ tải về mốc h = 0'}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                engine.reset();
                setLowered(false);
              }}
            >
              ↺ Đặt lại mặc định
            </button>
          </div>

          <div className="readings readings-expanded" aria-label="Kết quả đo ròng rọc">
            <div>
              <span>Trọng lượng tải P</span>
              <strong>
                {reading.weight_N.toFixed(1)} <small>N</small>
              </strong>
            </div>
            <div>
              <span>Lực kéo F cần tác dụng</span>
              <strong data-testid="pulley-force" style={{ color: '#1f7054' }}>
                {Number(reading.pull_N.toFixed(3))} <small>N</small>
              </strong>
            </div>
            <div>
              <span>Đoạn dây phải kéo (s)</span>
              <strong>
                {reading.rope_m.toFixed(2)} <small>m</small>
              </strong>
            </div>
            <div>
              <span>Công thực hiện A</span>
              <strong>
                {reading.work_J.toFixed(1)} <small>J</small>
              </strong>
            </div>
          </div>
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Cấu hình ròng rọc</h2>
              <span>SGK Vật lí 10</span>
            </div>

            <fieldset className="materials" style={{ flexDirection: 'column', gap: '8px' }}>
              <legend>Loại cơ cấu</legend>
              {[
                ['fixed', '1. Ròng rọc cố định (n = 1)'],
                ['single_movable', '2. Ròng rọc động (n = 2 nhánh)'],
                ['palang_4', '3. Pa-lăng (n = 4 nhánh dây)'],
              ].map(([type, label]) => (
                <button
                  key={type}
                  type="button"
                  aria-pressed={pulleyType === type}
                  onClick={() => update('strands', type === 'fixed' ? 1 : type === 'palang_4' ? 4 : 2)}
                  style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
                >
                  {label}
                </button>
              ))}
            </fieldset>

            <LabSlider
              label="Khối lượng tải m"
              unit="kg"
              min={1}
              max={20}
              step={0.5}
              value={params.mass_kg}
              onChange={value => update('mass_kg', value)}
            />
            <LabSlider
              label="Độ cao cần nâng h"
              unit="m"
              min={0}
              max={2}
              step={0.05}
              value={params.lift_m}
              onChange={value => update('lift_m', value)}
            />
            <p className="lab-notice">
              Kéo trực tiếp khối tải hoặc kéo lực kế xuống để nâng tải; cũng có thể chọn tải/lực kế rồi bấm phím mũi tên.
            </p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Định luật về công</h2>
              <span>A = F · s = P · h</span>
            </div>

            <svg viewBox="0 0 320 156" role="img" aria-label="Biểu đồ đánh đổi lực kéo và quãng đường dây">
              <text x="12" y="20" fill="#244b38" fontSize="11.5" fontWeight="700">
                Lực kéo F so với trọng lượng P
              </text>
              <rect x="12" y="28" width="220" height="12" rx="6" fill="#dcebe2" />
              <rect x="12" y="28" width={220 * forceRatio} height="12" rx="6" fill="#1f7054" />
              <text x="240" y="38" fill="#1f7054" fontSize="11" fontWeight="700">
                {(forceRatio * 100).toFixed(0)}% P
              </text>

              <text x="12" y="68" fill="#244b38" fontSize="11.5" fontWeight="700">
                Quãng dây kéo s = {n}·h (tối đa 8 m)
              </text>
              <rect x="12" y="76" width="220" height="12" rx="6" fill="#e0f2fe" />
              <rect x="12" y="76" width={220 * ropeRatio} height="12" rx="6" fill="#14798f" />
              <text x="240" y="86" fill="#0f6275" fontSize="11" fontWeight="700">
                {reading.rope_m.toFixed(2)} m
              </text>

              <rect x="12" y="106" width="296" height="40" rx="10" fill="#f2f9f5" stroke="#c8ddd1" />
              <text x="24" y="124" fill="#1b382b" fontSize="11.5" fontWeight="700">
                ⚖ Bảo toàn công lý tưởng: A = {reading.work_J.toFixed(1)} J
              </text>
              <text x="24" y="139" fill="#4c6b5b" fontSize="10.5">
                Lợi bao nhiêu lần về lực thì thiệt bấy nhiêu lần về đường đi.
              </text>
            </svg>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="pulley"
        formulas={<p>F = P/n; s = n·h; A = P·h, bỏ qua ma sát.</p>}
        columns={['Khối lượng (kg)', 'Số nhánh đỡ', 'Độ cao (m)', 'Lực kéo (N)', 'Quãng dây (m)']}
        rows={state.records.map(row => [
          row.parameters.mass_kg,
          row.parameters.strands,
          row.parameters.lift_m,
          Number(row.reading.pull_N.toFixed(3)),
          Number(row.reading.rope_m.toFixed(3)),
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}
