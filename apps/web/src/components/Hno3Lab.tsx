import { useLab } from '../labSession';
import { ExpandedFooter, ObserveOnStage } from './ExpandedLabParts';

export function Hno3Lab() {
  const { engine, state } = useLab('copper-nitric');
  const { parameters: params, reading } = state;
  const hasStarted = params.observed;
  const brownGas = hasStarted && (params.acid === 'concentrated' || params.air);
  const update = (patch: Partial<typeof params>) => engine.setParameters({ ...patch, observed: false });

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel" aria-label="Bàn thí nghiệm axit nitric">
          <div className="panel-title">
            <h2>Kim loại Cu tác dụng với axit Nitric (HNO₃)</h2>
            <span className="mode-chip">
              <i /> {params.acid === 'dilute' ? 'Axit loãng (sinh khí NO)' : 'Axit đặc (sinh khí NO₂)'}
            </span>
          </div>

          <svg className="interactive-stage" viewBox="0 0 760 530" aria-label="Minh họa phản ứng Cu với HNO3">
            <defs>
              <linearGradient id="hno3-stage-bg" x2="1" y2="1">
                <stop stopColor="#f6faf8" />
                <stop offset="1" stopColor="#eaf2ee" />
              </linearGradient>
              <linearGradient id="gas-brown-grad" x1="0" y1="1" x2="0" y2="0">
                <stop
                  offset="0%"
                  stopColor="#b45309"
                  stopOpacity={brownGas ? (params.acid === 'concentrated' ? '0.68' : '0.12') : '0'}
                />
                <stop offset="55%" stopColor="#b45309" stopOpacity={brownGas ? '0.78' : '0'} />
                <stop offset="100%" stopColor="#7c2d12" stopOpacity={brownGas ? '0.92' : '0'} />
              </linearGradient>
              <linearGradient id="copper-liquid" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hasStarted ? '#38bdf8' : '#e0f2fe'} />
                <stop offset="100%" stopColor={hasStarted ? '#0284c7' : '#bae6fd'} />
              </linearGradient>
            </defs>

            <rect x="10" y="5" width="740" height="520" rx="22" fill="url(#hno3-stage-bg)" />

            {/* Bench & Retort Stand */}
            <path d="M90 404h580" stroke="#b5cbc0" strokeWidth="6" strokeLinecap="round" />
            <rect x="238" y="96" width="14" height="308" rx="4" fill="#5b7467" />
            <rect x="198" y="392" width="96" height="14" rx="4" fill="#3a4f44" />
            <rect x="248" y="156" width="74" height="11" rx="3" fill="#5b7467" />
            <rect x="248" y="274" width="74" height="11" rx="3" fill="#5b7467" />

            {/* Interactive Acid Reagent Bottles on left */}
            <g transform="translate(88 308)">
              {([
                ['dilute', 'HNO₃ loãng'],
                ['concentrated', 'HNO₃ đặc'],
              ] as const).map(([key, label], idx) => {
                const active = params.acid === key;
                return (
                  <g
                    key={key}
                    transform={`translate(${idx * 66} 0)`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Chọn lọ ${label}`}
                    className="svg-button"
                    onClick={() => update({ acid: key })}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        update({ acid: key });
                      }
                    }}
                  >
                    <rect x="-24" y="0" width="48" height="78" rx="8" fill="#ffffffeb" stroke={active ? '#14798f' : '#94a89d'} strokeWidth={active ? '2.6' : '1.8'} />
                    <rect x="-14" y="-12" width="28" height="12" rx="3" fill={active ? '#14798f' : '#647d70'} />
                    <rect x="-21" y="34" width="42" height="40" rx="5" fill={key === 'concentrated' ? '#fde68a' : '#e0f2fe'} opacity="0.85" />
                    <text x="0" y="22" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#1b382b">
                      {key === 'dilute' ? 'Loãng' : 'Đặc'}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* Reaction Test Tube */}
            <g transform="translate(330 78)">
              {/* Gas column inside & above tube */}
              <path
                d="M-24 132V12q0-14 24-14q24 0 24 14v120z"
                fill="url(#gas-brown-grad)"
                className={brownGas ? 'gas-plume' : undefined}
              />

              {/* Glass test tube body */}
              <path
                d="M-26 0v244q0 26 26 26q26 0 26-26V0"
                fill="#ffffff48"
                stroke="#648776"
                strokeWidth="4"
              />

              {/* Liquid solution (turns Cu(NO3)2 blue when reacting) */}
              <path
                d="M-23 132v112q0 23 23 23q23 0 23-23V132z"
                fill="url(#copper-liquid)"
                opacity="0.88"
                className="flask-liquid"
              />
              <ellipse cx="0" cy="132" rx="23" ry="4.5" fill="#bae6fd" opacity="0.8" />

              {/* Copper turnings at bottom */}
              <rect x="-15" y="240" width="30" height="13" rx="3.5" fill="#c26d38" stroke="#854219" strokeWidth="2" />
              <circle cx="-6" cy="245" r="4" fill="#d98a55" />
              <circle cx="8" cy="247" r="3.5" fill="#b45a24" />

              {/* Animated rising gas bubbles */}
              {hasStarted && (
                <g>
                  <circle cx="-8" cy="226" r="3.8" fill={params.acid === 'concentrated' ? '#d97706' : '#ffffff'} className="chem-bubble" />
                  <circle cx="6" cy="214" r="4.5" fill={params.acid === 'concentrated' ? '#b45309' : '#ffffff'} className="chem-bubble-fast" />
                  <circle cx="-2" cy="196" r="5" fill={params.acid === 'concentrated' ? '#d97706' : '#ffffff'} className="chem-bubble-delayed" />
                  <circle cx="9" cy="182" r="3.6" fill={params.acid === 'concentrated' ? '#b45309' : '#ffffff'} className="chem-bubble" />
                </g>
              )}

              {/* Interactive Cotton Plug / Air Exposure Toggle at Tube Mouth */}
              <g
                role="button"
                tabIndex={0}
                aria-label="Đóng mở tiếp xúc không khí ở miệng ống"
                className="svg-button"
                onClick={() => update({ air: !params.air })}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    update({ air: !params.air });
                  }
                }}
              >
                <ellipse
                  cx={params.air ? -18 : 0}
                  cy={params.air ? -8 : 4}
                  rx="23"
                  ry="9.5"
                  fill="#f1f5f9"
                  stroke="#14798f"
                  strokeWidth="2.2"
                />
                {params.air && (
                  <path d="M18 -16l-10 14m0 0h7m-7 0v-7" fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />
                )}
                <text x="38" y="8" fontSize="11" fontWeight="600" fill="#0f6275">
                  {params.air ? 'Đang mở cho O₂ không khí vào ⇄' : 'Bông tẩm kiềm (chạm để thử gặp O₂)'}
                </text>
              </g>
            </g>

            {/* Observation Callout Card */}
            <g transform="translate(425 112)">
              <rect
                x="0"
                y="0"
                width="292"
                height="118"
                rx="13"
                fill="#ffffffeb"
                stroke={brownGas ? '#d97706' : '#c5ddd0'}
                strokeWidth="1.8"
              />
              <text x="16" y="28" fill={brownGas ? '#92400e' : '#1b382b'} fontSize="13.5" fontWeight="700">
                {!hasStarted
                  ? 'Sẵn sàng quan sát phản ứng oxi hóa Cu'
                  : params.acid === 'dilute'
                  ? 'Khí chính sinh ra: NO (không màu)'
                  : 'Khí chính thoát ra: NO₂ (nâu đỏ)'}
              </text>
              <text x="16" y="52" fill="#3f5e4e" fontSize="12">
                {!hasStarted
                  ? 'Chọn nồng độ axit và nhấn Quan sát bên dưới'
                  : params.acid === 'dilute'
                  ? params.air
                    ? 'Tiếp xúc O₂: 2NO + O₂ → 2NO₂ (hóa nâu đỏ)'
                    : 'Chưa gặp O₂: khí trong ống vẫn không màu'
                  : 'HNO₃ đặc oxi hóa mạnh tạo trực tiếp khí NO₂'}
              </text>
              <text x="16" y="78" fill="#0369a1" fontSize="12" fontWeight="700">
                {hasStarted ? 'Dung dịch chuyển xanh lam Cu(NO₃)₂ (minh họa)' : 'Phoi đồng đỏ nằm dưới đáy ống nghiệm'}
              </text>
              <text x="16" y="100" fill="#64748b" fontSize="11">
                An toàn: NO và NO₂ đều độc, thực tế làm trong tủ hút.
              </text>
            </g>

            <ObserveOnStage observed={params.observed} onObserve={() => engine.setParameters({ observed: true })} />
          </svg>

          <div className="stage-actions">
            <button
              type="button"
              className="primary-button"
              aria-label="Quan sát"
              disabled={hasStarted}
              onClick={() => engine.setParameters({ observed: true })}
            >
              {hasStarted ? '✓ Đã mở quan sát' : '▶ Quan sát Cu với HNO₃'}
            </button>
            <button className="secondary-button" onClick={() => engine.reset()}>
              ↺ Đặt lại
            </button>
            <button className="record-button" disabled={!params.observed} onClick={() => engine.record()}>
              Ghi quan sát
            </button>
          </div>

          <div className="readings readings-expanded" aria-label="Kết quả quan sát phản ứng HNO3">
            <div>
              <span>Khí chính trong mô hình</span>
              <strong>{reading.product ?? '—'}</strong>
            </div>
            <div>
              <span>Màu sắc khí quan sát</span>
              <strong data-testid="chem-observation">{reading.appearance ?? '—'}</strong>
            </div>
            <div>
              <span>Kịch bản axit</span>
              <strong>{params.acid === 'dilute' ? 'Loãng' : 'Đặc'}</strong>
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
              <h2>Kịch bản axit & Không khí</h2>
              <span>SGK Hóa học 11</span>
            </div>

            <fieldset className="materials" style={{ flexDirection: 'column', gap: '8px' }}>
              <legend>Nồng độ axit nitric (HNO₃)</legend>
              {[
                ['dilute', '1. Axit HNO₃ loãng'],
                ['concentrated', '2. Axit HNO₃ đặc'],
              ].map(([concKey, label]) => (
                <button
                  key={concKey}
                  type="button"
                  aria-pressed={params.acid === concKey}
                  onClick={() => update({ acid: concKey as 'dilute' | 'concentrated' })}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  {label}
                </button>
              ))}
            </fieldset>

            <label className="check-row">
              <input
                type="checkbox"
                checked={params.air}
                onChange={e => update({ air: e.target.checked })}
              />
              NO gặp không khí
            </label>

            <div style={{ marginTop: '16px', padding: '12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', fontSize: '13px', color: '#854d0e' }}>
              <strong>Phương trình phản ứng:</strong>
              <p style={{ marginTop: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>{reading.equation ?? '—'}</p>
              {params.observed && params.air && params.acid === 'dilute' && (
                <p style={{ marginTop: '4px', fontFamily: 'monospace', fontWeight: 'bold', color: '#b45309' }}>
                  2NO + O₂ → 2NO₂
                </p>
              )}
            </div>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Giải thích hiện tượng SGK</h2>
              <span>Học liệu Kết nối tri thức · nháp</span>
            </div>
            <div style={{ padding: '14px', background: '#f4faf7', borderRadius: '12px', fontSize: '12.5px', lineHeight: '1.6', color: '#244b38' }}>
              <p>{reading.detail}</p>
            </div>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="copper-nitric"
        formulas={<p>Quan sát định tính trong phạm vi kịch bản nháp đã chọn.</p>}
        columns={['Axit', 'Không khí', 'Sản phẩm', 'Hiện tượng']}
        rows={state.records.map(row => [
          row.parameters.acid,
          row.parameters.air ? 'Có' : 'Không',
          row.reading.product ?? '—',
          row.reading.appearance ?? '—',
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}
