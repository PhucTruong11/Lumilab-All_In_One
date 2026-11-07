import { useState } from 'react';
import { alkaliReading, defaultAlkali, type AlkaliMetal, type AlkaliMode, type AlkaliParameters } from '@lumilab/lab-engine';

export function AlkaliLab() {
  const [params, setParams] = useState<AlkaliParameters>(defaultAlkali);
  const [isReacting, setIsReacting] = useState(false);
  const reading = alkaliReading(params);

  const update = (key: keyof AlkaliParameters, value: unknown) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const handleStartReaction = () => {
    setIsReacting(true);
  };

  const handleReset = () => {
    setIsReacting(false);
    setParams(defaultAlkali);
  };

  return (
    <div className="workbench-grid interactive-lab">
      <section className="stage-panel" aria-label="Bàn thí nghiệm kim loại kiềm">
        <div className="panel-title">
          <h2>Kim loại kiềm: Phản ứng với nước & Thử màu ngọn lửa</h2>
          <span className="mode-chip">
            <i /> {params.mode === 'water_reaction' ? 'Thí nghiệm chậu nước' : 'Phép thử ngọn lửa đèn khí'}
          </span>
        </div>

        <svg
          className="interactive-stage"
          viewBox="0 0 760 460"
          aria-label="Minh họa phản ứng kim loại kiềm"
        >
          <defs>
            <linearGradient id="alkali-stage-bg" x2="1" y2="1">
              <stop stopColor="#fdfbf9" />
              <stop offset="1" stopColor="#f4f7f6" />
            </linearGradient>
            <radialGradient id="water-pheno-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ff5ea6" stopOpacity={isReacting ? '0.75' : '0.05'} />
              <stop offset="100%" stopColor="#43a089" stopOpacity="0.25" />
            </radialGradient>
            <radialGradient id="flame-glow" cx="50%" cy="60%" r="50%">
              <stop offset="0%" stopColor={reading.flameHex} stopOpacity="0.95" />
              <stop offset="70%" stopColor={reading.flameHex} stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background */}
          <rect x="10" y="5" width="740" height="442" rx="22" fill="url(#alkali-stage-bg)" />

          {params.mode === 'water_reaction' ? (
            /* --- Chế độ phản ứng với nước --- */
            <g id="water-mode-scene">
              {/* Bàn thí nghiệm */}
              <path d="M50 380h660" stroke="#cfdbd5" strokeWidth="6" />

              {/* Chậu thủy tinh đựng nước */}
              <path
                d="M200 170v160q0 40 40 40h280q40 0 40-40V170"
                fill="#ffffff66"
                stroke="#8ba697"
                strokeWidth="4"
              />
              {/* Mặt nước & dung dịch */}
              <path
                d="M204 220v110q0 36 36 36h280q36 0 36-36V220"
                fill="url(#water-pheno-glow)"
              />
              <ellipse cx="380" cy="220" rx="176" ry="16" fill="#8ba69733" stroke="#67917a" strokeWidth="2" />

              <text x="380" y="270" textAnchor="middle" fill={isReacting ? '#b31b67' : '#577c68'} fontSize="13" fontWeight="600">
                {isReacting ? 'Dung dịch kiềm MOH loang màu hồng phenolphthalein' : 'Nước cất có thêm vài giọt phenolphthalein (chưa màu)'}
              </text>

              {/* Mẩu kim loại đang phản ứng */}
              {isReacting && (
                <g transform="translate(380 216)">
                  {/* Viên kim loại vo tròn */}
                  <circle r="14" fill="#d2dcd7" stroke="#8fa89e" strokeWidth="3" />
                  {/* Khói và bọt khí H2 */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <circle
                      key={i}
                      cx={-25 + (i % 4) * 16}
                      cy={-15 - (i * 8)}
                      r={3 + (i % 3)}
                      fill="#ffffff"
                      opacity="0.8"
                    />
                  ))}
                  {/* Ngọn lửa nếu là Kali (K) */}
                  {params.metal === 'k' && (
                    <path
                      d="M-12 -6q12 -28 24 0q-12 -10 -24 0"
                      fill="#b28dff"
                      stroke="#865be3"
                      strokeWidth="2"
                    />
                  )}
                  <text x="0" y="-35" textAnchor="middle" fill={params.metal === 'k' ? '#703bc9' : '#1f694f'} fontSize="12" fontWeight="bold">
                    {params.metal === 'na' ? '⚡ Na nóng chảy, chạy tròn, xì khí H₂' : '🔥 K bốc cháy ngọn lửa tím nhạt!'}
                  </text>
                </g>
              )}
            </g>
          ) : (
            /* --- Chế độ thử màu ngọn lửa --- */
            <g id="flame-mode-scene">
              <path d="M100 380h560" stroke="#cfdbd5" strokeWidth="6" />

              {/* Đèn khí Bunsen */}
              <rect x="350" y="270" width="60" height="110" rx="8" fill="#586d63" />
              <rect x="330" y="370" width="100" height="15" rx="4" fill="#394942" />
              <rect x="365" y="220" width="30" height="50" fill="#8ca096" />

              {/* Ngọn lửa đèn khí đổi màu theo ion kim loại */}
              <ellipse cx="380" cy="150" rx="45" ry="90" fill="url(#flame-glow)" />
              <path
                d="M365 220q15 -140 30 0"
                fill={reading.flameHex}
                opacity="0.8"
              />

              {/* Dây platin đưa mẫu muối vào ngọn lửa */}
              <line x1="220" y1="210" x2="375" y2="170" stroke="#71867c" strokeWidth="4" />
              <circle cx="375" cy="170" r="5" fill="#f0ebd8" stroke="#a4936d" strokeWidth="2" />
              <text x="210" y="215" textAnchor="end" fill="#526d5f" fontSize="12">
                Dây platin chứa ion {params.metal.toUpperCase()}⁺
              </text>

              <text x="380" y="60" textAnchor="middle" fill="#213d2f" fontSize="18" fontWeight="bold">
                Màu ngọn lửa đặc trưng: {reading.flameColor}
              </text>
            </g>
          )}
        </svg>

        <div className="stage-actions">
          {params.mode === 'water_reaction' && (
            <button
              type="button"
              className="primary-button"
              onClick={handleStartReaction}
              disabled={isReacting}
            >
              {isReacting ? '✓ Phản ứng đang diễn ra' : `▶ Thả mẩu kim loại ${params.metal.toUpperCase()} vào nước`}
            </button>
          )}
          <button type="button" className="secondary-button" onClick={handleReset}>
            ↺ Làm sạch & Mẫu mới
          </button>
        </div>

        <div className="readings readings-expanded" aria-label="Kết quả phản ứng kim loại kiềm">
          <div>
            <span>Khí H₂ thoát ra (đkc)</span>
            <strong>{reading.h2Volume_ml.toFixed(1)} <small>mL</small></strong>
          </div>
          <div>
            <span>pH dung dịch kiềm</span>
            <strong style={{ color: '#c02674' }}>{reading.pH.toFixed(2)}</strong>
          </div>
          <div>
            <span>Màu ngọn lửa ion</span>
            <strong style={{ color: params.metal === 'na' ? '#d97706' : '#7c3aed' }}>
              {reading.flameColor.split(' ')[0]}
            </strong>
          </div>
          <div>
            <span>Mức độ mãnh liệt</span>
            <strong>{reading.reactionIntensity}</strong>
          </div>
        </div>
      </section>

      <aside className="experiment-sidebar">
        <section className="parameter-panel">
          <div className="panel-title">
            <h2>Chọn kim loại & Chế độ</h2>
            <span>SGK Hóa học 12</span>
          </div>

          <fieldset className="materials">
            <legend>Kim loại kiềm (Nhóm IA)</legend>
            {[
              ['na', 'Natri (Na) · M = 23'],
              ['k', 'Kali (K) · M = 39'],
            ].map(([metalKey, label]) => (
              <button
                key={metalKey}
                type="button"
                aria-pressed={params.metal === metalKey}
                onClick={() => {
                  update('metal', metalKey as AlkaliMetal);
                  setIsReacting(false);
                }}
              >
                {label}
              </button>
            ))}
          </fieldset>

          <fieldset className="materials" style={{ marginTop: '16px', flexDirection: 'column' }}>
            <legend>Chế độ thí nghiệm</legend>
            {[
              ['water_reaction', '1. Tác dụng với nước (Quan sát sinh khí & pH)'],
              ['flame_test', '2. Thử màu ngọn lửa đèn khí'],
            ].map(([mKey, label]) => (
              <button
                key={mKey}
                type="button"
                aria-pressed={params.mode === mKey}
                onClick={() => update('mode', mKey as AlkaliMode)}
                style={{ justifyContent: 'flex-start' }}
              >
                {label}
              </button>
            ))}
          </fieldset>

          <label className="parameter" style={{ marginTop: '16px' }}>
            <span>
              Khối lượng kim loại m <output>{params.mass_g.toFixed(2)} g</output>
            </span>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={params.mass_g}
              onChange={e => update('mass_g', Number(e.target.value))}
            />
          </label>

          <div style={{ marginTop: '16px', padding: '12px', background: '#fdf7f9', borderRadius: '10px', fontSize: '13px', color: '#9d174d' }}>
            <strong>Phương trình phản ứng:</strong>
            <p style={{ marginTop: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>{reading.equation}</p>
          </div>
        </section>

        <section className="chart-panel">
          <div className="panel-title">
            <h2>Hiện tượng quan sát SGK</h2>
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
