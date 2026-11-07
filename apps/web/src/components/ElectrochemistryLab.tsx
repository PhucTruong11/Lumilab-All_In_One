import { lazy, Suspense, useState } from 'react';
import { electrodes, type Electrode } from '@lumilab/lab-engine';
import { useLab } from '../labSession';
import { useSvgDrag } from './useSvgDrag';
import { ChartBoundary } from './AppBoundary';
import { ExpandedFooter, ExpandedReadings } from './ExpandedLabParts';

const Chart = lazy(() => import('./ExpandedCharts').then(m => ({ default: m.ElectrochemistryChart })));
const keys = Object.keys(electrodes) as Electrode[];
const cellPresets: { label: string; left: Electrode; right: Electrode }[] = [
  { label: 'Zn–Cu (+1,10 V)', left: 'zn', right: 'cu' },
  { label: 'Cu–Zn (−1,10 V)', left: 'cu', right: 'zn' },
  { label: 'Zn–Ag (+1,56 V)', left: 'zn', right: 'ag' },
  { label: 'Cu–Ag (+0,46 V)', left: 'cu', right: 'ag' },
];

function Plate({ metal }: { metal: Electrode }) {
  return (
    <g>
      <rect x="-17" y="-55" width="34" height="110" rx="5" fill={electrodes[metal].color} stroke="#6e837b" strokeWidth="2" />
      <path d="M-9-47v90" stroke="#ffffff90" strokeWidth="3" />
      <text y="5" textAnchor="middle" fill="#2d3e37" fontSize="13" fontWeight="700">
        {electrodes[metal].symbol}
      </text>
    </g>
  );
}

function IonBadge({
  label,
  fill,
  stroke,
  textColor,
  r = 10.5,
}: {
  label: string;
  fill: string;
  stroke: string;
  textColor: string;
  r?: number;
}) {
  return (
    <g pointerEvents="none">
      <circle r={r} fill={fill} stroke={stroke} strokeWidth="1.3" />
      <text y="3" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={textColor}>
        {label}
      </text>
    </g>
  );
}

