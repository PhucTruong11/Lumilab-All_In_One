import { useState } from 'react';
import { defaultPulley, pulleyReading, type PulleyParameters, type PulleyType } from '@lumilab/lab-engine';

export function PulleyLab() {
  const [params, setParams] = useState<PulleyParameters>(defaultPulley);
  const reading = pulleyReading(params);
  const [isLifting, setIsLifting] = useState(false);

  const update = (key: keyof PulleyParameters, value: unknown) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const n = reading.mechanicalAdvantage;
  const loadY = isLifting ? 210 - params.liftHeight_m * 50 : 280;
  const pullY = isLifting ? 310 + params.liftHeight_m * 50 * (n === 1 ? -1 : 1) : 220;

  return (
    <div className="workbench-grid interactive-lab">
      <section className="stage-panel" aria-label="Bàn thí nghiệm ròng rọc">
        <div className="panel-title">
          <h2>Hệ thống ròng rọc & Pa-lăng</h2>
          <span className="mode-chip">
            <i /> Lực & Độ cao nâng (g = 9,81 m/s²)
          </span>
        </div>

        <svg
          className="interactive-stage"
          viewBox="0 0 760 460"
          aria-label="Minh họa hệ thống ròng rọc kéo tải"
        >
          <defs>
            <linearGradient id="pulley-bg" x2="1" y2="1">
              <stop stopColor="#f3f7f5" />
              <stop offset="1" stopColor="#eaf1ed" />
            </linearGradient>
            <linearGradient id="weight-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#436655" />
              <stop offset="100%" stopColor="#254234" />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect x="10" y="5" width="740" height="442" rx="22" fill="url(#pulley-bg)" />

          {/* Giá treo cố định trần */}
          <rect x="180" y="30" width="400" height="16" rx="4" fill="#6d8276" />
          <line x1="220" y1="30" x2="200" y2="18" stroke="#8ba093" strokeWidth="3" />
          <line x1="280" y1="30" x2="260" y2="18" stroke="#8ba093" strokeWidth="3" />
          <line x1="380" y1="30" x2="360" y2="18" stroke="#8ba093" strokeWidth="3" />
          <line x1="480" y1="30" x2="460" y2="18" stroke="#8ba093" strokeWidth="3" />
          <line x1="540" y1="30" x2="520" y2="18" stroke="#8ba093" strokeWidth="3" />

          {/* Ròng rọc cố định ở trên */}
          <g transform="translate(380 75)">
            <rect x="-6" y="-30" width="12" height="30" fill="#889c90" />
            <circle r="36" fill="#cadad0" stroke="#5f7567" strokeWidth="4" />
            <circle r="12" fill="#fff" stroke="#5f7567" strokeWidth="3" />
            <circle r="4" fill="#364d3e" />
          </g>

          {params.pulleyType !== 'fixed' && (
            <g transform="translate(480 75)">
              <rect x="-6" y="-30" width="12" height="30" fill="#889c90" />
              <circle r="32" fill="#cadad0" stroke="#5f7567" strokeWidth="4" />
              <circle r="10" fill="#fff" stroke="#5f7567" strokeWidth="3" />
              <circle r="3" fill="#364d3e" />
            </g>
          )}

          {/* Ròng rọc động (nếu có) */}
          {params.pulleyType !== 'fixed' && (
            <g transform={`translate(380 ${loadY - 45})`}>
              <circle r="36" fill="#cadad0" stroke="#3b6951" strokeWidth="4" />
              <circle r="12" fill="#fff" stroke="#3b6951" strokeWidth="3" />
              <circle r="4" fill="#203d2e" />
              <path d="M-6 0v40h12V0" fill="#5c7a6b" />
            </g>
          )}

          {/* Dây vắt qua ròng rọc */}
          {params.pulleyType === 'fixed' ? (
            <g>
              <line x1="344" y1="75" x2="344" y2={loadY} stroke="#b08144" strokeWidth="5" />
              <line x1="416" y1="75" x2="416" y2={pullY} stroke="#b08144" strokeWidth="5" />
            </g>
          ) : (
            <g>
              <path
                d={`M344 75V${loadY - 45}q0 36 36 36q36 0 36-36V75`}
                fill="none"
                stroke="#b08144"
                strokeWidth="5"
              />
              <line x1="512" y1="75" x2="512" y2={pullY} stroke="#b08144" strokeWidth="5" />
            </g>
          )}

          {/* Quả tải (Load mass) */}
          <g transform={`translate(380 ${loadY})`}>
            <rect
              x="-46"
              y="0"
              width="92"
              height="75"
              rx="12"
              fill="url(#weight-grad)"
              stroke="#1b3328"
              strokeWidth="2"
            />
            <path d="M-18 0q18-24 36 0" fill="none" stroke="#cfdfd6" strokeWidth="5" />
            <text x="0" y="36" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold">
              {params.loadMass_kg.toFixed(1)} kg
            </text>
            <text x="0" y="58" textAnchor="middle" fill="#a4c9b5" fontSize="12">
              P = {reading.loadWeight_N.toFixed(1)} N
            </text>
          </g>

          {/* Lực kế kéo ở tay cầm (Dynamometer) */}
          <g transform={`translate(${params.pulleyType === 'fixed' ? 416 : 512} ${pullY})`}>
            <rect x="-16" y="0" width="32" height="70" rx="8" fill="#f8eed9" stroke="#bfa370" strokeWidth="2" />
            <line x1="0" y1="12" x2="0" y2="58" stroke="#bd9f66" strokeWidth="3" />
            <circle cx="0" cy="35" r="5" fill="#a6432b" />
            <text x="25" y="38" fill="#845314" fontSize="13" fontWeight="bold">
              F = {reading.effortForce_N.toFixed(1)} N
            </text>
            <text x="25" y="54" fill="#a07a4a" fontSize="11">
              (Lợi {reading.mechanicalAdvantage} lần lực)
            </text>
          </g>

          {/* Thước đo độ cao h và s */}
          <g transform="translate(140 160)">
            <line x1="0" y1="0" x2="0" y2="180" stroke="#728c7d" strokeWidth="3" />
            {[0, 0.5, 1.0, 1.5, 2.0].map((m, idx) => (
              <g key={idx} transform={`translate(0 ${180 - m * 80})`}>
                <line x1="-8" y1="0" x2="8" y2="0" stroke="#728c7d" strokeWidth="2" />
                <text x="-14" y="4" textAnchor="end" fontSize="11" fill="#516e5d">
                  {m.toFixed(1)} m
                </text>
              </g>
            ))}
          </g>
        </svg>

        <div className="stage-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => setIsLifting(!isLifting)}
          >
            {isLifting ? '▼ Hạ tải trọng xuống' : '▲ Kéo nâng tải trọng lên'}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setParams(defaultPulley);
              setIsLifting(false);
            }}
          >
            ↺ Đặt lại mặc định
          </button>
        </div>

        <div className="readings readings-expanded" aria-label="Kết quả đo ròng rọc">
          <div>
            <span>Trọng lượng tải P</span>
            <strong>{reading.loadWeight_N.toFixed(1)} <small>N</small></strong>
          </div>
          <div>
            <span>Lực kéo F cần tác dụng</span>
            <strong style={{ color: '#28775c' }}>{reading.effortForce_N.toFixed(1)} <small>N</small></strong>
          </div>
          <div>
            <span>Đoạn dây phải kéo (s)</span>
            <strong>{reading.ropeDistance_m.toFixed(2)} <small>m</small></strong>
          </div>
          <div>
            <span>Công thực hiện A</span>
            <strong>{reading.work_J.toFixed(1)} <small>J</small></strong>
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
                aria-pressed={params.pulleyType === type}
                onClick={() => update('pulleyType', type as PulleyType)}
                style={{ justifyContent: 'flex-start', padding: '10px 14px' }}
              >
                {label}
              </button>
            ))}
          </fieldset>

          <label className="parameter" style={{ marginTop: '20px' }}>
            <span>
              Khối lượng tải m <output>{params.loadMass_kg.toFixed(1)} kg</output>
            </span>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.5"
              value={params.loadMass_kg}
              onChange={e => update('loadMass_kg', Number(e.target.value))}
            />
          </label>

          <label className="parameter">
            <span>
              Độ cao cần nâng h <output>{params.liftHeight_m.toFixed(2)} m</output>
            </span>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.1"
              value={params.liftHeight_m}
              onChange={e => update('liftHeight_m', Number(e.target.value))}
            />
          </label>
        </section>

        <section className="chart-panel">
          <div className="panel-title">
            <h2>Định luật về công</h2>
            <span>A = F · s = P · h</span>
          </div>
          <div style={{ padding: '14px 18px', background: '#f8faf9', borderRadius: '12px', fontSize: '13px', lineHeight: '1.6', color: '#335242' }}>
            <p><strong>Kết luận khoa học SGK:</strong></p>
            <p>{reading.description}</p>
            <p style={{ marginTop: '8px', color: '#1f694f', fontWeight: 'bold' }}>
              ⚖ Công có ích: A = {reading.work_J.toFixed(1)} J (bảo toàn công khi bỏ qua ma sát).
            </p>
          </div>
        </section>
      </aside>
    </div>
  );
}
