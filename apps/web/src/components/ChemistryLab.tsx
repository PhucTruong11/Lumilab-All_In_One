import { ChartBoundary } from './AppBoundary';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { acids, bases, type Acid, type Base, type TitrationParameters } from '@lumilab/lab-engine';
import { useSvgDrag } from './useSvgDrag';
import { useLab } from '../labSession';

const Chart = lazy(() => import('./LabCharts').then(module => ({ default: module.TitrationChart })));
const solutions = [
  ...Object.entries(acids).map(([key, label]) => ({ key, label, kind: 'acid' })),
  ...Object.entries(bases).map(([key, label]) => ({ key, label, kind: 'base' })),
];
const volumePresets = [
  { label: '0 mL', value: 0 },
  { label: '24,95 mL', value: 24.95 },
  { label: '25,00 mL (TĐ)', value: 25 },
  { label: '25,05 mL', value: 25.05 },
  { label: '30,00 mL', value: 30 },
];

function Bottle({ label, kind, tilted = false }: { label: string; kind: string; tilted?: boolean }) {
  return (
    <g>
      {tilted ? (
        <rect
          x="-14"
          y="-39"
          width="28"
          height="4.5"
          rx="2.2"
          fill="#ffffffd8"
          stroke={kind === 'acid' ? '#8c72a6' : '#4f8f7a'}
          strokeWidth="1.6"
        />
      ) : (
        <rect x="-17" y="-48" width="34" height="13" rx="4" fill={kind === 'acid' ? '#8c72a6' : '#4f8f7a'} />
      )}
      <path
        d="M-13-35v12q0 3-9 8v52q0 7 7 7h30q7 0 7-7v-52q-9-5-9-8v-12z"
        fill={kind === 'acid' ? '#f3edf8' : '#e4f4ee'}
        stroke={kind === 'acid' ? '#a68fc0' : '#78ab98'}
        strokeWidth="2"
      />
      <path
        d={
          tilted
            ? 'M-20 8L11 -30v66q0 6-6 6h-19q-6 0-6-6z'
            : 'M-20 10h40v26q0 6-6 6h-28q-6 0-6-6z'
        }
        fill={kind === 'acid' ? '#d5bfe6' : '#a6d6c3'}
        opacity=".78"
      />
      <rect x="-27" y="-6" width="54" height="26" rx="5" fill="white" stroke={kind === 'acid' ? '#dfd3ea' : '#cde4db'} />
      <text y="8" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#2d223b">{label}</text>
      <text y="17" textAnchor="middle" fontSize="7.5" fontWeight="600" fill={kind === 'acid' ? '#7a5c96' : '#3b7a64'}>
        {kind === 'acid' ? 'Axit 0,1M' : 'Bazơ 0,1M'}
      </text>
    </g>
  );
}

function LitmusPaper({
  tipColor,
  dipped = false,
}: {
  tipColor: string;
  dipped?: boolean;
}) {
  return (
    <g>
      {/* Kẹp gắp giấy quỳ ở đầu trên */}
      <rect x="-8" y="-42" width="16" height="9" rx="2.5" fill="#64748b" />
      <rect x="-5" y="-48" width="10" height="7" rx="2" fill="#94a3b8" />
      {/* Phần giấy quỳ khô màu tím nhạt */}
      <rect
        x="-7"
        y="-33"
        width="14"
        height="36"
        rx="2"
        fill="#b39ddb"
        stroke="#7e6899"
        strokeWidth="1.3"
      />
      {/* Phần đầu giấy quỳ nhúng dung dịch đổi màu (Đỏ / Tím / Xanh) */}
      <path
        d="M-7 0h14v32q0 3-3 3h-8q-3 0-3-3z"
        fill={tipColor}
        stroke="#6b5885"
        strokeWidth="1.3"
        style={{ transition: 'fill 0.28s ease' }}
      />
      {dipped && (
        <line x1="-6" y1="0" x2="6" y2="0" stroke="#ffffffcc" strokeWidth="1.5" strokeDasharray="2 2" />
      )}
    </g>
  );
}

