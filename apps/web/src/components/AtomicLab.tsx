import { lazy, Suspense } from 'react';
import { useLab } from '../labSession';
import { useSvgDrag } from './useSvgDrag';
import { ChartBoundary } from './AppBoundary';
import { ExpandedFooter, ExpandedReadings, LabSlider } from './ExpandedLabParts';

const Chart = lazy(() => import('./ExpandedCharts').then(m => ({ default: m.AtomicChart })));
const particles = [
  { key: 'protons', label: 'Proton', symbol: 'p⁺', color: '#d57a6e', max: 18, min: 1 },
  { key: 'neutrons', label: 'Neutron', symbol: 'n', color: '#8ea4ae', max: 24, min: 0 },
  { key: 'electrons', label: 'Electron', symbol: 'e⁻', color: '#6f85c4', max: 18, min: 0 },
] as const;
type ParticleKey = (typeof particles)[number]['key'];

const atomicPresets = [
  { label: '¹H (Hiđro)', protons: 1, neutrons: 0, electrons: 1 },
  { label: '¹²C (Cacbon-12)', protons: 6, neutrons: 6, electrons: 6 },
  { label: '¹⁴C (Đồng vị)', protons: 6, neutrons: 8, electrons: 6 },
  { label: '²³Na (Natri)', protons: 11, neutrons: 12, electrons: 11 },
  { label: '²³Na⁺ (Cation)', protons: 11, neutrons: 12, electrons: 10 },
  { label: '³⁵Cl⁻ (Anion)', protons: 17, neutrons: 18, electrons: 18 },
];

