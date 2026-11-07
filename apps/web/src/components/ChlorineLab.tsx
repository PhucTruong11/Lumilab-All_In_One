import { useLab } from '../labSession';
import { ExpandedFooter } from './ExpandedLabParts';

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
            <i /> Thí nghiệm đối chứng giấy khô & giấy ẩm
          </span>
        </div>

        <svg
          className="interactive-stage"
          viewBox="0 0 760 460"
          aria-label="Hệ thống điều chế và thử tính tẩy màu của Clo"
        >
          <defs>
            <linearGradient id="chlorine-bg" x2="1" y2="1">
              <stop stopColor="#fcfdfb" />
              <stop offset="1" stopColor="#f3f7f0" />
            </linearGradient>
            <linearGradient id="cl2-gas-color" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#eab308" stopOpacity={isGenerating ? '0.45' : '0.05'} />
              <stop offset="100%" stopColor="#84cc16" stopOpacity={isGenerating ? '0.65' : '0.05'} />
            </linearGradient>
          </defs>

          {/* Background */}
          <rect x="10" y="5" width="740" height="442" rx="22" fill="url(#chlorine-bg)" />

          {/* Bàn làm việc */}
          <path d="M40 400h680" stroke="#cbd5e1" strokeWidth="6" />

          {/* Cụm 1: Bình cầu điều chế khí Clo (trái) */}
          <g transform="translate(180 230)">
            {/* Bình cầu đáy tròn */}
            <circle cx="0" cy="80" r="65" fill="#ffffff50" stroke="#64748b" strokeWidth="4" />
            {/* Tinh thể thuốc tím KMnO4 màu tím sẫm ở đáy */}
            <ellipse cx="0" cy="120" rx="36" ry="14" fill="#581c87" stroke="#3b0764" strokeWidth="2" />
            <text x="0" y="125" textAnchor="middle" fill="#ffffff" fontSize="10">
              KMnO₄
            </text>

            {/* Khí Clo màu vàng lục bốc lên trong bình cầu */}
            <circle cx="0" cy="70" r="55" fill="url(#cl2-gas-color)" />

            {/* Phễu nhỏ giọt chứa axit HCl đặc */}
            <rect x="-8" y="-70" width="16" height="85" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
            <path d="M-18 -110h36l-18 40z" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
            <text x="25" y="-90" fontSize="11" fill="#475569">
              Minh họa dụng cụ ảo
            </text>
            <text x="0" y="170" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="bold">
              1. Bình điều chế Cl₂
            </text>
          </g>

          {/* Ống dẫn khí Clo sang 2 nhánh đối chứng */}
          <path
            d="M180 180H360v120"
            fill="none"
            stroke={isGenerating ? '#84cc16' : '#94a3b8'}
            strokeWidth="5"
          />

          {/* Cụm 2: Bình thử tính tẩy màu (giữa) */}
          <g transform="translate(420 220)">
            <rect x="-35" y="0" width="70" height="150" rx="10" fill="#ffffff40" stroke="#64748b" strokeWidth="3" />
            {/* Khí vàng lục tràn vào bình thử */}
            <rect x="-32" y="5" width="64" height="140" rx="8" fill="url(#cl2-gas-color)" />

            {/* Mẩu giấy quỳ / giấy màu thử nghiệm */}
            <rect
              x="-12"
              y="35"
              width="24"
              height="80"
              rx="3"
              fill={
                isBleached
                  ? '#ffffff'
                  : stripType === 'wet'
                  ? '#ec4899'
                  : '#dc2626'
              }
              stroke="#64748b"
              strokeWidth="2"
            />
            <text x="0" y="80" textAnchor="middle" fill={isBleached ? '#94a3b8' : '#ffffff'} fontSize="10" fontWeight="bold">
              {isBleached ? 'TẨY TRẮNG' : stripType === 'wet' ? 'GIẤY ẨM' : 'GIẤY KHÔ'}
            </text>

            <text x="0" y="180" textAnchor="middle" fill="#334155" fontSize="12" fontWeight="bold">
              2. Ống thử tẩy màu
            </text>
            <text x="0" y="200" textAnchor="middle" fill="#64748b" fontSize="11">
              {stripType === 'wet' ? 'Mẫu giấy màu ẨM' : 'Mẫu giấy màu KHÔ'}
            </text>
          </g>

          {/* Ống dẫn khí dư sang cốc hấp thụ xút NaOH (phải) */}
          <path
            d="M455 250H600v70"
            fill="none"
            stroke={isGenerating ? '#84cc16' : '#94a3b8'}
            strokeWidth="4"
          />

          {/* Cụm 3: Cốc đựng NaOH hấp thụ khí Clo dư */}
          <g transform="translate(600 320)">
            <rect x="-30" y="0" width="60" height="75" rx="6" fill="#ffffff50" stroke="#64748b" strokeWidth="3" />
            <rect x="-27" y="20" width="54" height="52" fill="#cffafe" opacity="0.8" />
            <text x="0" y="50" textAnchor="middle" fill="#0e7490" fontSize="10" fontWeight="bold">
              NaOH
            </text>
            <text x="0" y="100" textAnchor="middle" fill="#475569" fontSize="11">
              3. Cốc khử độc Cl₂
            </text>
          </g>
        </svg>

        <div className="stage-actions">
          <button className="record-button" disabled={!params.observed} onClick={() => engine.record()}>Ghi quan sát</button>
          <button className="secondary-button" onClick={() => engine.reset()}>Đặt lại</button>
          <button
            type="button"
            className="primary-button"
            aria-label="Quan sát" onClick={() => engine.setParameters({ observed: true })}
          >
            {isGenerating ? '✓ Đã mở quan sát' : '▶ Quan sát kịch bản clo'}
          </button>
        </div>

        <div className="readings readings-expanded" aria-label="Kết quả quan sát Clo">
          <div><span>Sản phẩm trong mô hình</span><strong>{reading.product ?? '—'}</strong></div>
          <div><span>Hiện tượng</span><strong data-testid="chem-observation">{reading.appearance ?? '—'}</strong></div>
          <div><span>Giấy màu</span><strong>{params.damp ? 'Ẩm' : 'Khô'}</strong></div>
          <div><span>Phạm vi</span><strong>Định tính</strong></div>
        </div>
      </section>

      <aside className="experiment-sidebar">
        <section className="parameter-panel">
          <div className="panel-title">
            <h2>Mẫu thử & Hóa chất</h2>
            <span>SGK Hóa học 10</span>
          </div>

          <fieldset className="materials">
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

          <label className="parameter"><span>Chế độ</span><select aria-label="Chế độ clo" value={params.mode}
            onChange={e => update({ mode: e.target.value as 'formation' | 'bleach' })}>
            <option value="formation">Nguyên lí tạo clo</option><option value="bleach">Tính tẩy màu</option>
          </select></label>

          <div style={{ marginTop: '16px', padding: '12px', background: '#fefce8', borderRadius: '10px', fontSize: '13px', color: '#854d0e' }}>
            <strong>Phương trình phản ứng:</strong>
            <p style={{ marginTop: '4px', fontFamily: 'monospace', fontSize: '11px', fontWeight: 'bold' }}>
              {reading.equation ?? '—'}
            </p>
            <p style={{ marginTop: '6px', fontFamily: 'monospace', fontSize: '11px', color: '#0284c7', fontWeight: 'bold' }}>
              ↳ {params.mode === 'bleach' ? 'Vai trò của nước trong mô hình tẩy màu.' : 'Oxi hóa ion chloride.'}
            </p>
          </div>
        </section>

        <section className="chart-panel">
          <div className="panel-title">
            <h2>Giải thích bản chất khoa học</h2>
            <span>Bản chất tính tẩy màu của Clo</span>
          </div>
          <div style={{ padding: '14px', background: '#f8faf9', borderRadius: '12px', fontSize: '12.5px', lineHeight: '1.6', color: '#2d4b3b' }}>
            <p>{reading.detail}</p>
          </div>
        </section>
      </aside>
    </div>
    <ExpandedFooter id="chlorine-bleach" formulas={<p>Quan sát định tính trong phạm vi kịch bản nháp đã chọn.</p>}
      columns={['Chế độ', 'Giấy', 'Sản phẩm', 'Hiện tượng']} rows={state.records.map(row => [row.parameters.mode, row.parameters.damp ? 'Ẩm' : 'Khô', row.reading.product ?? '—', row.reading.appearance ?? '—'])} onClear={() => engine.clearRecords()}/>
    </>
  );
}
