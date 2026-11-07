import { useLab } from '../labSession';
import { ExpandedFooter } from './ExpandedLabParts';

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
            <i /> {params.acid === 'dilute' ? 'Axit loãng (sinh NO)' : 'Axit đặc (sinh NO₂)'}
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
              <stop offset="0%" stopColor="#b45309" stopOpacity={brownGas ? '0.2' : '0'} />
              <stop offset="60%" stopColor="#b45309" stopOpacity={brownGas ? '0.75' : '0'} />
              <stop offset="100%" stopColor="#78350f" stopOpacity={brownGas ? '0.9' : '0'} />
            </linearGradient>
            <linearGradient id="copper-liquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hasStarted ? '#38bdf8' : '#e0f2fe'} />
              <stop offset="100%" stopColor={hasStarted ? '#0284c7' : '#bae6fd'} />
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
                {params.acid === 'dilute'
                  ? 'Khí ban đầu: NO (không màu)'
                  : 'Khí thoát ra: NO₂ (nâu đỏ đậm)'}
              </text>
              <text x="14" y="48" fill="#78350f" fontSize="12">
                {params.acid === 'dilute'
                  ? 'Gặp O₂ không khí: 2NO + O₂ → 2NO₂ (hóa nâu)'
                  : 'NO₂ là khí độc, mùi hắc, độc hại hô hấp'}
              </text>
              <text x="14" y="74" fill="#0369a1" fontSize="12" fontWeight="600">
                Màu dung dịch: Xanh lam (minh họa)
              </text>
            </g>
          )}
        </svg>

        <div className="stage-actions">
          <button className="record-button" disabled={!params.observed} onClick={() => engine.record()}>Ghi quan sát</button>
          <button className="secondary-button" onClick={() => engine.reset()}>Đặt lại</button>
          <button
            type="button"
            className="primary-button"
            aria-label="Quan sát" onClick={() => engine.setParameters({ observed: true })}
          >
            {hasStarted ? '✓ Đã mở quan sát' : '▶ Quan sát Cu với HNO₃'}
          </button>
        </div>

        <div className="readings readings-expanded" aria-label="Kết quả quan sát phản ứng HNO3">
          <div><span>Khí chính trong mô hình</span><strong>{reading.product ?? '—'}</strong></div>
          <div><span>Màu sắc khí quan sát</span><strong data-testid="chem-observation">{reading.appearance ?? '—'}</strong></div>
          <div><span>Kịch bản axit</span><strong>{params.acid === 'dilute' ? 'Loãng' : 'Đặc'}</strong></div>
          <div><span>Phạm vi</span><strong>Định tính</strong></div>
        </div>
      </section>

      <aside className="experiment-sidebar">
        <section className="parameter-panel">
          <div className="panel-title">
            <h2>Kịch bản axit & Không khí</h2>
            <span>SGK Hóa học 11</span>
          </div>

          <fieldset className="materials">
            <legend>Nồng độ axit nitric (HNO₃)</legend>
            {[
              ['dilute', '1. Axit HNO₃ loãng'],
              ['concentrated', '2. Axit HNO₃ đặc'],
            ].map(([concKey, label]) => (
              <button
                key={concKey}
                type="button"
                aria-pressed={params.acid === concKey}
                onClick={() => {
                  update({ acid: concKey as 'dilute' | 'concentrated' });
                }}
                style={{ width: '100%', justifyContent: 'flex-start' }}
              >
                {label}
              </button>
            ))}
          </fieldset>

          <label className="check-row"><input type="checkbox" checked={params.air}
            onChange={e => update({ air: e.target.checked })}/>NO gặp không khí</label>

          <div style={{ marginTop: '16px', padding: '12px', background: '#fefce8', borderRadius: '10px', fontSize: '13px', color: '#854d0e' }}>
            <strong>Phương trình phản ứng:</strong>
            <p style={{ marginTop: '4px', fontFamily: 'monospace', fontWeight: 'bold' }}>{reading.equation ?? '—'}</p>
            {params.observed && params.air && params.acid === 'dilute' && <p>2NO + O₂ → 2NO₂</p>}
          </div>
        </section>

        <section className="chart-panel">
          <div className="panel-title">
            <h2>Giải thích hiện tượng SGK</h2>
            <span>Học liệu Kết nối tri thức · nháp</span>
          </div>
          <div style={{ padding: '14px', background: '#f8faf9', borderRadius: '12px', fontSize: '12.5px', lineHeight: '1.6', color: '#2d4b3b' }}>
            <p>{reading.detail}</p>
          </div>
        </section>
      </aside>
    </div>
    <ExpandedFooter id="copper-nitric" formulas={<p>Quan sát định tính trong phạm vi kịch bản nháp đã chọn.</p>}
      columns={['Axit', 'Không khí', 'Sản phẩm', 'Hiện tượng']} rows={state.records.map(row => [row.parameters.acid, row.parameters.air ? 'Có' : 'Không', row.reading.product ?? '—', row.reading.appearance ?? '—'])} onClear={() => engine.clearRecords()}/>
    </>
  );
}
