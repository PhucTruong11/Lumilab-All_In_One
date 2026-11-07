import { useLab } from '../labSession';
import { ExpandedFooter, ObserveOnStage } from './ExpandedLabParts';

export function AlkaliLab() {
  const { engine, state } = useLab('alkali-water');
  const { parameters: params, reading } = state;
  const isReacting = params.observed;
  const flameHex = params.observed ? (params.metal === 'Na' ? '#facc15' : '#b784ff') : '#7dd3fc';
  const flameCore = params.observed ? (params.metal === 'Na' ? '#fef08a' : '#f3e8ff') : '#bae6fd';
  const update = (patch: Partial<typeof params>) => engine.setParameters({ ...patch, observed: false });
  const handleStartReaction = () => engine.setParameters({ observed: true });
  const handleReset = () => engine.reset();

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel" aria-label="Bàn thí nghiệm kim loại kiềm">
          <div className="panel-title">
            <h2>Kim loại kiềm: Phản ứng với nước & Thử màu ngọn lửa</h2>
            <span className="mode-chip">
              <i /> {params.mode === 'water' ? 'Thí nghiệm chậu nước + phenolphthalein' : 'Phép thử ngọn lửa đèn khí'}
            </span>
          </div>

          <svg className="interactive-stage" viewBox="0 0 760 530" aria-label="Minh họa phản ứng kim loại kiềm">
            <defs>
              <linearGradient id="alkali-stage-bg" x2="1" y2="1">
                <stop stopColor="#f6faf8" />
                <stop offset="1" stopColor="#ebf3ef" />
              </linearGradient>
              <radialGradient id="water-pheno-glow" cx="50%" cy="42%" r="58%">
                <stop offset="0%" stopColor="#ec4899" stopOpacity={isReacting ? '0.8' : '0.04'} />
                <stop offset="65%" stopColor="#f472b6" stopOpacity={isReacting ? '0.42' : '0.02'} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.22" />
              </radialGradient>
              <radialGradient id="flame-glow" cx="50%" cy="62%" r="52%">
                <stop offset="0%" stopColor={flameHex} stopOpacity="0.95" />
                <stop offset="65%" stopColor={flameHex} stopOpacity="0.45" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect x="10" y="5" width="740" height="520" rx="22" fill="url(#alkali-stage-bg)" />

            {/* Interactive Reagent Jars on left bench (click to toggle Na / K) */}
            <g transform="translate(86 286)">
              {(['Na', 'K'] as const).map((metalKey, idx) => {
                const active = params.metal === metalKey;
                return (
                  <g
                    key={metalKey}
                    transform={`translate(${idx * 68} 0)`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Chọn mẫu ${metalKey} trên bàn`}
                    className="svg-button"
                    onClick={() => update({ metal: metalKey })}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        update({ metal: metalKey });
                      }
                    }}
                  >
                    <rect x="-24" y="0" width="48" height="72" rx="8" fill="#ffffffd9" stroke={active ? '#14798f' : '#94a89d'} strokeWidth={active ? '2.6' : '1.8'} />
                    <rect x="-16" y="-10" width="32" height="11" rx="3" fill={active ? '#14798f' : '#647d70'} />
                    <rect x="-21" y="28" width="42" height="40" rx="5" fill="#fef3c7" opacity="0.7" />
                    <circle cx="0" cy="52" r="7" fill="#94a3b8" />
                    <text x="0" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#1b382b">
                      {metalKey}
                    </text>
                  </g>
                );
              })}
              <text x="34" y="92" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#476657">
                Lọ ngâm dầu hỏa (chạm đổi)
              </text>
            </g>

            {params.mode === 'water' ? (
              <g id="water-mode-scene">
                <path d="M44 382h672" stroke="#b9cec3" strokeWidth="6" strokeLinecap="round" />

                {/* Interactive Tweezers above trough to drop sample */}
                {!isReacting && (
                  <g
                    transform="translate(415 118)"
                    role="button"
                    tabIndex={0}
                    aria-label="Thả mẩu kim loại vào chậu nước"
                    className="svg-button"
                    onClick={handleStartReaction}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleStartReaction();
                      }
                    }}
                  >
                    <path d="M-8 -42L-3 12M8 -42L3 12" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
                    <circle cx="0" cy="18" r="9" fill="#cbd5e1" stroke="#14798f" strokeWidth="2.2" />
                    <rect x="-78" y="-36" width="156" height="26" rx="13" fill="#ffffffeb" stroke="#14798f" strokeWidth="1.6" />
                    <text x="0" y="-19" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f6275">
                      Chạm kẹp thả {params.metal} ↓
                    </text>
                  </g>
                )}

                {/* Glass trough */}
                <path
                  d="M235 170v162q0 38 38 38h274q38 0 38-38V170"
                  fill="#ffffff80"
                  stroke="#6f9180"
                  strokeWidth="4"
                />
                {/* Water & phenolphthalein indicator */}
                <path
                  d="M239 220v112q0 34 34 34h274q34 0 34-34V220"
                  fill="url(#water-pheno-glow)"
                />
                <ellipse cx="410" cy="220" rx="171" ry="15" fill="#bae6fd55" stroke="#5c8a75" strokeWidth="2" />

                {isReacting && (
                  <ellipse
                    cx="385"
                    cy="222"
                    rx="72"
                    ry="10"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="2.2"
                    className="pheno-ripple"
                  />
                )}

                <text x="410" y="316" textAnchor="middle" fill={isReacting ? '#9d174d' : '#355d48'} fontSize="13" fontWeight="700">
                  {isReacting
                    ? `Dung dịch ${params.metal}OH làm hồng phenolphthalein`
                    : 'Nước cất + vài giọt phenolphthalein (không màu)'}
                </text>

                {/* Skittering molten alkali bead + H2 bubbles + K lilac flame */}
                {isReacting && (
                  <>
                    <g className="alkali-skitter" transform="translate(380 216)">
                      {params.metal === 'K' && (
                        <g className="flame-flicker">
                          <path d="M-12 -4q12 -44 24 0z" fill="#a855f7" opacity="0.88" />
                          <path d="M-6 -4q6 -26 12 0z" fill="#f3e8ff" />
                        </g>
                      )}
                      <circle r="12" fill="#e2e8f0" stroke="#64748b" strokeWidth="2.5" />
                      <circle cx="-16" cy="-10" r="4" fill="#ffffff" className="chem-bubble" />
                      <circle cx="0" cy="-16" r="5" fill="#ffffff" className="chem-bubble-fast" />
                      <circle cx="15" cy="-12" r="3.5" fill="#ffffff" className="chem-bubble-delayed" />
                      <circle cx="-7" cy="-22" r="3" fill="#ffffff" className="chem-bubble-fast" />
                    </g>

                    <g transform="translate(410 106)">
                      <rect x="-155" y="-22" width="310" height="36" rx="10" fill="#ffffffeb" stroke="#cbd5e1" />
                      <text x="0" y="1" textAnchor="middle" fill={params.metal === 'K' ? '#6d28d9' : '#1b4d39'} fontSize="12" fontWeight="700">
                        Khí H₂ thoát mạnh · {reading.detail}
                      </text>
                    </g>
                  </>
                )}
              </g>
            ) : (
              <g id="flame-mode-scene">
                <path d="M44 382h672" stroke="#b9cec3" strokeWidth="6" strokeLinecap="round" />

                {/* Bunsen Burner */}
                <rect x="380" y="272" width="56" height="108" rx="8" fill="#4b6358" />
                <rect x="356" y="370" width="104" height="14" rx="4" fill="#2d3f37" />
                <rect x="394" y="218" width="28" height="56" fill="#7d9489" />

                {/* Animated Bunsen Flame */}
                <ellipse cx="408" cy="148" rx="52" ry="92" fill="url(#flame-glow)" className="flame-flicker" />
                <g className="flame-flicker">
                  <path d="M386 218q22 -148 44 0z" fill={flameHex} opacity="0.88" />
                  <path d="M396 218q12 -78 24 0z" fill={flameCore} opacity="0.92" />
                </g>

                {/* Interactive Platinum Wire Loop */}
                <g
                  role="button"
                  tabIndex={0}
                  aria-label="Đưa dây platin vào ngọn lửa"
                  className="svg-button"
                  onClick={handleStartReaction}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleStartReaction();
                    }
                  }}
                >
                  <line
                    x1="230"
                    y1="208"
                    x2={isReacting ? '404' : '348'}
                    y2={isReacting ? '168' : '182'}
                    stroke="#536b60"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                  <circle
                    cx={isReacting ? 404 : 348}
                    cy={isReacting ? 168 : 182}
                    r="7"
                    fill="#fffbeb"
                    stroke="#14798f"
                    strokeWidth="2.4"
                  />
                  <text x="222" y="202" textAnchor="end" fill="#244b38" fontSize="12" fontWeight="700">
                    Dây Pt tẩm muối {params.metal}⁺
                  </text>
                  {!isReacting && (
                    <text x="222" y="220" textAnchor="end" fill="#0f6275" fontSize="11" fontWeight="600">
                      (Chạm để đưa vào ngọn lửa →)
                    </text>
                  )}
                </g>

                <g transform="translate(408 54)">
                  <rect x="-175" y="-24" width="350" height="40" rx="12" fill="#ffffffeb" stroke="#c8ddd1" />
                  <text x="0" y="2" textAnchor="middle" fill="#1b382b" fontSize="15.5" fontWeight="700">
                    Màu ngọn lửa đặc trưng: {reading.appearance ?? 'Chờ đưa mẫu vào lửa'}
                  </text>
                </g>
              </g>
            )}

            <ObserveOnStage observed={params.observed} onObserve={handleStartReaction} />
          </svg>

          <div className="stage-actions">
            <button
              type="button"
              className="primary-button"
              aria-label="Quan sát"
              onClick={handleStartReaction}
              disabled={isReacting}
            >
              {isReacting
                ? '✓ Đã mở quan sát'
                : params.mode === 'water'
                ? `▶ Quan sát ${params.metal} với nước`
                : '▶ Quan sát màu ngọn lửa'}
            </button>
            <button type="button" className="secondary-button" onClick={handleReset}>
              ↺ Làm sạch & Mẫu mới
            </button>
            <button className="record-button" disabled={!params.observed} onClick={() => engine.record()}>
              Ghi quan sát
            </button>
          </div>

          <div className="readings readings-expanded" aria-label="Kết quả phản ứng kim loại kiềm">
            <div>
              <span>Sản phẩm</span>
              <strong>{reading.product ?? '—'}</strong>
            </div>
            <div>
              <span>Hiện tượng</span>
              <strong data-testid="chem-observation">{reading.appearance ?? '—'}</strong>
            </div>
            <div>
              <span>Mẫu</span>
              <strong>{params.metal}</strong>
            </div>
            <div>
              <span>Phạm vi</span>
              <strong>Định tính</strong>
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
                ['Na', 'Natri (Na)'],
                ['K', 'Kali (K)'],
              ].map(([metalKey, label]) => (
                <button
                  key={metalKey}
                  type="button"
                  aria-pressed={params.metal === metalKey}
                  onClick={() => update({ metal: metalKey as 'Na' | 'K' })}
                >
                  {label}
                </button>
              ))}
            </fieldset>

            <fieldset className="materials" style={{ marginTop: '16px', flexDirection: 'column' }}>
              <legend>Chế độ thí nghiệm</legend>
              {[
                ['water', '1. Tác dụng với nước (quan sát sinh khí)'],
                ['flame', '2. Thử màu ngọn lửa đèn khí'],
              ].map(([mKey, label]) => (
                <button
                  key={mKey}
                  type="button"
                  aria-pressed={params.mode === mKey}
                  onClick={() => update({ mode: mKey as 'water' | 'flame' })}
                  style={{ justifyContent: 'flex-start' }}
                >
                  {label}
                </button>
              ))}
            </fieldset>

            <p className="content-note">
              Chạm trực tiếp vào lọ mẫu, kẹp gắp hoặc dây platin trên bàn để thao tác. Đổi mẫu tự động chuẩn bị lượt quan sát mới.
            </p>

            <div style={{ marginTop: '16px', padding: '12px', background: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '10px', fontSize: '13px', color: '#9d174d' }}>
              <strong>Phương trình phản ứng:</strong>
              <p style={{ marginTop: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>{reading.equation ?? '—'}</p>
            </div>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Hiện tượng quan sát SGK</h2>
              <span>Học liệu Kết nối tri thức · nháp</span>
            </div>
            <div style={{ padding: '14px', background: '#f4faf7', borderRadius: '12px', fontSize: '12.5px', lineHeight: '1.6', color: '#244b38' }}>
              <p>{reading.detail}</p>
            </div>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="alkali-water"
        formulas={<p>Quan sát định tính trong phạm vi kịch bản nháp đã chọn.</p>}
        columns={['Mẫu', 'Chế độ', 'Sản phẩm', 'Hiện tượng']}
        rows={state.records.map(row => [
          row.parameters.metal,
          row.parameters.mode,
          row.reading.product ?? '—',
          row.reading.appearance ?? '—',
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}
