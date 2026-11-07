import { useState } from 'react';
import { defaultHno3, hno3Reading, type Hno3Concentration, type Hno3Parameters } from '@lumilab/lab-engine';

export function Hno3Lab() {
  const [params, setParams] = useState<Hno3Parameters>(defaultHno3);
  const [hasStarted, setHasStarted] = useState(false);
  const reading = hno3Reading(params);

  const update = (key: keyof Hno3Parameters, value: unknown) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="workbench-grid interactive-lab">
      <section className="stage-panel" aria-label="Bàn thí nghiệm axit nitric">
        <div className="panel-title">
          <h2>Kim loại Cu tác dụng với axit Nitric (HNO₃)</h2>
          <span className="mode-chip">
            <i /> {params.concentration === 'dilute' ? 'Axit loãng (sinh NO)' : 'Axit đặc (sinh NO₂)'}
          </span>
        </div>

        <svg
          className="interactive-stage"
          viewBox="0 0 760 460"
          aria-label="Minh họa phản ứng Cu với HNO3"
        >
          <defs>
            <linearGradient id="hno3-stage-bg" x2="1" y2="1">
              <stop stopColor="#f8fbf9" />
              <stop offset="1" stopColor="#edf3f0" />
            </linearGradient>
            <linearGradient id="gas-brown-grad" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#b45309" stopOpacity={hasStarted ? '0.2' : '0'} />
              <stop offset="60%" stopColor="#b45309" stopOpacity={hasStarted ? '0.75' : '0'} />
              <stop offset="100%" stopColor="#78350f" stopOpacity={hasStarted ? '0.9' : '0'} />
            </linearGradient>
            <linearGradient id="copper-liquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hasStarted ? '#38bdf8' : '#e0f2fe'} />
              <stop offset="100%" stopColor={hasStarted ? (params.concentration === 'dilute' ? '#0284c7' : '#047857') : '#bae6fd'} />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect x="10" y="5" width="740" height="442" rx="22" fill="url(#hno3-stage-bg)" />

          {/* Bàn thí nghiệm và giá đỡ */}
          <path d="M120 400h520" stroke="#bccdc3" strokeWidth="6" />
          <rect x="260" y="100" width="16" height="300" fill="#697f73" />
          <rect x="220" y="390" width="96" height="15" rx="3" fill="#4a5c53" />
          <rect x="270" y="150" width="75" height="12" rx="3" fill="#697f73" />
          <rect x="270" y="270" width="75" height="12" rx="3" fill="#697f73" />

          {/* Ống nghiệm thủy tinh */}
          <g transform="translate(345 80)">
            {/* Khí NO2 bốc lên từ ống nghiệm */}
            <path
              d="M-22 60v-90q0-20 22-20q22 0 22 20v90"
              fill="url(#gas-brown-grad)"
            />

            {/* Thân ống nghiệm */}
            <path
              d="M-24 0v240q0 24 24 24q24 0 24-24V0"
              fill="#ffffff40"
              stroke="#779686"
              strokeWidth="4"
            />
            {/* Dung dịch trong ống nghiệm */}
            <path
              d="M-22 130v110q0 22 22 22q22 0 22-22V130"
              fill="url(#copper-liquid)"
              opacity="0.85"
            />

            {/* Mẩu phoi đồng (Cu) dưới đáy */}
            <rect x="-14" y="235" width="28" height="14" rx="3" fill="#c27d4c" stroke="#8c4e23" strokeWidth="2" />

            {/* Bọt khí sủi lên khi phản ứng */}
            {hasStarted && (
              <g>
                <circle cx="-6" cy="210" r="4" fill="#ffffff" opacity="0.9" />
                <circle cx="8" cy="190" r="5" fill="#ffffff" opacity="0.9" />
                <circle cx="-4" cy="160" r="6" fill="#ffffff" opacity="0.9" />
                <circle cx="6" cy="140" r="5" fill="#ffffff" opacity="0.8" />
              </g>
            )}

            {/* Nắp bông gòn tẩm kiềm ở miệng ống nghiệm để chắn khí độc */}
            <ellipse cx="0" cy="5" rx="23" ry="10" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="2" />
            <text x="35" y="10" fontSize="11" fill="#64748b">
              Bông tẩm xút (chắn khí độc)
            </text>
          </g>

          {/* Chú thích màu khí */}
          {hasStarted && (
            <g transform="translate(430 110)">
              <rect x="0" y="0" width="280" height="95" rx="10" fill="#ffffffd0" stroke="#d5ab82" strokeWidth="1.5" />
              <text x="14" y="26" fill="#92400e" fontSize="13" fontWeight="bold">
                {params.concentration === 'dilute'
                  ? 'Khí ban đầu: NO (không màu)'
                  : 'Khí thoát ra: NO₂ (nâu đỏ đậm)'}
              </text>
              <text x="14" y="48" fill="#78350f" fontSize="12">
                {params.concentration === 'dilute'
                  ? 'Gặp O₂ không khí: 2NO + O₂ → 2NO₂ (hóa nâu)'
                  : 'NO₂ là khí độc, mùi hắc, độc hại hô hấp'}
              </text>
              <text x="14" y="74" fill="#0369a1" fontSize="12" fontWeight="600">
                Màu dung dịch: {reading.solutionColor}
              </text>
            </g>
          )}
        </svg>

        <div className="stage-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => setHasStarted(!hasStarted)}
          >
            {hasStarted ? '↺ Dừng & Thay đổi điều kiện' : '▶ Nhỏ dung dịch axit HNO₃ vào mẩu Cu'}
          </button>
        </div>

        <div className="readings readings-expanded" aria-label="Kết quả đo phản ứng HNO3">
          <div>
            <span>Khí sinh ra</span>
            <strong style={{ color: '#b45309' }}>{reading.gasType}</strong>
          </div>
          <div>
            <span>Thể tích khí lý thuyết (đkc)</span>
            <strong>{reading.gasVolume_ml.toFixed(1)} <small>mL</small></strong>
          </div>
          <div>
            <span>Màu sắc khí quan sát</span>
            <strong style={{ color: '#b45309' }}>{reading.finalGasColor}</strong>
          </div>
          <div>
            <span>Dung dịch muối Cu²⁺</span>
            <strong style={{ color: '#0284c7' }}>Xanh lam</strong>
          </div>
        </div>
      </section>

      <aside className="experiment-sidebar">
        <section className="parameter-panel">
          <div className="panel-title">
            <h2>Nồng độ & Lượng chất</h2>
            <span>SGK Hóa học 11</span>
          </div>

          <fieldset className="materials">
            <legend>Nồng độ axit nitric (HNO₃)</legend>
            {[
              ['dilute', '1. Axit HNO₃ loãng (~2M - 4M)'],
              ['concentrated', '2. Axit HNO₃ đặc (~68%)'],
            ].map(([concKey, label]) => (
              <button
                key={concKey}
                type="button"
                aria-pressed={params.concentration === concKey}
                onClick={() => {
                  update('concentration', concKey as Hno3Concentration);
                  setHasStarted(false);
                }}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                {label}
              </button>
            ))}
          </fieldset>

          <label className="parameter" style={{ marginTop: '18px' }}>
            <span>
              Khối lượng mẩu đồng Cu <output>{params.copperMass_g.toFixed(2)} g</output>
            </span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              value={params.copperMass_g}
              onChange={e => update('copperMass_g', Number(e.target.value))}
            />
          </label>

          <div style={{ marginTop: '16px', padding: '12px', background: '#fefce8', borderRadius: '10px', fontSize: '13px', color: '#854d0e' }}>
            <strong>Phương trình phản ứng:</strong>
            <p style={{ marginTop: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>{reading.equation}</p>
            {reading.airOxidationEquation && (
              <p style={{ marginTop: '6px', fontSize: '12px', color: '#b45309' }}>
                ↳ {reading.airOxidationEquation}
              </p>
            )}
          </div>
        </section>

        <section className="chart-panel">
          <div className="panel-title">
            <h2>Giải thích hiện tượng SGK</h2>
            <span>Chân trời sáng tạo / KNTT</span>
          </div>
          <div style={{ padding: '14px', background: '#f8faf9', borderRadius: '12px', fontSize: '12.5px', lineHeight: '1.6', color: '#2d4b3b' }}>
            <p>{reading.phenomenon}</p>
          </div>
        </section>
      </aside>
    </div>
  );
}