export function ChemistryLab() {
  const { engine, state } = useLab('chemistry');
  const { parameters, reading, records } = state;
  const setParameters = (updater: (previous: TitrationParameters) => TitrationParameters) =>
    engine.setParameters(updater(engine.snapshot().parameters));
  const [notice, setNotice] = useState('');
  const [dropKey, setDropKey] = useState(0);
  const [bottlePour, setBottlePour] = useState<{ key: string; target: 'flask' | 'buret'; seq: number } | null>(null);
  const [litmusDipped, setLitmusDipped] = useState(false);
  const stopcockPressed = useRef(false);

  const flaskLitmusHex =
    reading.stage === 'equivalence' ? '#8b5cf6' : reading.stage === 'acid' ? '#ef4444' : '#2563eb';
  const flaskLitmusLabel =
    reading.stage === 'equivalence'
      ? 'Tím (pH = 7)'
      : reading.stage === 'acid'
        ? 'Hóa ĐỎ (Axit)'
        : 'Hóa XANH (Bazơ)';

  useEffect(() => {
    if (!bottlePour) return;
    const timer = window.setTimeout(() => setBottlePour(null), 650);
    return () => window.clearTimeout(timer);
  }, [bottlePour]);

  function pour(amount: number) {
    setParameters(previous => ({
      ...previous,
      baseVolume_ml: Math.min(50, Math.round((previous.baseVolume_ml + amount) * 100) / 100),
    }));
    setDropKey(value => value + 1);
    setNotice(`Đã thêm ${amount.toFixed(2)} mL bazơ.`);
  }

  function choose(key: string, pourIntoFlask = false) {
    const solution = solutions.find(item => item.key === key)!;
    if (solution.kind === 'acid') {
      setParameters(previous => ({ ...previous, acid: key as Acid, baseVolume_ml: 0 }));
      setBottlePour(prev => ({ key, target: 'flask', seq: (prev?.seq ?? 0) + 1 }));
      setNotice(`Mẫu mới: 25 mL ${solution.label} 0,1 M.`);
    } else {
      const changed = key !== parameters.base;
      setParameters(previous => ({
        ...previous,
        base: key as Base,
        baseVolume_ml: changed
          ? pourIntoFlask ? 1 : 0
          : pourIntoFlask ? Math.min(50, previous.baseVolume_ml + 1) : previous.baseVolume_ml,
      }));
      if (pourIntoFlask) {
        setDropKey(value => value + 1);
        setBottlePour(prev => ({ key, target: 'flask', seq: (prev?.seq ?? 0) + 1 }));
      } else {
        setBottlePour(prev => ({ key, target: 'buret', seq: (prev?.seq ?? 0) + 1 }));
      }
      setNotice(
        changed
          ? `Đổi sang ${solution.label}; bắt đầu lượt thử mới${pourIntoFlask ? ', thêm 1 mL bazơ' : ''}.`
          : pourIntoFlask
            ? `Đã thêm 1 mL ${solution.label}.`
            : `Buret chứa ${solution.label} 0,1 M.`
      );
    }
  }

  const { drag, start, handlers } = useSvgDrag((key, x, y, moved) => {
    if (key === 'litmus') {
      if (!moved) {
        setLitmusDipped(prev => {
          const next = !prev;
          setNotice(
            next
              ? `Đã nhúng giấy quỳ tím vào bình tam giác: ${flaskLitmusLabel}.`
              : 'Đã rút giấy quỳ tím khỏi bình tam giác.'
          );
          return next;
        });
        return;
      }
      if (x >= 350 && x <= 595 && y >= 200 && y <= 410) {
        setLitmusDipped(true);
        setNotice(`Đã nhúng giấy quỳ tím vào bình tam giác: ${flaskLitmusLabel}.`);
      } else if (x >= 415 && x <= 535 && y < 220) {
        setNotice(`Thử quỳ tím tại buret (${bases[parameters.base]}): Quỳ tím hóa XANH (môi trường bazơ).`);
      } else if (x >= 34 && x <= 310 && y >= 90 && y <= 240) {
        setNotice('Thử quỳ tím tại kệ Axit 0,1 M: Quỳ tím hóa ĐỎ (pH = 1,00).');
      } else if (x >= 34 && x <= 310 && y > 240 && y <= 405) {
        setNotice('Thử quỳ tím tại kệ Bazơ 0,1 M: Quỳ tím hóa XANH (pH = 13,00).');
      } else {
        setLitmusDipped(false);
        setNotice('Đã đặt giấy quỳ tím về hộp.');
      }
      return;
    }
    if (!moved) {
      choose(key);
      return;
    }
    if (x >= 350 && x <= 595 && y >= 220 && y <= 410) choose(key, true);
    else if (x >= 415 && x <= 535 && y < 220 && Object.hasOwn(bases, key)) choose(key);
    else setNotice('Đưa lọ vào bình hoặc chọn dung dịch bằng nút bên dưới.');
  });

  const selected = (key: string) => key === parameters.acid || key === parameters.base;
  const stageLabel =
    reading.stage === 'equivalence'
      ? 'Điểm tương đương (pH = 7,00)'
      : reading.stage === 'acid'
        ? 'Trước tương đương · Axit dư'
        : 'Sau tương đương · Bazơ dư';
  const stageColor =
    reading.stage === 'equivalence' ? '#28775c' : reading.stage === 'acid' ? '#6b4d8a' : '#b83270';
  const phPointerX = 630 + (Math.max(0, Math.min(14, reading.pH)) / 14) * 96;
  const dragOverVessel = Boolean(
    drag?.moved &&
      drag.key !== 'litmus' &&
      ((drag.x >= 350 && drag.x <= 595 && drag.y >= 200 && drag.y <= 410) ||
        (drag.x >= 415 && drag.x <= 535 && drag.y < 220))
  );

  const draggedLitmusProbe = (() => {
    if (drag?.key !== 'litmus' || !drag.moved) return null;
    if (drag.x >= 350 && drag.x <= 595 && drag.y >= 200 && drag.y <= 410) {
      return { color: flaskLitmusHex, text: `Bình: ${flaskLitmusLabel}`, dipped: true };
    }
    if (drag.x >= 415 && drag.x <= 535 && drag.y < 220) {
      return { color: '#2563eb', text: 'Buret: Hóa XANH (Bazơ)', dipped: true };
    }
    if (drag.x >= 34 && drag.x <= 310 && drag.y >= 90 && drag.y <= 240) {
      return { color: '#ef4444', text: 'Lọ Axit: Hóa ĐỎ', dipped: true };
    }
    if (drag.x >= 34 && drag.x <= 310 && drag.y > 240 && drag.y <= 405) {
      return { color: '#2563eb', text: 'Lọ Bazơ: Hóa XANH', dipped: true };
    }
    return { color: '#b39ddb', text: 'Đưa vào dung dịch để thử', dipped: false };
  })();

  return (
    <>
      <div className="workbench-grid interactive-lab chemistry-lab">
        <section className="stage-panel" aria-label="Bàn chuẩn độ">
          <div className="panel-title">
            <h2>Bàn thí nghiệm chuẩn độ</h2>
            <span className="mode-chip"><i />25°C · Phenolphthalein (pH 8,2–10)</span>
          </div>
          <svg
            className="interactive-stage"
            viewBox="0 0 760 440"
            aria-label="Kéo lọ dung dịch vào bình chuẩn độ"
            {...handlers}
          >
            <defs>
              <linearGradient id="chem-bg" x2="1" y2="1">
                <stop stopColor="#f7f4fb" />
                <stop offset="1" stopColor="#edf6f1" />
              </linearGradient>
              <linearGradient id="flask-glass">
                <stop stopColor="#ffffffcc" />
                <stop offset="1" stopColor="#e3f0e890" />
              </linearGradient>
              <linearGradient id="ph-spectrum" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#d9534f" />
                <stop offset="35%" stopColor="#f0ad4e" />
                <stop offset="50%" stopColor="#3e8e72" />
                <stop offset="72%" stopColor="#4a7ab5" />
                <stop offset="100%" stopColor="#b83270" />
              </linearGradient>
              <clipPath id="flask-clip">
                <path d="M445 247v48l-47 75q-10 18 10 18h134q20 0 10-18l-47-75v-48z" />
              </clipPath>
            </defs>

            <rect x="10" y="5" width="740" height="422" rx="22" fill="url(#chem-bg)" />

            {/* Top HUD: Trạng thái chuẩn độ & Thang pH trực quan */}
            <g transform="translate(620 26)">
              <rect x="0" y="0" width="116" height="114" rx="12" fill="#ffffffd8" stroke="#dcd4e6" />
              <text x="58" y="20" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#6e5b82">
                THANG pH (25°C)
              </text>
              <text x="58" y="42" textAnchor="middle" fontSize="19" fontWeight="700" fill={stageColor}>
                {reading.pH.toFixed(2)}
              </text>
              <rect x="10" y="52" width="96" height="8" rx="4" fill="url(#ph-spectrum)" />
              <circle cx={phPointerX - 620} cy="56" r="5.5" fill="#ffffff" stroke="#2d223b" strokeWidth="2" />
              <text x="12" y="72" fontSize="8" fill="#7a6d8a">0</text>
              <text x="58" y="72" textAnchor="middle" fontSize="8" fontWeight="600" fill="#28775c">7</text>
              <text x="104" y="72" textAnchor="end" fontSize="8" fill="#7a6d8a">14</text>
              <rect x="8" y="80" width="100" height="24" rx="6" fill={reading.indicatorFraction > 0 ? '#fce8f2' : '#eef5f1'} />
              <text x="58" y="96" textAnchor="middle" fontSize="9" fontWeight="600" fill={stageColor}>
                {reading.stage === 'equivalence' ? 'Tương đương 1:1' : reading.stage === 'acid' ? 'Axit còn dư' : 'Bazơ đã dư'}
              </text>
            </g>

            {/* Hộp Giấy Quỳ Tím (bên phải bàn thí nghiệm, kéo thả hoặc chạm để nhúng) */}
            <g
              transform="translate(620 150)"
              data-testid="litmus-strip"
              role="button"
              tabIndex={0}
              aria-label="Giấy quỳ tím: chạm hoặc kéo vào dung dịch để thử màu"
              aria-pressed={litmusDipped}
              className="svg-draggable"
              onPointerDown={event => start(event, 'litmus')}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setLitmusDipped(prev => !prev);
                }
              }}
            >
              <rect
                x="0"
                y="0"
                width="116"
                height="196"
                rx="12"
                fill="#ffffffdc"
                stroke={litmusDipped ? flaskLitmusHex : '#dcd4e6'}
                strokeWidth={litmusDipped ? '2' : '1.2'}
              />
              <text x="58" y="18" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#5e4b75">
                GIẤY QUỲ TÍM
              </text>
              <text x="58" y="31" textAnchor="middle" fontSize="7.5" fill="#7a6d8a">
                Kéo vào bình / chạm thử
              </text>

              {/* Mẩu giấy quỳ trên giá (mờ đi khi đang nhúng trong bình hoặc đang kéo) */}
              <g
                transform="translate(30 88)"
                opacity={(drag?.key === 'litmus' && drag.moved) || litmusDipped ? 0.3 : 1}
              >
                <LitmusPaper tipColor={litmusDipped ? flaskLitmusHex : '#9d84cc'} dipped={litmusDipped} />
              </g>

              {/* Bảng chú giải 3 màu quỳ tím */}
              <g transform="translate(52 50)">
                <circle cx="6" cy="8" r="4.5" fill="#ef4444" />
                <text x="15" y="11" fontSize="8" fontWeight="600" fill="#7f1d1d">
                  Đỏ (Axit)
                </text>
                <circle cx="6" cy="28" r="4.5" fill="#8b5cf6" />
                <text x="15" y="31" fontSize="8" fontWeight="600" fill="#4c1d95">
                  Tím (pH=7)
                </text>
                <circle cx="6" cy="48" r="4.5" fill="#2563eb" />
                <text x="15" y="51" fontSize="8" fontWeight="600" fill="#1e3a8a">
                  Xanh (Bazơ)
                </text>
              </g>

              {/* Trạng thái màu quỳ tím hiện tại */}
              <rect
                x="8"
                y="136"
                width="100"
                height="50"
                rx="8"
                fill={
                  litmusDipped
                    ? reading.stage === 'equivalence'
                      ? '#f3e8ff'
                      : reading.stage === 'acid'
                        ? '#fef2f2'
                        : '#eff6ff'
                    : '#f6f3fa'
                }
                stroke={litmusDipped ? flaskLitmusHex : '#e2dce8'}
                strokeWidth="1"
              />
              <text x="58" y="153" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b5c82">
                {litmusDipped ? 'ĐANG NHÚNG TRONG BÌNH' : 'TRẠNG THÁI QUỲ TÍM'}
              </text>
              <text
                x="58"
                y="172"
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill={litmusDipped ? flaskLitmusHex : '#5e4b75'}
                data-testid="litmus-reading"
              >
                {litmusDipped ? flaskLitmusLabel : 'Chưa nhúng (Tím)'}
              </text>
            </g>

            {/* Đế khuấy từ và giá đỡ buret */}
            <ellipse cx="475" cy="404" rx="108" ry="11" fill="#5e796818" />
            <rect x="385" y="388" width="180" height="16" rx="6" fill="#d9e3dc" stroke="#9ab0a2" strokeWidth="1.5" />
            <circle cx="412" cy="396" r="3" fill="#28775c" />
            <text x="475" y="399" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="#536b5c">
              ĐẾ CHUẨN ĐỘ · 25°C
            </text>

            <path d="M570 385V48m-25 0h50M543 385h63" stroke="#8fa396" strokeWidth="7" strokeLinecap="round" />
            <path d="M570 90h-93" stroke="#85998c" strokeWidth="5" />
            <rect x="461" y="40" width="28" height="170" rx="5" fill="#ffffffc8" stroke="#8ea396" strokeWidth="2" />
            <rect
              x="464"
              y={50 + (parameters.baseVolume_ml / 50) * 140}
              width="22"
              height={Math.max(0, 140 - (parameters.baseVolume_ml / 50) * 140)}
              rx="2"
              fill="#8ecab4"
              opacity=".85"
            />
            {Array.from({ length: 11 }, (_, i) => (
              <g key={i}>
                <path d={`M480 ${50 + i * 14}h8`} stroke="#7a9082" />
                <text x="450" y={54 + i * 14} textAnchor="end" fontSize="9" fill="#6b8274">
                  {i * 5}
                </text>
              </g>
            ))}
            <rect x="498" y="38" width="62" height="36" rx="7" fill="#ffffffd8" stroke="#cde0d5" />
            <text x="529" y="53" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#2f6650">
              {bases[parameters.base]}
            </text>
            <text x="529" y="67" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6b8274">
              0,100 M
            </text>
            <path d="M475 210v25" stroke="#93a89b" strokeWidth="5" />

            <g
              role="button"
              tabIndex={0}
              aria-label="Khóa buret: thêm 0,05 mL"
              className="svg-button"
              onPointerDown={() => {
                stopcockPressed.current = true;
              }}
              onPointerUp={() => {
                if (stopcockPressed.current) pour(0.05);
                stopcockPressed.current = false;
              }}
              onPointerLeave={() => {
                stopcockPressed.current = false;
              }}
              onKeyDown={event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  pour(0.05);
                }
              }}
            >
              <rect x="440" y="194" width="70" height="42" fill="transparent" />
              <path d="M456 215h38" stroke="#645885" strokeWidth="7" strokeLinecap="round" />
              <circle cx="475" cy="215" r="6" fill="#9a8cb8" />
            </g>

            {dropKey > 0 && (
              <g key={dropKey} pointerEvents="none">
                <circle
                  cx="475"
                  cy="240"
                  r="4"
                  fill={reading.indicatorFraction > 0 ? '#d94e8f' : '#5ca88e'}
                  className="falling-drop"
                />
                <ellipse
                  cx="475"
                  cy={356 - parameters.baseVolume_ml * 0.8}
                  rx="16"
                  ry="3.5"
                  fill="none"
                  stroke={reading.indicatorFraction > 0 ? '#d94e8f' : '#5ca88e'}
                  strokeWidth="1.8"
                  className="surface-ripple"
                />
              </g>
            )}

            {/* Lọ nghiêng và nhỏ giọt khi rót/chọn dung dịch */}
            {bottlePour && (
              <g key={bottlePour.seq} pointerEvents="none">
                <g
                  transform={
                    bottlePour.target === 'buret'
                      ? 'translate(442 60)'
                      : 'translate(442 266)'
                  }
                >
                  <g className="pouring-bottle-right">
                    <Bottle
                      label={solutions.find(item => item.key === bottlePour.key)!.label}
                      kind={solutions.find(item => item.key === bottlePour.key)!.kind}
                      tilted
                    />
                  </g>
                </g>
                {(bottlePour.target === 'buret'
                  ? ['reagent-drop-short', 'reagent-drop-short-delay-1', 'reagent-drop-short-delay-2']
                  : ['reagent-drop', 'reagent-drop-delay-1', 'reagent-drop-delay-2']
                ).map((cls, idx) => (
                  <g
                    key={cls}
                    transform={`translate(${474 + (idx - 1) * 2.5} ${
                      bottlePour.target === 'buret' ? 39 : 245
                    })`}
                  >
                    <path
                      d="M0 -5C2.5 -1 4 2 4 4A4 4 0 1 1 -4 4C-4 2 -2.5 -1 0 -5Z"
                      fill={
                        solutions.find(item => item.key === bottlePour.key)!.kind === 'acid'
                          ? '#9b7ec4'
                          : '#5ca88e'
                      }
                      className={cls}
                    />
                  </g>
                ))}
              </g>
            )}

            <rect
              data-testid="flask-drop-target"
              x="350"
              y="246"
              width="245"
              height="162"
              rx="25"
              fill={drag ? '#e8e1f340' : 'transparent'}
              stroke={drag ? '#b4a1cb' : 'transparent'}
              strokeDasharray="6 5"
            />
            <path
              d="M445 247v48l-47 75q-10 18 10 18h134q20 0 10-18l-47-75v-48"
              fill="url(#flask-glass)"
              stroke="#85a694"
              strokeWidth="2.5"
            />
            <g clipPath="url(#flask-clip)">
              <rect
                x="390"
                y={356 - parameters.baseVolume_ml * 0.8}
                width="170"
                height="80"
                fill={
                  reading.indicatorFraction > 0
                    ? `rgba(217,78,143,${0.18 + reading.indicatorFraction * 0.65})`
                    : '#b6dcd445'
                }
                className="flask-liquid"
              />
              <path
                d={`M390 ${356 - parameters.baseVolume_ml * 0.8}q40-5 85 0t85 0`}
                stroke={reading.indicatorFraction > 0 ? '#c96ba0' : '#8ec0ae'}
                fill="none"
                strokeWidth="2"
              />
              {/* Hiệu ứng loang màu hồng phenolphthalein cục bộ & khuấy trộn khi giọt bazơ chạm mặt axit */}
              {dropKey > 0 && (
                <g key={`swirl-${dropKey}`} pointerEvents="none">
                  <ellipse
                    cx="475"
                    cy={Math.min(372, 368 - parameters.baseVolume_ml * 0.7)}
                    rx="32"
                    ry="16"
                    fill="#e0529799"
                    className="titration-pink-swirl"
                  />
                  <ellipse
                    cx="475"
                    cy={Math.min(375, 372 - parameters.baseVolume_ml * 0.6)}
                    rx="18"
                    ry="9"
                    fill="#d94e8fcc"
                    className="titration-pink-swirl gas-delay-1"
                  />
                </g>
              )}
              {/* Cá từ trong bình tam giác */}
              <rect x="463" y="378" width="24" height="5" rx="2.5" fill="#ffffff" stroke="#7d9488" strokeWidth="1" />
            </g>
            <path d="M437 247h76" stroke="#85a694" strokeWidth="3" strokeLinecap="round" />
            <path d="M448 304l-29 54" stroke="white" strokeWidth="5" opacity=".8" strokeLinecap="round" />

            {/* Mẩu giấy quỳ tím khi đang nhúng trực tiếp trong bình tam giác */}
            {litmusDipped && !(drag?.key === 'litmus' && drag.moved) && (
              <g
                data-testid="dipped-litmus-in-flask"
                className="svg-button"
                onClick={() => {
                  setLitmusDipped(false);
                  setNotice('Đã rút giấy quỳ tím khỏi bình tam giác.');
                }}
              >
                {/* Quầng màu phản ứng quanh đầu giấy quỳ ngập trong dung dịch */}
                <ellipse
                  cx="494"
                  cy="354"
                  rx="16"
                  ry="8"
                  fill={flaskLitmusHex}
                  opacity="0.28"
                />
                <g transform="translate(494 334)">
                  <LitmusPaper tipColor={flaskLitmusHex} dipped />
                </g>
                {/* Nhãn hiển thị màu quỳ tím ngay cạnh cổ bình */}
                <g transform="translate(508 268)">
                  <rect
                    x="0"
                    y="0"
                    width="104"
                    height="36"
                    rx="8"
                    fill="#ffffffeb"
                    stroke={flaskLitmusHex}
                    strokeWidth="1.6"
                  />
                  <text x="52" y="14" textAnchor="middle" fontSize="8" fontWeight="700" fill="#64748b">
                    MÀU QUỲ TÍM
                  </text>
                  <text x="52" y="28" textAnchor="middle" fontSize="9.5" fontWeight="700" fill={flaskLitmusHex}>
                    {flaskLitmusLabel}
                  </text>
                </g>
              </g>
            )}

            <text x="475" y="421" textAnchor="middle" fill="#4f6d5c" fontSize="11" fontWeight="600">
              Bình tam giác: 25 mL {acids[parameters.acid]} 0,1 M · V tổng = {reading.totalVolume_ml.toFixed(2)} mL
            </text>

            {/* Kệ hóa chất bên trái */}
            <rect x="34" y="42" width="276" height="360" rx="16" fill="#ffffff75" stroke="#e2dce8" />
            <rect x="44" y="232" width="256" height="8" rx="4" fill="#c3d2c7" />
            <rect x="44" y="394" width="256" height="8" rx="4" fill="#c3d2c7" />
            <text x="52" y="68" fill="#635375" fontSize="11" fontWeight="700" letterSpacing="1.2">
              KỆ DUNG DỊCH CHUẨN (0,1 M)
            </text>
            <text x="52" y="84" fill="#7d8f82" fontSize="9.5">
              Chạm hoặc kéo lọ vào bình tam giác / buret
            </text>

            {solutions.map((solution, i) => {
              const x = 92 + (i % 2) * 150;
              const y = i < 2 ? 183 : 350;
              return (
                <g
                  key={solution.key}
                  transform={`translate(${x} ${y})`}
                  data-testid={`bottle-${solution.key}`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Chọn ${solution.label}`}
                  aria-pressed={selected(solution.key)}
                  className="svg-draggable"
                  onPointerDown={event => start(event, solution.key)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      choose(solution.key);
                    }
                  }}
                  opacity={(drag?.key === solution.key && drag.moved) || bottlePour?.key === solution.key ? 0.3 : 1}
                >
                  {selected(solution.key) && <ellipse cy="49" rx="42" ry="9" fill="#28775c28" />}
                  <Bottle label={solution.label} kind={solution.kind} />
                </g>
              );
            })}

            {drag?.moved && drag.key === 'litmus' && draggedLitmusProbe && (
              <g pointerEvents="none" transform={`translate(${drag.x} ${drag.y})`}>
                {draggedLitmusProbe.dipped && (
                  <ellipse cx="0" cy="24" rx="18" ry="10" fill={draggedLitmusProbe.color} opacity="0.28" />
                )}
                <LitmusPaper tipColor={draggedLitmusProbe.color} dipped={draggedLitmusProbe.dipped} />
                <g transform="translate(0 -64)">
                  <rect
                    x="-68"
                    y="-14"
                    width="136"
                    height="22"
                    rx="7"
                    fill="#ffffffeb"
                    stroke={draggedLitmusProbe.color}
                    strokeWidth="1.5"
                  />
                  <text
                    y="1"
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill={draggedLitmusProbe.dipped ? draggedLitmusProbe.color : '#5e4b75'}
                  >
                    {draggedLitmusProbe.text}
                  </text>
                </g>
              </g>
            )}

            {drag?.moved && drag.key !== 'litmus' && (
              <g pointerEvents="none">
                <g transform={`translate(${drag.x} ${drag.y}) rotate(48)`}>
                  <Bottle
                    label={solutions.find(item => item.key === drag.key)!.label}
                    kind={solutions.find(item => item.key === drag.key)!.kind}
                    tilted
                  />
                </g>
                {dragOverVessel &&
                  (drag.y < 220
                    ? ['reagent-drop-short', 'reagent-drop-short-delay-1']
                    : ['reagent-drop', 'reagent-drop-delay-1']
                  ).map((cls, idx) => (
                    <g
                      key={cls}
                      transform={`translate(${
                        drag.y < 220 ? 474 + idx * 2.5 : Math.max(455, Math.min(495, drag.x + 29)) + idx * 3
                      } ${drag.y < 220 ? 39 : Math.max(242, Math.min(285, drag.y - 24))})`}
                    >
                      <path
                        d="M0 -5C2.5 -1 4 2 4 4A4 4 0 1 1 -4 4C-4 2 -2.5 -1 0 -5Z"
                        fill={
                          solutions.find(item => item.key === drag.key)!.kind === 'acid'
                            ? '#9b7ec4'
                            : '#5ca88e'
                        }
                        className={cls}
                      />
                    </g>
                  ))}
              </g>
            )}
          </svg>

          <div className="stage-actions">
            <button
              className="primary-button"
              disabled={parameters.baseVolume_ml >= 50}
              onClick={() => pour(0.05)}
            >
              ＋ 0,05 mL
            </button>
            <button
              className="secondary-button"
              disabled={parameters.baseVolume_ml >= 50}
              onClick={() => pour(1)}
            >
              Rót 1 mL
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                setLitmusDipped(prev => {
                  const next = !prev;
                  setNotice(
                    next
                      ? `Đã nhúng giấy quỳ tím vào bình tam giác: ${flaskLitmusLabel}.`
                      : 'Đã rút giấy quỳ tím khỏi bình tam giác.'
                  );
                  return next;
                });
              }}
            >
              {litmusDipped ? 'Rút quỳ tím' : 'Thử quỳ tím'}
            </button>
            <button
              className="secondary-button"
              onClick={() => {
                setParameters(previous => ({ ...previous, baseVolume_ml: 0 }));
                setNotice('Đã tạo mẫu axit mới.');
                setDropKey(0);
                setBottlePour(null);
              }}
            >
              ↺ Mẫu mới
            </button>
            <button className="record-button" onClick={() => engine.record()}>
              ＋ Ghi số đo
            </button>
          </div>

          <div className="readings readings-expanded">
            <div>
              <span>pH dung dịch</span>
              <strong data-testid="ph-reading">{reading.pH.toFixed(3)}</strong>
            </div>
            <div>
              <span>Bazơ đã thêm</span>
              <strong data-testid="base-volume-reading">
                {parameters.baseVolume_ml.toFixed(2)} <small>mL</small>
              </strong>
            </div>
            <div>
              <span>Màu chỉ thị</span>
              <strong className="indicator-reading" data-testid="indicator-reading">
                {reading.indicatorFraction > 0 ? 'Hồng' : 'Không màu'}
              </strong>
            </div>
            <div>
              <span>Giai đoạn</span>
              <strong className="indicator-reading" style={{ color: stageColor }}>
                {reading.stage === 'equivalence' ? 'Tương đương' : reading.stage === 'acid' ? 'Axit dư' : 'Bazơ dư'}
              </strong>
            </div>
          </div>
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Dung dịch & Thể tích</h2>
              <span>0,100 mol/L · 25 mL axit</span>
            </div>
            <div className="solution-selectors">
              <label>
                Axit (trong bình)
                <select
                  aria-label="Dung dịch axit"
                  value={parameters.acid}
                  onChange={event => choose(event.target.value)}
                >
                  {Object.entries(acids).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                Bazơ (trên buret)
                <select
                  aria-label="Dung dịch bazơ"
                  value={parameters.base}
                  onChange={event => choose(event.target.value)}
                >
                  {Object.entries(bases).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="parameter">
              <span>
                Bazơ đã thêm <output>{parameters.baseVolume_ml.toFixed(2)} mL</output>
              </span>
              <input
                aria-label="Thể tích bazơ"
                type="range"
                min="0"
                max="50"
                step=".05"
                value={parameters.baseVolume_ml}
                onChange={event =>
                  setParameters(previous => ({ ...previous, baseVolume_ml: Number(event.target.value) }))
                }
              />
            </label>

            <div className="preset-row" aria-label="Mốc thể tích chuẩn độ nhanh">
              {volumePresets.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  className={`preset-pill ${Math.abs(parameters.baseVolume_ml - preset.value) < 0.005 ? 'active' : ''}`}
                  onClick={() => {
                    setParameters(previous => ({ ...previous, baseVolume_ml: preset.value }));
                    setNotice(`Đã chuyển đến mốc ${preset.label}.`);
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <label className="compact-number">
              Nhập thể tích (mL)
              <input
                aria-label="Nhập thể tích bazơ"
                type="number"
                min="0"
                max="50"
                step=".05"
                value={parameters.baseVolume_ml}
                onChange={event => {
                  if (event.target.value !== '')
                    setParameters(previous => ({
                      ...previous,
                      baseVolume_ml: Math.max(0, Math.min(50, Number(event.target.value))),
                    }));
                }}
              />
            </label>

            <div className="chem-balance-card" aria-label="Cân bằng lượng chất">
              <div>
                <span>n(H⁺) còn lại</span>
                <strong>{(reading.remainingAcidMoles * 1000).toFixed(3)} mmol</strong>
              </div>
              <div>
                <span>n(OH⁻) dư</span>
                <strong>{(reading.remainingBaseMoles * 1000).toFixed(3)} mmol</strong>
              </div>
              <div>
                <span>Muối {reading.salt}</span>
                <strong>{(reading.saltMoles * 1000).toFixed(3)} mmol</strong>
              </div>
            </div>

            <div className="reaction-equation" data-testid="reaction-equation">
              {reading.equation}
            </div>
            <p className="lab-notice" role="status">
              {notice || `${stageLabel}. Chọn mốc 24,95 → 25,00 → 25,05 mL để quan sát bước nhảy pH.`}
            </p>
          </section>

          <section className="chart-panel">
            <div className="panel-title">
              <h2>Đường cong chuẩn độ</h2>
              <span>pH theo V(bazơ)</span>
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
                <strong>n = C × V</strong> (V theo L) · <strong>CₐVₐ = CᵦVᵦ</strong> tại tương đương: 25 mL. H⁺ + OH⁻ → H₂O.
              </p>
              <p>
                pH = −log₁₀[H⁺]; [H⁺][OH⁻] = 10⁻¹⁴ ở 25°C. Mô hình axit–bazơ mạnh 1:1, loãng lý tưởng, thể tích cộng được. Bỏ qua lượng chỉ thị tiêu thụ.
              </p>
              <p>
                pH 7 không màu; phenolphthalein chuyển màu trong khoảng 8,2–10. Màu minh họa không phải phép đo. Một bước 0,05 mL là quy ước của lab. Số liệu local, chưa kiểm chứng server. Nguồn: OpenStax Chemistry 2e §14.7.
              </p>
            </div>
          </div>
        </details>
        <section className="notebook">
          <div className="panel-title">
            <h2>
              Sổ tay <span className="count">{records.length}</span>
            </h2>
            <button className="text-button" onClick={() => engine.clearRecords()}>
              Xóa số đo
            </button>
          </div>
          {!records.length ? (
            <p className="empty-notebook">Ghi số đo hai phía điểm tương đương (ví dụ 24,95; 25,00 và 25,05 mL).</p>
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Phản ứng</th>
                    <th>V (mL)</th>
                    <th>pH</th>
                    <th>Chỉ thị</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row, i) => (
                    <tr key={i}>
                      <td>{row.reading.equation}</td>
                      <td>{row.parameters.baseVolume_ml.toFixed(2)}</td>
                      <td>{row.reading.pH.toFixed(3)}</td>
                      <td>{row.reading.indicatorFraction > 0 ? 'Hồng' : 'Không màu'}</td>
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