export function AtomicLab() {
  const { engine, state } = useLab('atomic');
  const { parameters: p, reading: r } = state;

  function change(key: ParticleKey, amount: number) {
    const particle = particles.find(item => item.key === key)!;
    engine.setParameters({ [key]: Math.max(particle.min, Math.min(particle.max, p[key] + amount)) });
  }

  const { drag, start, handlers } = useSvgDrag((key, x, y, moved) => {
    if (key === 'remove-electron') {
      if (!moved || (x > 650 && y > 365)) change('electrons', -1);
      return;
    }
    const particle = particles.find(item => item.key === key);
    if (!particle) return;
    const radius = Math.hypot(x - 400, y - 210);
    if (!moved || (particle.key === 'electrons' ? radius <= 185 : radius <= 65)) change(particle.key, 1);
  });

  const chargeSuperscript =
    r.charge_e === 0
      ? ''
      : r.charge_e === 1
        ? '+'
        : r.charge_e === -1
          ? '−'
          : r.charge_e > 1
            ? `${r.charge_e}+`
            : `${Math.abs(r.charge_e)}−`;
  const speciesColor = r.charge_e === 0 ? '#28775c' : r.charge_e > 0 ? '#b8542c' : '#4a6bb5';

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel" aria-label="Bàn mô hình nguyên tử">
          <div className="panel-title">
            <h2>Lắp ghép nguyên tử, đồng vị & ion</h2>
            <span className="mode-chip">
              <i /> Mô hình lớp vỏ 2 · 8 · 8 (Z ≤ 18)
            </span>
          </div>

          <svg
            className="interactive-stage"
            viewBox="0 0 760 470"
            {...handlers}
            aria-label="Kéo proton neutron vào hạt nhân và electron vào vỏ"
          >
            <defs>
              <linearGradient id="atomic-bg" x2="1" y2="1">
                <stop stopColor="#f5f3fa" />
                <stop offset="1" stopColor="#edf4f2" />
              </linearGradient>
              <radialGradient id="nucleus-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#d57a6e" stopOpacity="0.28" />
                <stop offset="100%" stopColor="#d57a6e" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect x="10" y="5" width="740" height="452" rx="22" fill="url(#atomic-bg)" />

            {/* Thẻ Kí hiệu Nguyên tử chuẩn (Nuclide Card) */}
            <g transform="translate(26 32)">
              <rect x="0" y="0" width="166" height="224" rx="16" fill="#ffffffe6" stroke="#dcd4e8" strokeWidth="2" />
              <text x="83" y="24" textAnchor="middle" fill="#6b5882" fontSize="9.5" fontWeight="700" letterSpacing="0.8">
                KÍ HIỆU NGUYÊN TỬ
              </text>
              <text x="83" y="44" textAnchor="middle" fill="#3a2b4c" fontSize="14" fontWeight="700">
                {r.name}
              </text>

              {/* Kí hiệu AZX^q */}
              <text x="46" y="84" textAnchor="end" fill="#6d5a82" fontSize="15" fontWeight="700">
                {r.massNumber}
              </text>
              <text x="46" y="114" textAnchor="end" fill="#d57a6e" fontSize="15" fontWeight="700">
                {r.atomicNumber}
              </text>
              <text x="84" y="106" textAnchor="middle" fill="#2d223b" fontSize="40" fontWeight="700">
                {r.symbol}
              </text>
              {chargeSuperscript && (
                <text x="124" y="82" textAnchor="start" fill={speciesColor} fontSize="15" fontWeight="700">
                  {chargeSuperscript}
                </text>
              )}

              <text x="83" y="140" textAnchor="middle" fill="#5e4e73" fontSize="12" fontWeight="600">
                Z = {r.atomicNumber} · A = {r.massNumber}
              </text>
              <rect x="16" y="152" width="134" height="24" rx="7" fill="#f3eff8" />
              <text x="83" y="168" textAnchor="middle" fill={speciesColor} fontSize="11" fontWeight="700">
                {r.species}
              </text>
              <text x="83" y="194" textAnchor="middle" fill="#687a70" fontSize="10" fontWeight="600">
                Phân bố e⁻ (K · L · M):
              </text>
              <text x="83" y="210" textAnchor="middle" fill="#28775c" fontSize="12" fontWeight="700">
                {r.shells.filter((count, idx) => count > 0 || idx === 0).join(' · ')}
              </text>
            </g>

            {/* Các vòng lớp vỏ electron K, L, M */}
            {[85, 125, 165].map((radius, i) => (
              <circle
                key={radius}
                cx="400"
                cy="210"
                r={radius}
                fill="none"
                stroke="#c8bed8"
                strokeWidth="1.6"
                strokeDasharray={i === 2 ? '4 5' : undefined}
              />
            ))}

            {/* Bảng chú thích 3 lớp vỏ K, L, M đặt gọn góc trên phải (x=602..730), không bao giờ đè lên hạt electron */}
            <g transform="translate(602 32)">
              <rect x="0" y="0" width="126" height="106" rx="12" fill="#ffffffdc" stroke="#dcd4e8" />
              <text x="63" y="20" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#6b5882">
                LỚP VỎ ELECTRON
              </text>
              {(['K (tối đa 2)', 'L (tối đa 8)', 'M (tối đa 8)'] as const).map((label, idx) => (
                <g key={label} transform={`translate(12 ${38 + idx * 22})`}>
                  <text x="0" y="0" fontSize="10" fontWeight="600" fill="#5e4e73">
                    {label}:
                  </text>
                  <text x="102" y="0" textAnchor="end" fontSize="10.5" fontWeight="700" fill="#28775c">
                    {r.shells[idx]} e⁻
                  </text>
                </g>
              ))}
            </g>

            {/* Vùng Hạt nhân */}
            <circle cx="400" cy="210" r="64" fill="url(#nucleus-glow)" />
            <circle
              data-testid="atomic-nucleus"
              cx="400"
              cy="210"
              r="55"
              fill="#e9dce850"
              stroke={drag?.key === 'protons' || drag?.key === 'neutrons' ? '#9e7bb8' : '#d5c6dc'}
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            {Array.from({ length: p.protons + p.neutrons }, (_, i) => {
              const radius = 6 * Math.sqrt(i);
              const angle = i * 2.39996;
              return (
                <circle
                  key={i}
                  cx={400 + Math.cos(angle) * radius}
                  cy={210 + Math.sin(angle) * radius}
                  r="7.5"
                  fill={i < p.protons ? '#d57a6e' : '#8ea4ae'}
                  stroke="#ffffffcc"
                  strokeWidth="1.2"
                />
              );
            })}

            {/* Các hạt Electron trên lớp vỏ */}
            {r.shells.flatMap((count, shell) =>
              Array.from({ length: count }, (_, i) => {
                const angle = (i * Math.PI * 2) / count - Math.PI / 2 + shell * 0.25;
                const x = 400 + (85 + shell * 40) * Math.cos(angle);
                const y = 210 + (85 + shell * 40) * Math.sin(angle);
                return (
                  <g
                    key={`${shell}-${i}`}
                    role="button"
                    tabIndex={0}
                    aria-label="Bớt một electron"
                    className="svg-draggable"
                    onPointerDown={e => start(e, 'remove-electron')}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        change('electrons', -1);
                      }
                    }}
                  >
                    <circle cx={x} cy={y} r="15" fill="transparent" />
                    <circle cx={x} cy={y} r="8" fill="#6f85c4" stroke="white" strokeWidth="2" />
                    <text x={x} y={y + 3} textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
                      −
                    </text>
                  </g>
                );
              })
            )}

            {/* Khay hạt cơ bản bên dưới */}
            <path d="M70 388h620" stroke="#dad2e4" strokeWidth="2" />
            {particles.map((particle, i) => (
              <g
                key={particle.key}
                transform={`translate(${220 + i * 160} 426)`}
                data-testid={`particle-${particle.key}`}
                role="button"
                tabIndex={0}
                aria-label={`Thêm một ${particle.label.toLowerCase()}`}
                className="svg-draggable"
                onPointerDown={e => start(e, particle.key)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    change(particle.key, 1);
                  }
                }}
              >
                <rect x="-66" y="-26" width="132" height="50" rx="12" fill="white" stroke="#d5cce0" strokeWidth="1.5" />
                <circle cx="-38" r="13" fill={particle.color} />
                <text x="-38" y="4" textAnchor="middle" fill="white" fontSize="11" fontWeight="700">
                  {particle.symbol}
                </text>
                <text x="16" y="-2" textAnchor="middle" fill="#3a2b4c" fontSize="11.5" fontWeight="700">
                  {particle.label}
                </text>
                <text x="16" y="12" textAnchor="middle" fill="#6d5c80" fontSize="9.5" fontWeight="600">
                  Đang có: {p[particle.key]}
                </text>
              </g>
            ))}

            <g data-testid="atomic-remove-target">
              <rect
                x="665"
                y="395"
                width="62"
                height="56"
                rx="12"
                fill="#ebe4f2"
                stroke="#bba9ce"
                strokeDasharray="4 4"
              />
              <text x="696" y="421" textAnchor="middle" fill="#6d5885" fontSize="10.5" fontWeight="700">
                Bớt e⁻
              </text>
              <text x="696" y="436" textAnchor="middle" fill="#89759e" fontSize="8.5">
                (Thả vào)
              </text>
            </g>

            {drag?.moved && (
              <circle
                cx={drag.x}
                cy={drag.y}
                r="14"
                fill={particles.find(item => item.key === drag.key)?.color ?? '#6f85c4'}
                opacity=".85"
                pointerEvents="none"
              />
            )}
          </svg>

          <div className="stage-actions">
            <button className="primary-button" onClick={() => engine.setParameters({ electrons: p.protons })}>
              Cân bằng electron
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
              { label: 'Số hiệu nguyên tử Z', value: String(r.atomicNumber), testId: 'atomic-number' },
              { label: 'Số khối A', value: String(r.massNumber), testId: 'atomic-mass' },
              {
                label: 'Điện tích q/e',
                value: r.charge_e > 0 ? `+${r.charge_e}` : String(r.charge_e),
                testId: 'atomic-charge',
              },
            ]}
          />
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Số hạt cơ bản</h2>
              <span>Z ≤ 18 · A = Z + N</span>
            </div>
            {particles.map(particle => (
              <div key={particle.key}>
                <LabSlider
                  label={`Số ${particle.label.toLowerCase()}`}
                  unit="hạt"
                  min={particle.min}
                  max={particle.max}
                  value={p[particle.key]}
                  onChange={value => engine.setParameters({ [particle.key]: value })}
                />
                <div className="particle-actions">
                  <button
                    className="text-button"
                    disabled={p[particle.key] === particle.min}
                    onClick={() => change(particle.key, -1)}
                  >
                    Bớt 1 {particle.label.toLowerCase()}
                  </button>
                  <button
                    className="text-button"
                    disabled={p[particle.key] === particle.max}
                    onClick={() => change(particle.key, 1)}
                  >
                    Thêm 1 {particle.label.toLowerCase()}
                  </button>
                </div>
              </div>
            ))}

            <div className="preset-row" aria-label="Mẫu nguyên tử đồng vị và ion">
              {atomicPresets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  className={`preset-pill ${
                    p.protons === preset.protons &&
                    p.neutrons === preset.neutrons &&
                    p.electrons === preset.electrons
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    engine.setParameters({
                      protons: preset.protons,
                      neutrons: preset.neutrons,
                      electrons: preset.electrons,
                    })
                  }
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <p className="lab-notice">
              Kéo hạt vào mô hình hoặc chọn mẫu đồng vị / ion bên trên. Sơ đồ lớp vỏ 2, 8, 8 minh họa cấu hình, không biểu diễn đám mây orbital thật.
            </p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>So sánh số hạt</h2>
              <span>p · n · e</span>
            </div>
            <ChartBoundary>
              <Suspense fallback={<div className="chart-area chart-loading">Đang mở đồ thị…</div>}>
                <Chart parameters={p} />
              </Suspense>
            </ChartBoundary>
          </section>
        </aside>
      </div>

      <ExpandedFooter
        id="atomic"
        formulas={
          <p>
            <strong>A = Z + N · N = A − Z · q/e = Z − nₑ</strong>
          </p>
        }
        columns={['Nguyên tố', 'p', 'n', 'e', 'A', 'q/e']}
        rows={state.records.map(row => [
          row.reading.symbol,
          row.parameters.protons,
          row.parameters.neutrons,
          row.parameters.electrons,
          row.reading.massNumber,
          row.reading.charge_e,
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}
