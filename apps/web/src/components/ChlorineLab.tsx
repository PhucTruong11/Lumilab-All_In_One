import { useLab } from '../labSession';
import { ExpandedFooter, ObserveOnStage } from './ExpandedLabParts';

export function ChlorineLab() {
  const { engine, state } = useLab('chlorine-bleach');
  const { parameters: params, reading } = state;
  const isGenerating = params.observed;
  const stripType = params.damp ? 'wet' : 'dry';
  const isBleached = params.observed && params.mode === 'bleach' && params.damp;
  const update = (patch: Partial<typeof params>) => engine.setParameters({ ...patch, observed: false });

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel" aria-label="Bàn thí nghiệm điều chế khí clo">
          <div className="panel-title">
            <h2>Điều chế & Thử tính tẩy màu của khí Clo (Cl₂)</h2>
            <span className="mode-chip">
              <i /> {params.mode === 'bleach' ? 'Đối chứng giấy màu khô & ẩm' : 'Nguyên lí oxi hóa tạo Cl₂'}
            </span>
          </div>

          <svg
            className="interactive-stage"
            viewBox="0 0 760 530"
            aria-label="Hệ thống điều chế và thử tính tẩy màu của Clo"
          >
            <defs>
              <linearGradient id="chlorine-bg" x2="1" y2="1">
                <stop stopColor="#f6faf8" />
                <stop offset="1" stopColor="#edf5ef" />
              </linearGradient>
              <linearGradient id="cl2-gas-color" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#eab308" stopOpacity={isGenerating ? '0.52' : '0.04'} />
                <stop offset="100%" stopColor="#84cc16" stopOpacity={isGenerating ? '0.72' : '0.04'} />
              </linearGradient>
            </defs>

            <rect x="10" y="5" width="740" height="520" rx="22" fill="url(#chlorine-bg)" />
            <path d="M40 402h680" stroke="#b9cec3" strokeWidth="6" strokeLinecap="round" />

            {/* Cluster 1: Cl2 Generator Flask + Interactive HCl Dropping Funnel */}
            <g transform="translate(175 230)">
              <circle cx="0" cy="82" r="66" fill="#ffffff66" stroke="#5c7d6d" strokeWidth="4" />
              <ellipse cx="0" cy="122" rx="38" ry="14" fill="#581c87" stroke="#3b0764" strokeWidth="2" />
              <text x="0" y="126" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="700">
                KMnO₄
              </text>

              {/* Yellow-green Cl2 gas filling generator */}
              <circle cx="0" cy="74" r="56" fill="url(#cl2-gas-color)" className={isGenerating ? 'gas-plume' : undefined} />

              {/* Animated HCl drop falling when generating */}
              {isGenerating && <circle cx="0" cy="24" r="4" fill="#38bdf8" className="chem-drip" />}

              {/* Dropping funnel + interactive tap */}
              <rect x="-8" y="-72" width="16" height="88" fill="#f8fafc" stroke="#5c7d6d" strokeWidth="2.2" />
              <path d="M-22 -118h44l-14 46h-16z" fill="#e0f2fe" stroke="#5c7d6d" strokeWidth="2.2" />
              <g
                role="button"
                tabIndex={0}
                aria-label="Khóa phễu nhỏ giọt HCl"
                className="svg-button"
                onClick={() => engine.setParameters({ observed: true })}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    engine.setParameters({ observed: true });
                  }
                }}
              >
                <rect x="-24" y="-44" width="48" height="24" rx="6" fill="transparent" />
                <line
                  x1={isGenerating ? '0' : '-16'}
                  y1={isGenerating ? '-42' : '-32'}
                  x2={isGenerating ? '0' : '16'}
                  y2={isGenerating ? '-22' : '-32'}
                  stroke="#14798f"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <circle cx="0" cy="-32" r="5" fill="#fff" stroke="#14798f" strokeWidth="2" />
              </g>
              <text x="30" y="-92" fontSize="11" fontWeight="700" fill="#1b382b">
                HCl đặc
              </text>
              <text x="30" y="-76" fontSize="10.5" fill="#0f6275">
                {isGenerating ? 'Đang nhỏ giọt' : 'Chạm khóa để mở'}
              </text>
              <text x="0" y="172" textAnchor="middle" fill="#1b382b" fontSize="12" fontWeight="700">
                1. Bình điều chế Cl₂
              </text>
            </g>

            {/* Delivery Tube 1 -> 2 with animated Cl2 gas flow */}
            <path d="M175 180H405v52" fill="none" stroke="#7c9689" strokeWidth="6" strokeLinejoin="round" />
            {isGenerating && (
              <path
                d="M175 180H405v52"
                fill="none"
                stroke="#a3e635"
                strokeWidth="3.5"
                strokeDasharray="7 16"
                className="gas-stream"
              />
            )}

            {/* Cluster 2: Interactive Bleaching Test Jar */}
            <g
              transform="translate(420 220)"
              className="svg-button"
              role="button"
              tabIndex={0}
              aria-label="Đổi giấy khô hoặc ẩm"
              onClick={() => update({ damp: !params.damp })}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  update({ damp: !params.damp });
                }
              }}
            >
              <rect x="-42" y="0" width="84" height="154" rx="12" fill="#ffffff66" stroke="#14798f" strokeWidth="2.8" />
              <rect x="-38" y="4" width="76" height="146" rx="9" fill="url(#cl2-gas-color)" />

              {/* Colored litmus / dye paper strip */}
              <rect
                x="-15"
                y="32"
                width="30"
                height="86"
                rx="4"
                fill={isBleached ? '#f8fafc' : stripType === 'wet' ? '#ec4899' : '#dc2626'}
                stroke={isBleached ? '#94a3b8' : '#9d174d'}
                strokeWidth="2"
                className="flask-liquid"
              />
              {/* Water droplets shown on wet paper */}
              {stripType === 'wet' && (
                <g fill={isBleached ? '#38bdf8' : '#bae6fd'}>
                  <circle cx="-6" cy="48" r="2.6" />
                  <circle cx="7" cy="64" r="3" />
                  <circle cx="-5" cy="94" r="2.5" />
                </g>
              )}
              <text x="0" y="80" textAnchor="middle" fill={isBleached ? '#475569' : '#ffffff'} fontSize="9.5" fontWeight="700">
                {isBleached ? 'MẤT MÀU' : stripType === 'wet' ? 'GIẤY ẨM' : 'GIẤY KHÔ'}
              </text>

              <text x="0" y="176" textAnchor="middle" fill="#1b382b" fontSize="12" fontWeight="700">
                2. Bình thử tẩy màu
              </text>
              <text x="0" y="194" textAnchor="middle" fill="#0f6275" fontSize="11" fontWeight="600">
                {stripType === 'wet' ? 'Giấy ẨM (chạm để đổi khô ⇄)' : 'Giấy KHÔ (chạm để đổi ẩm ⇄)'}
              </text>
            </g>

            {/* Delivery Tube 2 -> 3 (Exhaust Scrubber) */}
            <path d="M462 248H605v88" fill="none" stroke="#7c9689" strokeWidth="5" strokeLinejoin="round" />
            {isGenerating && (
              <path
                d="M462 248H605v88"
                fill="none"
                stroke="#a3e635"
                strokeWidth="3"
                strokeDasharray="6 16"
                className="gas-stream"
              />
            )}

            {/* Cluster 3: NaOH Safety Scrubber Beaker */}
            <g transform="translate(605 320)">
              <rect x="-34" y="0" width="68" height="78" rx="8" fill="#ffffff70" stroke="#5c7d6d" strokeWidth="3" />
              <rect x="-30" y="22" width="60" height="52" rx="5" fill="#bae6fd" opacity="0.85" />
              {isGenerating && (
                <g>
                  <circle cx="-6" cy="54" r="3.2" fill="#fff" className="chem-bubble" />
                  <circle cx="8" cy="48" r="3.8" fill="#fff" className="chem-bubble-fast" />
                </g>
              )}
              <text x="0" y="54" textAnchor="middle" fill="#0c4a6e" fontSize="11" fontWeight="700">
                dd NaOH
              </text>
              <text x="0" y="100" textAnchor="middle" fill="#355d48" fontSize="11.5" fontWeight="700">
                3. Cốc hấp thụ khí độc
              </text>
            </g>

            {/* Top Explanation Banner when observing */}
            {isGenerating && (
              <g transform="translate(380 58)">
                <rect x="-220" y="-24" width="440" height="42" rx="12" fill="#ffffffeb" stroke="#a3e635" strokeWidth="1.8" />
                <text x="0" y="2" textAnchor="middle" fill="#1b382b" fontSize="13.5" fontWeight="700">
                  {params.mode === 'formation'
                    ? 'Oxi hóa Cl⁻ tạo khí Cl₂ vàng lục · Khí dư được giữ lại ở cốc NaOH'
                    : isBleached
                    ? 'Cl₂ + H₂O ⇌ HCl + HOCl → HOCl oxi hóa làm nhạt rõ màu giấy ẩm!'
                    : 'Giấy khô không có H₂O tạo HOCl → Không thấy hiện tượng tẩy màu rõ.'}
                </text>
              </g>
            )}

            <ObserveOnStage observed={params.observed} onObserve={() => engine.setParameters({ observed: true })} />
          </svg>

          <div className="stage-actions">
            <button
              type="button"
              className="primary-button"
              aria-label="Quan sát"
              disabled={isGenerating}
              onClick={() => engine.setParameters({ observed: true })}
            >
              {isGenerating ? '✓ Đã mở quan sát' : '▶ Quan sát kịch bản clo'}
            </button>
            <button className="secondary-button" onClick={() => engine.reset()}>
              ↺ Đặt lại
            </button>
            <button className="record-button" disabled={!params.observed} onClick={() => engine.record()}>
              Ghi quan sát
            </button>
          </div>

          <div className="readings readings-expanded" aria-label="Kết quả quan sát Clo">
            <div>
              <span>Sản phẩm trong mô hình</span>
              <strong>{reading.product ?? '—'}</strong>
            </div>
            <div>
              <span>Hiện tượng</span>
              <strong data-testid="chem-observation">{reading.appearance ?? '—'}</strong>
            </div>
            <div>
              <span>Giấy màu</span>
              <strong>{params.damp ? 'Ẩm' : 'Khô'}</strong>
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
              <h2>Mẫu thử & Hóa chất</h2>
              <span>SGK Hóa học 10</span>
            </div>

            <fieldset className="materials" style={{ flexDirection: 'column', gap: '8px' }}>
              <legend>Loại giấy màu đối chứng</legend>
              {[
                ['wet', '1. Giấy màu ẨM (Có nước)'],
                ['dry', '2. Giấy màu KHÔ (Không có nước)'],
              ].map(([typeKey, label]) => (
                <button
                  key={typeKey}
                  type="button"
                  aria-pressed={stripType === typeKey}
                  onClick={() => update({ damp: typeKey === 'wet' })}
                  style={{ width: '100%', justifyContent: 'flex-start' }}
                >
                  {label}
                </button>
              ))}
            </fieldset>

            <label className="field" style={{ marginTop: '14px' }}>
              <span>Chế độ</span>
              <select
                aria-label="Chế độ clo"
                value={params.mode}
                onChange={e => update({ mode: e.target.value as 'formation' | 'bleach' })}
              >
                <option value="formation">Nguyên lí tạo clo</option>
                <option value="bleach">Tính tẩy màu</option>
              </select>
            </label>

            <div style={{ marginTop: '16px', padding: '12px', background: '#f7fee7', border: '1px solid #bef264', borderRadius: '10px', fontSize: '13px', color: '#3f6212' }}>
              <strong>Phương trình phản ứng:</strong>
              <p style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '11.5px', fontWeight: 'bold' }}>
                {reading.equation ?? '—'}
              </p>
              <p style={{ marginTop: '6px', fontSize: '11.5px', color: '#0f6275', fontWeight: 600 }}>
                ↳ {params.mode === 'bleach' ? 'Vai trò của nước trong mô hình tẩy màu.' : 'Oxi hóa ion chloride.'}
              </p>
            </div>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Giải thích bản chất khoa học</h2>
              <span>Bản chất tính tẩy màu của Clo</span>
            </div>
            <div style={{ padding: '14px', background: '#f4faf7', borderRadius: '12px', fontSize: '12.5px', lineHeight: '1.6', color: '#244b38' }}>
              <p>{reading.detail}</p>
            </div>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="chlorine-bleach"
        formulas={<p>Quan sát định tính trong phạm vi kịch bản nháp đã chọn.</p>}
        columns={['Chế độ', 'Giấy', 'Sản phẩm', 'Hiện tượng']}
        rows={state.records.map(row => [
          row.parameters.mode,
          row.parameters.damp ? 'Ẩm' : 'Khô',
          row.reading.product ?? '—',
          row.reading.appearance ?? '—',
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}
