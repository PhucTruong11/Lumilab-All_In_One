import { ChartBoundary } from './AppBoundary';
import { lazy, Suspense, useState } from 'react';
import {
  circuitParts,
  placeCircuitPart,
  moveCircuitPart,
  removeCircuitPart,
  removeCircuitSlot,
  type CircuitPart,
  type CircuitParameters,
  type Connection,
} from '@lumilab/lab-engine';
import { useSvgDrag } from './useSvgDrag';
import { useLab } from '../labSession';
import { LabSlider } from './ExpandedLabParts';

const Chart = lazy(() => import('./LabCharts').then(module => ({ default: module.CircuitChart })));
const slotX = [250, 410, 570];
const parts = Object.keys(circuitParts) as CircuitPart[];

function PartSymbol({ part, closed, glow = false, powerW = 0 }: { part: CircuitPart; closed: boolean; glow?: boolean; powerW?: number }) {
  if (part === 'resistor10') return <g><rect x="-30" y="-14" width="60" height="28" rx="6" fill="#dff1f3" stroke="#14798f" strokeWidth="2.2"/><path d="M-16-14v28M-3-14v28M10-14v28" stroke="#14798f" strokeWidth="4"/><text y="33" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#0f6275">R phụ · 10 Ω</text></g>;
  if (part === 'extraResistor') {
    return (
      <g>
        <rect x="-30" y="-14" width="60" height="28" rx="6" fill="#f7e6c4" stroke="#b58338" strokeWidth="2.2" />
        <path d="M-16-14v28M-3-14v28M10-14v28" stroke="#9c661c" strokeWidth="4.2" />
        <text y="33" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#6b4e23">
          R phụ · 20 Ω
        </text>
      </g>
    );
  }
  if (part === 'bulb') {
    const haloR = Math.min(40, 26 + powerW * 6);
    return (
      <g>
        {glow && <circle r={haloR} fill="#fde047" opacity={Math.min(0.55, 0.22 + powerW * 0.14)} />}
        {glow &&
          [0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
            const rad = (deg * Math.PI) / 180;
            return (
              <line
                key={deg}
                x1={Math.cos(rad) * 26}
                y1={Math.sin(rad) * 26}
                x2={Math.cos(rad) * (31 + Math.min(8, powerW * 2.5))}
                y2={Math.sin(rad) * (31 + Math.min(8, powerW * 2.5))}
                stroke="#f59e0b"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
        <circle r="22" fill={glow ? '#fef08a' : '#faf6eb'} stroke={glow ? '#d97706' : '#b89f65'} strokeWidth="2.4" />
        <path d="M-9 8q0-18 9-18t9 18" fill="none" stroke={glow ? '#d97706' : '#9c844f'} strokeWidth="2.4" />
        <text y="40" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#6b4e23">
          Đèn · 10 Ω
        </text>
      </g>
    );
  }
  return (
    <g>
      <path
        d={closed ? 'M-32 0h64' : 'M-32 0h10m44 0h10M-22 0L19 -18'}
        fill="none"
        stroke={closed ? '#1f7054' : '#64748b'}
        strokeWidth="4.2"
        strokeLinecap="round"
      />
      <circle cx="-22" r="4.5" fill={closed ? '#1f7054' : '#475569'} />
      <circle cx="22" r="4.5" fill={closed ? '#1f7054' : '#475569'} />
      <text y="33" textAnchor="middle" fontSize="10.5" fontWeight="600" fill={closed ? '#1f7054' : '#64748b'}>
        {closed ? 'Khóa K đóng' : 'Khóa K mở'}
      </text>
    </g>
  );
}

function Meter({ kind, value }: { kind: 'A' | 'V'; value: number | null }) {
  const isAmp = kind === 'A';
  return (
    <g>
      <circle
        r="26"
        fill={isAmp ? '#ecfeff' : '#fef3c7'}
        stroke={isAmp ? '#14798f' : '#c97a16'}
        strokeWidth="2.6"
        className="tactile-grip"
      />
      <text y="-4" textAnchor="middle" fill={isAmp ? '#0f5c6e' : '#8a520d'} fontSize="15" fontWeight="700">
        {kind}
      </text>
      <text y="12" textAnchor="middle" fill="#1b382b" fontSize="9.5" fontWeight="600">
        {value === null ? '—' : value.toFixed(isAmp ? 3 : 2)}
      </text>
    </g>
  );
}

export function CircuitLab() {
  const { engine, state } = useLab('circuit');
  const { parameters, reading, records } = state;
  const setParameters = (updater: (previous: CircuitParameters) => CircuitParameters) =>
    engine.setParameters(updater(engine.snapshot().parameters));
  const [selected, setSelected] = useState<CircuitPart | null>(null);
  const [selectedOrigin, setSelectedOrigin] = useState<number | null>(null);
  const [notice, setNotice] = useState('');

  function install(part: CircuitPart, index: number, origin: number | null = selectedOrigin) {
    setParameters(previous => origin === null ? placeCircuitPart(previous, part, index) : moveCircuitPart(previous, origin, index));
    setNotice(`Đã gắn ${circuitParts[part].name.toLowerCase()} vào ô ${index + 1}.`);
    setSelected(null);
    setSelectedOrigin(null);
  }

  function connect(kind: 'ammeter' | 'voltmeter', connection: Connection) {
    setParameters(previous => ({ ...previous, [kind]: connection }));
    setNotice(`${kind === 'ammeter' ? 'Ampe kế' : 'Vôn kế'}: ${connection === 'series' ? 'nối tiếp' : 'song song'}.`);
  }

  const { drag, start, handlers } = useSvgDrag((key, x, y, moved) => {
    if (key === 'ammeter' || key === 'voltmeter') {
      if (!moved) {
        connect(key, parameters[key] === 'series' ? 'parallel' : 'series');
        return;
      }
      const targetY = key === 'ammeter' ? 245 : 180;
      if (Math.hypot(x - 500, y - targetY) < 65) connect(key, 'parallel');
      else if (Math.hypot(x - (key === 'ammeter' ? 260 : 345), y - 100) < 65) connect(key, 'series');
      else setNotice('Thả đồng hồ vào vòng tròn nét đứt.');
      return;
    }
    const origin = key.startsWith('slot:') ? Number(key.slice(5)) : null;
    const part = origin === null ? key as CircuitPart : parameters.slots[origin]!;
    if (!moved) {
      if (part === 'switchInstalled' && origin !== null) {
        setParameters(previous => ({ ...previous, switchClosed: !previous.switchClosed }));
      } else {
        setSelected(part);
        setSelectedOrigin(origin);
        setNotice(`Đã chọn ${circuitParts[part].name.toLowerCase()}; chạm vào Ô 1, 2, 3 để gắn hoặc ô Tháo.`);
      }
      return;
    }
    const index = slotX.findIndex(sx => Math.abs(x - sx) < 62 && Math.abs(y - 310) < 44);
    if (index >= 0) install(part, index, origin);
    else if (x >= 655 && y >= 360) {
      setParameters(previous => origin === null ? removeCircuitPart(previous, part) : removeCircuitSlot(previous, origin));
      setNotice('Đã tháo linh kiện khỏi mạch.');
    } else setNotice('Kéo linh kiện vào một trong ba ô trên mạch.');
  });

  function partNode(part: CircuitPart, x: number, y: number, installed: boolean, slotIndex: number | null = null) {
    const bulbPower = (reading.bulbPower_W ?? 0) / Math.max(1, parameters.slots.filter(item => item === 'bulb').length);
    return (
      <g
        key={`${installed ? `installed-${slotIndex}` : 'shelf'}-${part}`}
        transform={`translate(${x} ${y})`}
        className="svg-draggable"
        data-testid={`${installed ? 'installed' : 'part'}-${part}`}
        role="button"
        tabIndex={0}
        aria-label={`${installed ? 'Trên mạch' : 'Chọn'} ${circuitParts[part].name}`}
        onPointerDown={event => start(event, slotIndex === null ? part : `slot:${slotIndex}`)}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (installed && part === 'switchInstalled') {
              setParameters(previous => ({ ...previous, switchClosed: !previous.switchClosed }));
            } else {
              setSelected(part);
              setSelectedOrigin(slotIndex);
              setNotice(`Đã chọn ${circuitParts[part].name.toLowerCase()}; chọn ô để gắn hoặc Tháo.`);
            }
          }
        }}
        opacity={drag?.key === `slot:${slotIndex}` && installed ? 0.3 : 1}
      >
        <rect
          x="-43"
          y="-32"
          width="86"
          height="72"
          rx="12"
          fill={!installed && selected === part ? '#dff2e8' : 'transparent'}
          stroke={!installed && selected === part ? '#1f7054' : 'transparent'}
          strokeWidth="2"
        />
        <PartSymbol
          part={part}
          closed={installed ? parameters.switchClosed : true}
          glow={installed && bulbPower > 0.001}
          powerW={bulbPower}
        />
      </g>
    );
  }

  const a = parameters.ammeter === 'series' ? { x: 260, y: 100 } : { x: 500, y: 245 };
  const v = parameters.voltmeter === 'series' ? { x: 345, y: 100 } : { x: 500, y: 180 };
  const currentVal = reading.valid && reading.current_A !== null ? reading.current_A : 0;
  const activeCurrent = currentVal > 0;
  const flowSpeedClass = currentVal >= 0.4 ? 'current-fast' : currentVal >= 0.15 ? 'current-medium' : 'current-slow';
  const sourcePower = reading.valid && reading.current_A !== null ? parameters.voltage_V * reading.current_A : null;

  return (
    <>
      <div className="workbench-grid interactive-lab circuit-lab">
        <section className="stage-panel" aria-label="Bàn mạch điện">
          <div className="panel-title">
            <h2>Bàn lắp mạch điện một chiều</h2>
            <span className="mode-chip">
              <i /> {!reading.valid ? 'Kiểm tra cách mắc đồng hồ' : reading.closed ? 'Mạch kín · Dòng đang chạy' : 'Mạch hở (I = 0)'}
            </span>
          </div>

          <svg className="interactive-stage" viewBox="0 0 760 460" aria-label="Mạch điện kéo thả linh kiện và đồng hồ" {...handlers}>
            <defs>
              <linearGradient id="circuit-bg" x2="1" y2="1">
                <stop stopColor="#edf6f1" />
                <stop offset="1" stopColor="#e4efe9" />
              </linearGradient>
              <pattern id="circuit-grid" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="0.95" fill="#9bc0ae" opacity="0.45" />
              </pattern>
            </defs>

            <rect x="10" y="5" width="740" height="442" rx="22" fill="url(#circuit-bg)" />
            <rect x="10" y="5" width="740" height="442" rx="22" fill="url(#circuit-grid)" />

            {/* Live Power HUD */}
            <g transform="translate(28 18)">
              <rect width="174" height="44" rx="10" fill="#ffffffeb" stroke="#c8ddd1" />
              <text x="12" y="18" fill="#486857" fontSize="10" fontWeight="600">
                Công suất nguồn tiêu thụ
              </text>
              <text x="12" y="35" fill="#1b382b" fontSize="13" fontWeight="700">
                P = {sourcePower === null ? '—' : `${sourcePower.toFixed(2)} W`}
              </text>
            </g>

            {/* Main copper/emerald loop */}
            <path
              d="M105 176V100H650V310H105V228"
              fill="none"
              stroke={activeCurrent ? '#1f7054' : '#7b9b8b'}
              strokeWidth="5.5"
              strokeLinejoin="round"
            />
            {activeCurrent && (
              <path
                d="M105 176V100H650V310H105V228"
                fill="none"
                stroke="#6ee7b7"
                strokeWidth="3.2"
                strokeDasharray="5 24"
                strokeLinecap="round"
                className={flowSpeedClass}
              />
            )}

            {/* DC Battery Source */}
            <rect x="80" y="175" width="50" height="56" rx="12" fill="#dff0e7" stroke="#28775c" strokeWidth="2.2" />
            <path d="M94 191h22m-11-6v12m-9 16h18" stroke="#1b4d39" strokeWidth="2.4" strokeLinecap="round" />
            <text x="105" y="253" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#1b382b">
              U = {parameters.voltage_V.toFixed(1)} V
            </text>
            <foreignObject x="45" y="262" width="120" height="32">
              <input
                className="stage-range"
                aria-label="Điện áp trên nguồn"
                type="range"
                min="0"
                max="12"
                step=".1"
                value={parameters.voltage_V}
                onChange={event => setParameters(previous => ({ ...previous, voltage_V: Number(event.target.value) }))}
              />
            </foreignObject>

            {/* Main Resistor R */}
            <rect x="450" y="84" width="100" height="32" rx="7" fill="#f7e6c4" stroke="#b58338" strokeWidth="2.2" />
            <path d="M465 84v32m18-32v32m18-32v32m18-32v32m16-32v32" stroke="#9c661c" strokeWidth="4" />
            <text x="500" y="70" textAnchor="middle" fontSize="12.5" fontWeight="700" fill="#6b4e23">
              R chính = {parameters.resistance_ohm} Ω
            </text>
            <foreignObject x="445" y="120" width="110" height="25">
              <input
                className="stage-range"
                aria-label="Điện trở trên mạch"
                type="range"
                min="5"
                max="100"
                step="1"
                value={parameters.resistance_ohm}
                onChange={event => setParameters(previous => ({ ...previous, resistance_ohm: Number(event.target.value) }))}
              />
            </foreignObject>

            {/* Parallel branches for meters */}
            {parameters.voltmeter === 'parallel' && <path d="M430 100v80h140v-80" fill="none" stroke="#c97a16" strokeWidth="3" />}
            {parameters.ammeter === 'parallel' && <path d="M414 100v145h172V100" fill="none" stroke="#14798f" strokeWidth="3" />}

            {/* Meter drop target guides during drag */}
            {drag && ['ammeter', 'voltmeter'].includes(drag.key) && (
              <>
                {[
                  { x: drag.key === 'ammeter' ? 260 : 345, y: 100, label: 'Nối tiếp' },
                  { x: 500, y: drag.key === 'ammeter' ? 245 : 180, label: 'Song song' },
                ].map(target => (
                  <g key={target.label}>
                    <circle
                      data-testid={`meter-target-${target.label === 'Nối tiếp' ? 'series' : 'parallel'}`}
                      cx={target.x}
                      cy={target.y}
                      r="34"
                      fill="#ffffff99"
                      stroke="#14798f"
                      strokeWidth="2.2"
                      strokeDasharray="5 5"
                    />
                    <text x={target.x + 40} y={target.y + 4} fontSize="10.5" fontWeight="700" fill="#0f6275">
                      {target.label}
                    </text>
                  </g>
                ))}
              </>
            )}

            {/* Draggable Ammeter & Voltmeter */}
            {(['ammeter', 'voltmeter'] as const).map((kind, i) => {
              const position = i === 0 ? a : v;
              return (
                <g
                  key={kind}
                  transform={`translate(${position.x} ${position.y})`}
                  data-testid={`meter-${kind}`}
                  className="svg-draggable"
                  role="button"
                  tabIndex={0}
                  aria-label={`Đổi cách mắc ${i === 0 ? 'ampe kế' : 'vôn kế'}`}
                  onPointerDown={event => start(event, kind)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      connect(kind, parameters[kind] === 'series' ? 'parallel' : 'series');
                    }
                  }}
                  opacity={drag?.key === kind ? 0.3 : 1}
                >
                  <Meter kind={i === 0 ? 'A' : 'V'} value={i === 0 ? reading.current_A : reading.resistorVoltage_V} />
                </g>
              );
            })}

            {/* Three Interactive Component Slots */}
            {slotX.map((x, index) => (
              <g key={index}>
                <rect
                  data-testid={`circuit-slot-${index}`}
                  x={x - 49}
                  y="276"
                  width="98"
                  height="70"
                  rx="12"
                  fill={selected || drag ? '#e0f2ea' : '#f4faf6'}
                  stroke={selected || drag ? '#14798f' : '#96b9a6'}
                  strokeWidth={selected || drag ? '2.2' : '1.6'}
                  strokeDasharray="5 5"
                  role="button"
                  tabIndex={0}
                  aria-label={`Gắn vào ô ${index + 1}`}
                  onClick={() => {
                    if (selected) install(selected, index);
                  }}
                  onKeyDown={event => {
                    if (selected && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      install(selected, index);
                    }
                  }}
                />
                {!parameters.slots[index] && (
                  <text x={x} y="294" textAnchor="middle" fontSize="10" fontWeight="600" fill="#6b8c7b" pointerEvents="none">
                    Ô {index + 1} (Trống)
                  </text>
                )}
                <path
                  d={
                    parameters.slots[index]
                      ? `M${x - 49} 310h${49 - (parameters.slots[index] === 'bulb' ? 22 : parameters.slots[index] === 'switchInstalled' ? 32 : 30)}M${x + (parameters.slots[index] === 'bulb' ? 22 : parameters.slots[index] === 'switchInstalled' ? 32 : 30)} 310H${x + 49}`
                      : `M${x - 49} 310h98`
                  }
                  stroke={activeCurrent ? '#1f7054' : '#7b9b8b'}
                  strokeWidth="4.5"
                  pointerEvents="none"
                />
                {parameters.slots[index] && partNode(parameters.slots[index]!, x, 310, true, index)}
              </g>
            ))}

            {/* Component Tray */}
            <path d="M50 364h660" stroke="#c8ddd1" strokeWidth="1.5" />
            <text x="50" y="388" fontSize="11" fontWeight="700" fill="#355d48">
              Khay linh kiện (kéo lên ô trống)
            </text>
            {parts.map((part, index) => partNode(part, 135 + index * 145, 408, false))}

            {/* Remove Target */}
            <g
              data-testid="remove-component-target"
              role="button"
              tabIndex={0}
              aria-label="Tháo linh kiện đã chọn"
              className="svg-button"
              onClick={() => {
                if (selected) {
                  setParameters(previous => selectedOrigin === null ? removeCircuitPart(previous, selected) : removeCircuitSlot(previous, selectedOrigin));
                  setSelected(null);
                  setSelectedOrigin(null);
                }
              }}
              onKeyDown={event => {
                if (selected && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  setParameters(previous => selectedOrigin === null ? removeCircuitPart(previous, selected) : removeCircuitSlot(previous, selectedOrigin));
                  setSelected(null);
                  setSelectedOrigin(null);
                }
              }}
            >
              <rect x="660" y="374" width="66" height="56" rx="12" fill="#fff5f5" stroke="#dca7a7" strokeDasharray="4 4" />
              <text x="693" y="398" textAnchor="middle" fontSize="20" fontWeight="700" fill="#b94030">
                −
              </text>
              <text x="693" y="416" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#993224">
                Tháo
              </text>
            </g>

            {drag?.moved && (
              <g transform={`translate(${drag.x} ${drag.y})`} pointerEvents="none">
                {drag.key === 'ammeter' || drag.key === 'voltmeter' ? (
                  <Meter kind={drag.key === 'ammeter' ? 'A' : 'V'} value={null} />
                ) : (
                  <PartSymbol part={drag.key.startsWith('slot:') ? parameters.slots[Number(drag.key.slice(5))]! : drag.key as CircuitPart} closed={parameters.switchClosed} />
                )}
              </g>
            )}
          </svg>

          <div className="stage-actions">
            <button
              className="primary-button"
              disabled={!parameters.slots.includes('switchInstalled')}
              onClick={() => setParameters(previous => ({ ...previous, switchClosed: !previous.switchClosed }))}
            >
              {parameters.switchClosed ? '⏻ Mở công tắc' : '⏻ Đóng công tắc'}
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                engine.reset();
                setSelected(null);
                setSelectedOrigin(null);
                setNotice('Đã đặt lại mạch.');
              }}
            >
              ↺ Đặt lại
            </button>
            <button className="record-button" disabled={!reading.valid} onClick={() => engine.record()}>
              ＋ Ghi số đo
            </button>
          </div>

          <div className="readings">
            <div>
              <span>Dòng điện I</span>
              <strong data-testid="current-reading">
                {reading.current_A === null ? '—' : reading.current_A.toFixed(3)} <small>A</small>
              </strong>
            </div>
            <div>
              <span>U trên R chính</span>
              <strong data-testid="voltage-reading">
                {reading.resistorVoltage_V === null ? '—' : reading.resistorVoltage_V.toFixed(2)} <small>V</small>
              </strong>
            </div>
            <div>
              <span>R toàn mạch</span>
              <strong data-testid="total-resistance-reading">
                {reading.totalResistance_ohm} <small>Ω</small>
              </strong>
            </div>
          </div>
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Thiết lập mạch</h2>
              <span>DC lý tưởng</span>
            </div>
            <LabSlider
              label="Điện áp nguồn"
              unit="V"
              min={0}
              max={12}
              step={0.1}
              value={parameters.voltage_V}
              presets={[3, 6, 9, 12]}
              onChange={voltage_V => engine.setParameters({ voltage_V })}
            />
            <LabSlider
              label="Điện trở chính"
              unit="Ω"
              min={5}
              max={100}
              presets={[10, 20, 50, 100]}
              value={parameters.resistance_ohm}
              onChange={resistance_ohm => engine.setParameters({ resistance_ohm })}
            />
            <div className="solution-selectors">
              <label>
                Ampe kế
                <select
                  aria-label="Cách mắc ampe kế"
                  value={parameters.ammeter}
                  onChange={event => connect('ammeter', event.target.value as Connection)}
                >
                  <option value="series">Nối tiếp</option>
                  <option value="parallel">Song song</option>
                </select>
              </label>
              <label>
                Vôn kế
                <select
                  aria-label="Cách mắc vôn kế"
                  value={parameters.voltmeter}
                  onChange={event => connect('voltmeter', event.target.value as Connection)}
                >
                  <option value="parallel">Song song</option>
                  <option value="series">Nối tiếp</option>
                </select>
              </label>
            </div>
            <details className="component-options">
              <summary>Thêm / tháo linh kiện</summary>
              {parts.map(part => (
                <div key={part}>
                  <span>{circuitParts[part].name}</span>
                  <select
                    aria-label={`Vị trí ${circuitParts[part].name}`}
                    value={parameters.slots.indexOf(part)}
                    onChange={event => {
                      const index = Number(event.target.value);
                      if (index === -1) setParameters(previous => removeCircuitPart(previous, part));
                      else install(part, index);
                    }}
                  >
                    <option value="-1">Chưa gắn</option>
                    {slotX.map((_, i) => (
                      <option key={i} value={i}>
                        Ô {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </details>
            <fieldset className="circuit-slots-form"><legend>Chỉnh từng ô lắp</legend>
              {slotX.map((_, index) => <label key={index}>Ô {index + 1}
                <select aria-label={`Linh kiện ô ${index + 1}`} value={parameters.slots[index] ?? ''}
                  onChange={event => {
                    const value = event.target.value;
                    setParameters(previous => value ? placeCircuitPart(previous, value as CircuitPart, index) : removeCircuitSlot(previous, index));
                    setSelected(null); setSelectedOrigin(null);
                  }}>
                  <option value="">Dây nối</option>
                  {parts.map(part => <option key={part} value={part}>{circuitParts[part].name}</option>)}
                </select>
              </label>)}
            </fieldset>
            <p className={`lab-notice ${!reading.valid ? 'invalid-circuit' : ''}`} role="status">
              {!reading.valid
                ? 'Ampe kế cần nối tiếp, vôn kế cần song song với R chính. Sửa cách mắc để đọc số đo.'
                : notice || 'Kéo linh kiện vào ô trống, chạm công tắc trên sơ đồ để đóng/mở.'}
            </p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Đồ thị I–U nguồn</h2>
              <span>I = U / R tổng</span>
            </div>
            <ChartBoundary>
              <Suspense fallback={<div className="chart-area chart-loading">Đang mở đồ thị…</div>}>
                <Chart parameters={parameters} />
              </Suspense>
            </ChartBoundary>
          </section>
        </aside>
      </div>

      <div className="below-lab">
        <details className="model-details">
          <summary>Công thức & giới hạn</summary>
          <div className="model-content">
            <div>
              <p>
                <strong>I = U nguồn / R tổng</strong> · U trên R chính = I × R chính · P nguồn = U nguồn × I.
              </p>
              <p>
                Các tải nối tiếp: R tổng = R chính + R phụ + R bóng. Bóng là điện trở cố định 10 Ω; R phụ 20 Ω. Dây và đồng hồ lý tưởng;
                không có điện trở trong hay hiệu ứng nhiệt.
              </p>
              <p>
                Mạch hở: I = 0. Mắc đồng hồ sai: khóa số đo, không mô phỏng ngắn mạch thật. Số liệu local, chưa kiểm chứng server. Nguồn:
                OpenStax University Physics 2 §10.2, §10.4.
              </p>
            </div>
          </div>
        </details>

        <section className="notebook">
          <div className="panel-title">
            <h2>
              Sổ tay <span className="count">{records.length}</span>
            </h2>
            {records.length > 0 && (
              <button className="text-button" onClick={() => engine.clearRecords()}>
                Xóa số đo
              </button>
            )}
          </div>
          {!records.length ? (
            <p className="empty-notebook">Ghi lại trước và sau khi thêm linh kiện để đối chiếu định luật Ohm.</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>U nguồn (V)</th>
                    <th>R tổng (Ω)</th>
                    <th>I (A)</th>
                    <th>U trên R (V)</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row, i) => (
                    <tr key={i} className={i === records.length - 1 ? 'latest-record-row' : undefined}>
                      <td>{row.parameters.voltage_V.toFixed(1)}</td>
                      <td>{row.reading.totalResistance_ohm}</td>
                      <td>{row.reading.current_A?.toFixed(3)}</td>
                      <td>{row.reading.resistorVoltage_V?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