export function ElectrochemistryLab() {
  const { engine, state } = useLab('electrochemistry');
  const { parameters: p, reading: r } = state;
  const [selected, setSelected] = useState<Electrode | null>(null);
  const [notice, setNotice] = useState('Kéo điện cực vào cốc trái hoặc phải để so sánh thế điện cực.');

  function install(metal: Electrode, side: 'left' | 'right') {
    engine.setParameters({ [side]: metal });
    setSelected(null);
    setNotice(
      `Đã đổi điện cực ${side === 'left' ? 'trái' : 'phải'} thành ${electrodes[metal].symbol}; dung dịch ${electrodes[metal].ion} 1,0 M.`
    );
  }

  function swapSides() {
    engine.setParameters({ left: p.right, right: p.left });
    setSelected(null);
    setNotice(`Đã đảo vị trí hai bán pin (${electrodes[p.right].symbol} ↔ ${electrodes[p.left].symbol}).`);
  }

  const { drag, start, handlers } = useSvgDrag((key, x, y, moved) => {
    if (!moved) {
      setSelected(key as Electrode);
      setNotice(`Đã chọn ${electrodes[key as Electrode].symbol}; chạm cốc trái hoặc phải để đặt.`);
      return;
    }
    if (y >= 140 && y <= 330 && x >= 105 && x <= 315) install(key as Electrode, 'left');
    else if (y >= 140 && y <= 330 && x >= 445 && x <= 655) install(key as Electrode, 'right');
    else setNotice('Đưa điện cực vào một trong hai cốc bán pin.');
  });

  const flowing = p.bridgeConnected && r.emf_V > 0;

  return (
    <>
      <div className="workbench-grid interactive-lab">
        <section className="stage-panel" aria-label="Bàn pin điện hóa">
          <div className="panel-title">
            <h2>Lắp ghép pin điện hóa Galvanic</h2>
            <span className="mode-chip">
              <i /> 25°C · 1 bar · Hoạt độ ion = 1
            </span>
          </div>

          <svg
            className="interactive-stage"
            viewBox="0 0 760 470"
            {...handlers}
            aria-label="Kéo điện cực vào hai cốc của pin"
          >
            <defs>
              <linearGradient id="electro-bg" x2="1" y2="1">
                <stop stopColor="#f4f5fb" />
                <stop offset="1" stopColor="#ecf4f1" />
              </linearGradient>
            </defs>

            <rect x="10" y="5" width="740" height="452" rx="22" fill="url(#electro-bg)" />

            {/* Dây dẫn mạch ngoài & dòng electron */}
            <path
              d="M210 158V68h98m144 0h98v90"
              stroke="#8f95ab"
              strokeWidth="5"
              fill="none"
              strokeLinejoin="round"
            />
            {flowing && (
              <g pointerEvents="none">
                <path
                  d={
                    r.anodeSide === 'left'
                      ? 'M210 158V68h98M452 68h98v90'
                      : 'M550 158V68H452M308 68H210v90'
                  }
                  stroke="#28775c"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="6 8"
                  className="flowing-current"
                />
                {/* Các hạt electron (e⁻) di chuyển từ Anode lên dây dẫn sang Cathode */}
                {[0, 1].map(idx => {
                  const anodeX = r.anodeSide === 'left' ? 210 : 550;
                  const cathodeX = r.anodeSide === 'left' ? 550 : 210;
                  return (
                    <g key={`e-wire-${idx}`}>
                      <g transform={`translate(${anodeX} 114)`}>
                        <g className={`electron-move-up gas-delay-${idx * 2}`}>
                          <circle r="7.5" fill="#1f6349" stroke="#ffffff" strokeWidth="1.2" />
                          <text y="2.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ffffff">
                            e⁻
                          </text>
                        </g>
                      </g>
                      <g transform={`translate(${cathodeX} 114)`}>
                        <g className={`electron-move-down gas-delay-${idx * 2 + 1}`}>
                          <circle r="7.5" fill="#1f6349" stroke="#ffffff" strokeWidth="1.2" />
                          <text y="2.5" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ffffff">
                            e⁻
                          </text>
                        </g>
                      </g>
                    </g>
                  );
                })}
              </g>
            )}

            {/* Đồng hồ đo điện áp (Voltmeter) — bố cục 3 tầng tách biệt */}
            <rect x="306" y="18" width="148" height="86" rx="16" fill="#ffffff" stroke="#b8b2ca" strokeWidth="2.5" />
            <circle cx="322" cy="68" r="4.5" fill="#4f6d8a" />
            <text x="322" y="42" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#4f6d8a">
              COM(−)
            </text>
            <circle cx="438" cy="68" r="4.5" fill="#b83b5e" />
            <text x="438" y="42" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#b83b5e">
              V(+)
            </text>
            <text x="380" y="38" textAnchor="middle" fill="#6f5d85" fontSize="9" fontWeight="700">
              U(PHẢI − TRÁI)
            </text>
            <text
              x="380"
              y="71"
              textAnchor="middle"
              fill={r.meterVoltage_V === null ? '#8a8298' : r.meterVoltage_V >= 0 ? '#28775c' : '#b83270'}
              fontSize="20"
              fontWeight="700"
            >
              {r.meterVoltage_V === null
                ? '—'
                : `${r.meterVoltage_V > 0 ? '+' : ''}${r.meterVoltage_V.toFixed(2)} V`}
            </text>
            <text x="380" y="92" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#776a8a">
              {p.bridgeConnected ? `E°pin = ${r.emf_V.toFixed(2)} V` : 'Mạch hở (Thiếu cầu muối)'}
            </text>

            {/* Hai cốc bán pin Trái & Phải */}
            {(['left', 'right'] as const).map((side, i) => {
              const x = i ? 550 : 210;
              const metal = electrodes[p[side]];
              const isAnode = r.anodeSide === side;
              const signStr = metal.potential_V >= 0 ? `+${metal.potential_V.toFixed(2)}` : metal.potential_V.toFixed(2);
              const ionFill = p[side] === 'cu' ? '#dff2fa' : p[side] === 'ag' ? '#f3f4f8' : '#e8f5ef';
              const ionStroke = p[side] === 'cu' ? '#388bac' : p[side] === 'ag' ? '#64748b' : '#28775c';
              const ionText = p[side] === 'cu' ? '#1c5a73' : p[side] === 'ag' ? '#334155' : '#1f5e46';
              return (
                <g key={side}>
                  <g
                    role="button"
                    tabIndex={0}
                    aria-label={`Đặt điện cực vào cốc ${i ? 'phải' : 'trái'}`}
                    className="svg-button"
                    onClick={() => {
                      if (selected) install(selected, side);
                    }}
                    onKeyDown={e => {
                      if (selected && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        install(selected, side);
                      }
                    }}
                  >
                    <rect
                      data-testid={`cell-target-${side}`}
                      x={x - 95}
                      y="145"
                      width="190"
                      height="195"
                      rx="20"
                      fill={drag || selected ? '#e9e4f460' : 'transparent'}
                      stroke={drag || selected ? '#9e88ba' : 'transparent'}
                      strokeDasharray="5 5"
                    />
                    <path
                      d={`M${x - 72} 177v128q0 18 18 18h108q18 0 18-18V177`}
                      fill="#ffffffb8"
                      stroke="#95a9b0"
                      strokeWidth="2.5"
                    />
                    <path
                      d={`M${x - 69} 224h138v79q0 17-16 17h-106q-16 0-16-17z`}
                      fill={p[side] === 'cu' ? '#95cbe0' : p[side] === 'ag' ? '#dce3ec' : '#d2e4de'}
                      opacity=".74"
                    />
                    <path
                      d={`M${x - 69} 224q69-4 138 0`}
                      fill="none"
                      stroke={p[side] === 'cu' ? '#5ea4c4' : p[side] === 'ag' ? '#94a3b8' : '#7ab39e'}
                      strokeWidth="1.8"
                    />
                  </g>

                  <g
                    transform={`translate(${x} 202)`}
                    data-testid={`cell-electrode-${side}`}
                    role="button"
                    tabIndex={0}
                    aria-label={`Điện cực ${i ? 'phải' : 'trái'} ${metal.symbol}`}
                    className="svg-draggable"
                    onPointerDown={e => start(e, p[side])}
                    onKeyDown={e => {
                      if (e.key === 'Enter') setSelected(p[side]);
                    }}
                  >
                    <Plate metal={p[side]} />
                    {/* Viền phản ứng trên bề mặt ngập nước của điện cực: Anode tan ra / Cathode bám kim loại */}
                    {flowing && (
                      <rect
                        x="-18"
                        y="22"
                        width="36"
                        height="34"
                        rx="4"
                        fill="none"
                        stroke={isAnode ? '#d97706' : '#15803d'}
                        strokeWidth="2.8"
                        strokeDasharray={isAnode ? '4 3' : undefined}
                        className="electrode-active-glow"
                      />
                    )}
                  </g>

                  {/* Hiệu ứng chuyển động của các ion trong dung dịch bán pin */}
                  {flowing ? (
                    <g pointerEvents="none">
                      {isAnode ? (
                        /* Anode (Oxi hóa): M(s) → Mⁿ⁺(aq) + ne⁻ (ion phóng từ thanh kim loại ra dung dịch) */
                        <>
                          <g transform={`translate(${x - 16} 238)`}>
                            <g className="ion-oxidize-out-left gas-delay-0">
                              <IonBadge label={metal.ion} fill="#fff7ed" stroke="#d97706" textColor="#9a3412" />
                            </g>
                          </g>
                          <g transform={`translate(${x + 16} 244)`}>
                            <g className="ion-oxidize-out-right gas-delay-1">
                              <IonBadge label={metal.ion} fill="#fff7ed" stroke="#d97706" textColor="#9a3412" />
                            </g>
                          </g>
                          <g transform={`translate(${x - 16} 258)`}>
                            <g className="ion-oxidize-out-left gas-delay-2">
                              <IonBadge label={metal.ion} fill="#fff7ed" stroke="#d97706" textColor="#9a3412" />
                            </g>
                          </g>
                          <g transform={`translate(${x + 16} 262)`}>
                            <g className="ion-oxidize-out-right gas-delay-3">
                              <IonBadge label={metal.ion} fill="#fff7ed" stroke="#d97706" textColor="#9a3412" />
                            </g>
                          </g>
                        </>
                      ) : (
                        /* Cathode (Khử): Mⁿ⁺(aq) + ne⁻ → M(s) (ion từ dung dịch tiến vào bám lên thanh kim loại) */
                        <>
                          <g transform={`translate(${x - 16} 238)`}>
                            <g className="ion-reduce-in-left gas-delay-0">
                              <IonBadge label={metal.ion} fill={ionFill} stroke={ionStroke} textColor={ionText} />
                            </g>
                          </g>
                          <g transform={`translate(${x + 16} 244)`}>
                            <g className="ion-reduce-in-right gas-delay-1">
                              <IonBadge label={metal.ion} fill={ionFill} stroke={ionStroke} textColor={ionText} />
                            </g>
                          </g>
                          <g transform={`translate(${x - 16} 258)`}>
                            <g className="ion-reduce-in-left gas-delay-2">
                              <IonBadge label={metal.ion} fill={ionFill} stroke={ionStroke} textColor={ionText} />
                            </g>
                          </g>
                          <g transform={`translate(${x + 16} 262)`}>
                            <g className="ion-reduce-in-right gas-delay-3">
                              <IonBadge label={metal.ion} fill={ionFill} stroke={ionStroke} textColor={ionText} />
                            </g>
                          </g>
                        </>
                      )}
                    </g>
                  ) : (
                    /* Khi mạch hở hoặc 2 cực giống nhau: các ion điện li dao động nhẹ tại chỗ trong dung dịch */
                    <g pointerEvents="none">
                      {[
                        [-44, 244, 0],
                        [44, 246, 1],
                        [-38, 268, 2],
                        [38, 270, 3],
                      ].map(([dx, iy, dIdx]) => (
                        <g key={dIdx} transform={`translate(${x + dx} ${iy})`}>
                          <g className={`precip-crystal-drift gas-delay-${dIdx}`}>
                            <IonBadge label={metal.ion} fill={ionFill} stroke={ionStroke} textColor={ionText} />
                          </g>
                        </g>
                      ))}
                    </g>
                  )}

                  {/* Nhãn dung dịch & thế chuẩn đặt gọn sát đáy cốc (y = 285..318), tách biệt với vùng ion */}
                  <rect x={x - 62} y="285" width="124" height="32" rx="7" fill="#ffffffdf" />
                  <text x={x} y="299" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#355261">
                    {metal.ion}(aq) · 1M
                  </text>
                  <text x={x} y="312" textAnchor="middle" fontSize="9" fontWeight="600" fill="#546d7a">
                    E° = {signStr} V
                  </text>

                  {/* Nhãn vai trò bán pin */}
                  <rect
                    x={x - 82}
                    y="334"
                    width="164"
                    height="26"
                    rx="8"
                    fill={r.anodeSide === null ? '#eceaf2' : isAnode ? '#fdf2e9' : '#e8f5ef'}
                    stroke={r.anodeSide === null ? '#d5d0e0' : isAnode ? '#e6c3a3' : '#a8d5be'}
                  />
                  <text
                    x={x}
                    y="351"
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill={r.anodeSide === null ? '#6e6580' : isAnode ? '#9c5221' : '#1f6349'}
                  >
                    {r.anodeSide === null
                      ? 'Hai cực cùng thế E°'
                      : `${isAnode ? 'Anode (−) · Oxi hóa' : 'Cathode (+) · Khử'}`}
                  </text>
                </g>
              );
            })}

            {/* Cầu muối KNO3 */}
            <g
              data-testid="salt-bridge"
              role="button"
              tabIndex={0}
              aria-label="Bật tắt cầu muối"
              className="svg-button"
              onClick={() => engine.setParameters({ bridgeConnected: !p.bridgeConnected })}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  engine.setParameters({ bridgeConnected: !p.bridgeConnected });
                }
              }}
              opacity={p.bridgeConnected ? 1 : 0.25}
            >
              <path
                d="M270 255v-85q0-24 25-24h170q25 0 25 24v85"
                fill="none"
                stroke="#b2a4ca"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d="M270 255v-85q0-24 25-24h170q25 0 25 24v85"
                fill="none"
                stroke="#e9e3f4"
                strokeWidth="10"
                strokeLinecap="round"
              />
              <rect x="310" y="125" width="140" height="40" fill="transparent" />
            </g>

            {/* Hiệu ứng các ion K⁺ và NO₃⁻ di cư ngược chiều nhau trong cầu muối để trung hòa điện tích */}
            {flowing && (
              <g pointerEvents="none">
                {/* Trên nhánh ngang của cầu muối (y = 146) */}
                {[0, 2].map(dIdx => (
                  <g key={`bridge-k-${dIdx}`} transform="translate(380 146)">
                    <g
                      className={`${
                        r.anodeSide === 'left' ? 'bridge-ion-right' : 'bridge-ion-left'
                      } gas-delay-${dIdx}`}
                    >
                      <IonBadge label="K⁺" fill="#e6f7f0" stroke="#28775c" textColor="#18543f" r={9.5} />
                    </g>
                  </g>
                ))}
                {[1, 3].map(dIdx => (
                  <g key={`bridge-no3-${dIdx}`} transform="translate(380 146)">
                    <g
                      className={`${
                        r.anodeSide === 'left' ? 'bridge-ion-left' : 'bridge-ion-right'
                      } gas-delay-${dIdx}`}
                    >
                      <IonBadge label="NO₃⁻" fill="#f5eefc" stroke="#7c5aa6" textColor="#4c3270" r={10.5} />
                    </g>
                  </g>
                ))}
                {/* Tại hai chân ống cầu muối đi xuống hai cốc (x = 270 và x = 490) */}
                <g transform={`translate(${r.anodeSide === 'left' ? 270 : 490} 238)`}>
                  <g className="bridge-leg-down gas-delay-1">
                    <IonBadge label="NO₃⁻" fill="#f5eefc" stroke="#7c5aa6" textColor="#4c3270" r={10} />
                  </g>
                </g>
                <g transform={`translate(${r.anodeSide === 'left' ? 490 : 270} 238)`}>
                  <g className="bridge-leg-down gas-delay-2">
                    <IonBadge label="K⁺" fill="#e6f7f0" stroke="#28775c" textColor="#18543f" r={9.5} />
                  </g>
                </g>
              </g>
            )}

            {/* Khung thông tin cầu muối nằm gọn giữa 2 chân ống chữ U (x=292..468, y=166..230) */}
            <rect x="292" y="166" width="176" height="62" rx="10" fill="#ffffffdc" stroke="#dcd5e8" />
            <text x="380" y="183" textAnchor="middle" fill="#5e4d78" fontSize="9.5" fontWeight="700">
              CẦU MUỐI KNO₃ {p.bridgeConnected ? '(Đang nối)' : '(Đã tháo)'}
            </text>
            <text x="380" y="200" textAnchor="middle" fill="#6b5c82" fontSize="9.5" fontWeight="600">
              {flowing
                ? r.anodeSide === 'left'
                  ? 'Ion: ← NO₃⁻ · K⁺ →'
                  : 'Ion: ← K⁺ · NO₃⁻ →'
                : 'Chạm cầu muối để đóng/ngắt'}
            </text>
            <text x="380" y="218" textAnchor="middle" fill="#28775c" fontSize="10" fontWeight="700">
              e⁻ ngoài: {p.bridgeConnected ? r.electronDirection : 'mạch hở'}
            </text>

            {/* Khay chọn điện cực kim loại bên dưới */}
            <path d="M70 374h620" stroke="#d5dde3" strokeWidth="2" />
            <text x="72" y="391" fontSize="9.5" fontWeight="700" fill="#687885" letterSpacing="0.8">
              KHAY ĐIỆN CỰC CHUẨN (KÉO VÀO CỐC TRÁI / PHẢI)
            </text>
            {keys.map((key, i) => (
              <g
                key={key}
                transform={`translate(${225 + i * 155} 426) scale(.38)`}
                data-testid={`electrode-${key}`}
                role="button"
                tabIndex={0}
                aria-label={`Chọn điện cực ${electrodes[key].symbol}`}
                className="svg-draggable"
                onPointerDown={e => start(e, key)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelected(key);
                  }
                }}
              >
                <rect
                  x="-95"
                  y="-72"
                  width="190"
                  height="156"
                  rx="20"
                  fill={selected === key ? '#eef7f2' : 'white'}
                  stroke={selected === key ? '#28775c' : '#cbd5df'}
                  strokeWidth="4"
                />
                <g transform="translate(-38 0)">
                  <Plate metal={key} />
                </g>
                <text x="36" y="-4" textAnchor="middle" fontSize="24" fontWeight="700" fill="#2d3e37">
                  {electrodes[key].symbol}
                </text>
                <text x="36" y="24" textAnchor="middle" fontSize="18" fill="#647886">
                  {electrodes[key].potential_V >= 0 ? `+${electrodes[key].potential_V}V` : `${electrodes[key].potential_V}V`}
                </text>
              </g>
            ))}

            {drag?.moved && (
              <g transform={`translate(${drag.x} ${drag.y}) rotate(12)`} pointerEvents="none">
                <Plate metal={drag.key as Electrode} />
              </g>
            )}
          </svg>

          <div className="stage-actions">
            <button
              className="primary-button"
              onClick={() => engine.setParameters({ bridgeConnected: !p.bridgeConnected })}
            >
              {p.bridgeConnected ? 'Tháo cầu muối' : 'Nối cầu muối'}
            </button>
            <button className="secondary-button" onClick={swapSides}>
              ⇄ Đảo hai cực
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                engine.reset();
                setSelected(null);
              }}
            >
              ↺ Đặt lại
            </button>
            <button className="record-button" onClick={() => engine.record()}>
              ＋ Ghi số đo
            </button>
          </div>

          <ExpandedReadings
            items={[
              {
                label: 'U phải−trái',
                value: r.meterVoltage_V === null ? '—' : r.meterVoltage_V.toFixed(2),
                unit: 'V',
                testId: 'cell-voltage',
              },
              { label: 'E°pin lý thuyết', value: r.emf_V.toFixed(2), unit: 'V', testId: 'cell-emf' },
              { label: 'Electron trao đổi', value: String(r.exchangedElectrons), unit: 'e⁻' },
            ]}
          />
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Chọn cặp điện cực</h2>
              <span>Hoạt độ ion = 1,0 M</span>
            </div>
            <div className="solution-selectors">
              {(['left', 'right'] as const).map(side => (
                <label key={side}>
                  Điện cực {side === 'left' ? 'trái (COM −)' : 'phải (V +)'}
                  <select
                    aria-label={`Điện cực ${side === 'left' ? 'trái' : 'phải'}`}
                    value={p[side]}
                    onChange={e => install(e.target.value as Electrode, side)}
                  >
                    {keys.map(key => (
                      <option key={key} value={key}>
                        {electrodes[key].symbol} · {electrodes[key].name} ({electrodes[key].potential_V >= 0 ? '+' : ''}
                        {electrodes[key].potential_V.toFixed(2)} V)
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="preset-row" aria-label="Cặp pin điện hóa mẫu">
              {cellPresets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  className={`preset-pill ${p.left === preset.left && p.right === preset.right ? 'active' : ''}`}
                  onClick={() => {
                    engine.setParameters({ left: preset.left, right: preset.right, bridgeConnected: true });
                    setNotice(`Đã chọn cấu hình mẫu ${preset.label}.`);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="chem-balance-card" aria-label="Bán phản ứng tại hai cực">
              <div>
                <span>Anode (−)</span>
                <strong>{r.anode ? `${r.anode} (Oxi hóa)` : '—'}</strong>
              </div>
              <div>
                <span>Cathode (+)</span>
                <strong>{r.cathode ? `${r.cathode} (Khử)` : '—'}</strong>
              </div>
              <div>
                <span>Cầu muối</span>
                <strong>{p.bridgeConnected ? 'Đóng mạch' : 'Hở mạch'}</strong>
              </div>
            </div>

            <div className="reaction-equation" data-testid="cell-reaction">
              {r.reaction}
            </div>
            <p className="lab-notice" role="status">
              {notice}
            </p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>So sánh điện cực phải</h2>
              <span>U phải−trái chuẩn</span>
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
        id="electrochemistry"
        formulas={
          <p>
            <strong>E°pin = E°cathode − E°anode · U(phải−trái) = E°phải − E°trái</strong> · E°(Zn²⁺/Zn) = −0,76 V;
            E°(Cu²⁺/Cu) = +0,34 V; E°(Ag⁺/Ag) = +0,80 V.
          </p>
        }
        columns={['Trái', 'Phải', 'U(V)', 'E°pin(V)']}
        rows={state.records.map(row => [
          electrodes[row.parameters.left].symbol,
          electrodes[row.parameters.right].symbol,
          row.reading.meterVoltage_V?.toFixed(2) ?? '—',
          row.reading.emf_V.toFixed(2),
        ])}
        onClear={() => engine.clearRecords()}
      />
    </>
  );
}
