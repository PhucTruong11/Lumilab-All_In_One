import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  precipitationReading,
  gasReactionReading,
  type LabId,
} from "@lumilab/lab-engine";
import { useLab } from "../labSession";
import { useSvgDrag } from "./useSvgDrag";
import {
  ExpandedFooter,
  ExpandedReadings,
  LabSlider,
} from "./ExpandedLabParts";
import { ChartBoundary } from "./AppBoundary";

const Chart = lazy(() =>
  import("./AdditionalCharts").then((m) => ({ default: m.AdditionalChart })),
);

function ReagentBottle({
  isLeft,
  gas,
  label,
  tilted = false,
}: {
  isLeft: boolean;
  gas: boolean;
  label: string;
  tilted?: boolean;
}) {
  return (
    <g>
      {/* Nắp lọ khi đứng yên hoặc miệng lọ mở khi nghiêng rót */}
      {tilted ? (
        <rect
          x="-16"
          y="-63"
          width="32"
          height="5"
          rx="2.5"
          fill="#ffffffd8"
          stroke={isLeft ? "#8d72a8" : "#c99b68"}
          strokeWidth="1.8"
        />
      ) : (
        <rect
          x="-18"
          y="-74"
          width="36"
          height="15"
          rx="4"
          fill={isLeft ? "#8d72a8" : "#c99b68"}
        />
      )}
      {/* Cổ và thân lọ */}
      <path
        d="M-15 -59v20l-14 16v86q0 9 9 9h40q9 0 9-9v-86l-14-16v-20z"
        fill={isLeft ? "#ebe1f5" : "#f7ecdc"}
        stroke={isLeft ? "#9d82b8" : "#cca477"}
        strokeWidth="2"
      />
      {/* Mực dung dịch bên trong lọ */}
      <path
        d={
          tilted
            ? isLeft
              ? "M-27 8L13 -54v116q0 7-7 7h-26q-7 0-7-7z"
              : "M-13 -54L27 8v54q0 7-7 7h-26q-7 0-7-7z"
            : "M-27 12h54v42q0 7-7 7h-40q-7 0-7-7z"
        }
        fill={isLeft ? "#cfbceb" : gas ? "#eadbc5" : "#ebd5b7"}
        opacity=".78"
      />
      {/* Nhãn lọ */}
      <rect
        x="-27"
        y="-4"
        width="54"
        height="50"
        rx="5"
        fill="#ffffff"
        stroke="#e2dce8"
      />
      <text
        x="0"
        y="16"
        textAnchor="middle"
        fontSize="11.5"
        fontWeight="700"
        fill="#2d223b"
      >
        {label}
      </text>
      <text
        x="0"
        y="30"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="600"
        fill="#6b5a7e"
      >
        {gas && !isLeft ? "Rắn · M=84" : "DD 0,1M"}
      </text>
      <text
        x="0"
        y="42"
        textAnchor="middle"
        fontSize="9.5"
        fontWeight="700"
        fill="#28775c"
      >
        {gas && !isLeft ? "+0,05 g" : "+5 mL"}
      </text>
    </g>
  );
}

function DropletStream({
  x,
  y,
  color,
  solid = false,
}: {
  x: number;
  y: number;
  color: string;
  solid?: boolean;
}) {
  return (
    <g pointerEvents="none">
      {["reagent-drop", "reagent-drop-delay-1", "reagent-drop-delay-2"].map(
        (cls, idx) => (
          <g key={cls} transform={`translate(${x + (idx - 1) * 3.5} ${y})`}>
            <g className={cls}>
              {solid ? (
                <>
                  <circle
                    cx="-2"
                    cy="0"
                    r="2.8"
                    fill="#ffffff"
                    stroke="#bfa582"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx="3"
                    cy="4"
                    r="2.4"
                    fill="#ffffff"
                    stroke="#bfa582"
                    strokeWidth="1.2"
                  />
                </>
              ) : (
                <path
                  d="M0 -6C3 -1 4.5 2 4.5 4.5A4.5 4.5 0 1 1 -4.5 4.5C-4.5 2 -3 -1 0 -6Z"
                  fill={color}
                  stroke="#ffffffaa"
                  strokeWidth="0.8"
                />
              )}
            </g>
          </g>
        ),
      )}
    </g>
  );
}

function Reactor({
  gas,
  amount,
  liquidVolume,
  labelA,
  labelB,
  molesA,
  molesB,
  limitingLabel,
  subEquation,
  pourAnim,
  onPour,
}: {
  gas: boolean;
  amount: number;
  liquidVolume: number;
  labelA: string;
  labelB: string;
  molesA: number;
  molesB: number;
  limitingLabel: string;
  subEquation: string;
  pourAnim: { key: string; seq: number } | null;
  onPour: (key: string) => void;
}) {
  const { drag, start, handlers } = useSvgDrag((key, x, y, moved) => {
    if (!moved || (x > 280 && x < 540 && y > 150 && y < 360)) onPour(key);
  });

  const [reactBurst, setReactBurst] = useState<{
    key: string;
    seq: number;
  } | null>(null);
  const prevStateRef = useRef({
    amount,
    liquidVolume,
    pourSeq: pourAnim?.seq ?? 0,
  });

  useEffect(() => {
    const prev = prevStateRef.current;
    const pourChanged = (pourAnim?.seq ?? 0) !== prev.pourSeq && pourAnim;
    const reactionIncreased =
      amount > prev.amount + 1e-6 || liquidVolume > prev.liquidVolume;
    prevStateRef.current = {
      amount,
      liquidVolume,
      pourSeq: pourAnim?.seq ?? 0,
    };
    if (pourChanged || reactionIncreased) {
      const activeKey = pourAnim?.key ?? "a";
      setReactBurst((curr) => ({ key: activeKey, seq: (curr?.seq ?? 0) + 1 }));
    }
  }, [amount, liquidVolume, pourAnim]);

  useEffect(() => {
    if (!reactBurst) return;
    const timer = window.setTimeout(() => setReactBurst(null), 1750);
    return () => window.clearTimeout(timer);
  }, [reactBurst]);

  const liquidHeight = Math.min(115, liquidVolume * 2.1);
  const liquidTopY = 353 - liquidHeight;
  const syringeFill = gas ? Math.min(88, (amount / 125) * 88) : 0;
  const precipRatio = !gas ? Math.min(1, amount / 0.7166) : 0;
  const sedimentHeight = !gas && amount > 0 ? 6 + precipRatio * 37 : 0;
  const sedimentTopY = 353 - sedimentHeight;
  const sedimentArch = 3 + precipRatio * 15;
  const cloudRx = 22 + precipRatio * 56;
  const cloudRy = 9 + precipRatio * 25;
  const cloudCy = Math.max(
    liquidTopY + cloudRy + 4,
    sedimentTopY - cloudRy * 0.45,
  );
  const particleCount =
    !gas && amount > 0 ? Math.max(4, Math.round(4 + precipRatio * 18)) : 0;
  const bubbleCount =
    gas && amount > 0 ? Math.max(4, Math.min(22, Math.round(amount / 5.5))) : 0;
  const dragOverBeaker = Boolean(
    drag?.moved && drag.x > 260 && drag.x < 555 && drag.y > 110 && drag.y < 360,
  );

  return (
    <svg
      className="interactive-stage"
      viewBox="0 0 760 440"
      {...handlers}
      aria-label={
        gas
          ? "Rót axit hoặc thêm bicarbonat vào cốc"
          : "Rót hai dung dịch vào cốc tạo kết tủa"
      }
    >
      <defs>
        <linearGradient id={gas ? "gas-bg" : "precip-bg"} x2="1" y2="1">
          <stop stopColor={gas ? "#f6f3fa" : "#f1f7f4"} />
          <stop offset="1" stopColor={gas ? "#edf3f8" : "#e8f2ec"} />
        </linearGradient>
        <linearGradient id="beaker-glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffffcc" />
          <stop offset="50%" stopColor="#ffffff66" />
          <stop offset="100%" stopColor="#e2ece8aa" />
        </linearGradient>
        <linearGradient id="tyndall-cloud" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff38" />
          <stop offset="60%" stopColor="#ffffffb8" />
          <stop offset="100%" stopColor="#fffffffa" />
        </linearGradient>
      </defs>

      <rect
        x="10"
        y="5"
        width="740"
        height="422"
        rx="22"
        fill={`url(#${gas ? "gas-bg" : "precip-bg"})`}
      />

      {/* Top Stoichiometry HUD — 3 cột tách biệt rõ ràng, không bao giờ đè chữ */}
      <g transform="translate(110 14)">
        <rect
          x="0"
          y="0"
          width="540"
          height="58"
          rx="14"
          fill="#ffffffe6"
          stroke="#dad3e5"
          strokeWidth="1.5"
        />
        <text
          x="18"
          y="21"
          fontSize="10"
          fontWeight="700"
          fill="#5e4b75"
          letterSpacing="0.6"
        >
          TỈ LƯỢNG PHẢN ỨNG (1 : 1)
        </text>
        <rect x="195" y="7" width="150" height="20" rx="6" fill="#f3eff8" />
        <text
          x="270"
          y="21"
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#5b4678"
        >
          {subEquation}
        </text>
        <text
          x="522"
          y="21"
          textAnchor="end"
          fontSize="10.5"
          fontWeight="700"
          fill="#28775c"
        >
          Chất giới hạn: {limitingLabel}
        </text>
        <path d="M18 29h504" stroke="#ebe6f2" strokeWidth="1" />
        <text x="18" y="47" fontSize="11.5" fontWeight="600" fill="#3a2e49">
          n({labelA}) = {(molesA * 1000).toFixed(2)} mmol
        </text>
        <text
          x="522"
          y="47"
          textAnchor="end"
          fontSize="11.5"
          fontWeight="600"
          fill="#3a2e49"
        >
          n({labelB}) = {(molesB * 1000).toFixed(2)} mmol
        </text>
      </g>

      {/* Mặt bàn & Bóng đổ cốc phản ứng */}
      <path d="M55 362h650" stroke="#cfd8d3" strokeWidth="5" />
      <ellipse cx="407" cy="356" rx="134" ry="12" fill="#5b6e651c" />

      {/* Drop target highlight khi kéo lọ */}
      <rect
        x="282"
        y="152"
        width="254"
        height="208"
        rx="20"
        fill={drag ? "#e4dcf245" : "transparent"}
        stroke={drag ? "#9c84b8" : "transparent"}
        strokeDasharray="6 5"
      />

      {/* Cốc phản ứng chính */}
      <path
        d="M302 162l6 3v170q0 20 22 20h154q22 0 22-20V165l6-3"
        fill="url(#beaker-glass)"
        stroke="#8fa399"
        strokeWidth="3"
      />
      <path
        d={`M310 ${liquidTopY}h194v${liquidHeight}q0 17-19 17H329q-19 0-19-17z`}
        fill={gas ? "#dcd4ea" : "#cde4d8"}
        fillOpacity=".76"
      />
      {liquidHeight > 4 && (
        <path
          d={`M310 ${liquidTopY}q97-6 194 0`}
          fill="none"
          stroke={gas ? "#b3a3cc" : "#8ab8a3"}
          strokeWidth="2"
        />
      )}

      {/* Vạch chia mL bên thành phải của cốc (x = 456..504) */}
      {[20, 40, 60, 80, 100].map((mark, idx) => {
        const y = 353 - (idx + 1) * 28;
        return (
          <g key={mark}>
            <path d={`M494 ${y}h10`} stroke="#7b9187" strokeWidth="1.5" />
            <text
              x="490"
              y={y + 3}
              textAnchor="end"
              fontSize="8.5"
              fill="#687f74"
            >
              {mark} mL
            </text>
          </g>
        );
      })}

      {/* Hiệu ứng khuấy trộn khi mới cho 1 dung dịch (chưa có chất thứ 2 để phản ứng) */}
      {amount === 0 && liquidHeight > 4 && reactBurst && (
        <g key={`mix-${reactBurst.seq}`} pointerEvents="none">
          <ellipse
            cx={reactBurst.key === "a" ? 367 : 447}
            cy={Math.min(340, liquidTopY + liquidHeight * 0.45)}
            rx="34"
            ry={Math.max(10, liquidHeight * 0.35)}
            fill={gas ? "#cbbbe280" : "#b5dccb80"}
            className="reaction-plume-bloom"
          />
          <ellipse
            cx={reactBurst.key === "a" ? 367 : 447}
            cy={Math.max(185, liquidTopY)}
            rx="24"
            ry="4.5"
            fill="none"
            stroke={gas ? "#8c72a6" : "#4f8f7a"}
            strokeWidth="2"
            className="surface-ripple"
          />
        </g>
      )}

      {/* Hiện tượng Kết tủa AgCl trắng — kích thước đám mây, số hạt bông và độ dày lớp lắng tỉ lệ trực tiếp với lượng kết tủa */}
      {!gas && amount > 0 && (
        <g key={`precip-${reactBurst?.seq ?? 0}`}>
          {/* Đám mây đục Tyndall nở rộng theo lượng AgCl tạo thành */}
          <ellipse
            cx="396"
            cy={cloudCy}
            rx={cloudRx}
            ry={cloudRy}
            fill="url(#tyndall-cloud)"
            opacity={Math.min(0.95, 0.36 + precipRatio * 0.59)}
            className={reactBurst ? "precip-cloud-active" : "precip-cloud"}
          />
          {/* Luồng phản ứng kết tủa trắng bung tỏa mạnh tại điểm giọt dung dịch chạm mặt nước */}
          {reactBurst && (
            <>
              <ellipse
                cx={reactBurst.key === "a" ? 367 : 447}
                cy={Math.max(liquidTopY + 16, (liquidTopY + sedimentTopY) / 2)}
                rx={24 + precipRatio * 24}
                ry={Math.max(16, (sedimentTopY - liquidTopY) * 0.48)}
                fill="url(#tyndall-cloud)"
                className="reaction-plume-bloom"
              />
              <ellipse
                cx="396"
                cy={Math.max(liquidTopY + 20, cloudCy - 6)}
                rx={cloudRx * 0.85}
                ry={cloudRy * 0.85}
                fill="#ffffffcc"
                className="reaction-plume-bloom"
              />
              {/* Mưa tinh thể AgCl trắng kết tinh và rơi lắng xuống đáy khi vừa thêm chất */}
              {Array.from({ length: 14 }, (_, i) => {
                const startX =
                  (reactBurst.key === "a" ? 367 : 447) +
                  ((i % 5) - 2) * 14 +
                  (i % 2 === 0 ? 5 : -5);
                const clampedStartX = Math.max(324, Math.min(462, startX));
                const startY = Math.max(
                  liquidTopY + 10,
                  liquidTopY + (i % 3) * 12,
                );
                return (
                  <g
                    key={`snow-${i}`}
                    transform={`translate(${clampedStartX} ${startY})`}
                  >
                    <circle
                      r={2.2 + (i % 3) * 0.8}
                      fill="#ffffff"
                      stroke="#9ab8aa"
                      strokeWidth="1"
                      className={`precip-snow-fall gas-delay-${i % 5}`}
                    />
                  </g>
                );
              })}
            </>
          )}
          {/* Lớp kết tủa rắn AgCl lắng dưới đáy cốc dày lên theo khối lượng thực tế */}
          <path
            d={`M312 ${sedimentTopY}q95 ${-sedimentArch} 190 0V336q0 17-19 17H331q-19 0-19-17z`}
            fill="#ffffff"
            stroke="#cfe0d7"
            strokeWidth="1.5"
            className="precip-sediment"
          />
          <path
            d={`M322 ${sedimentTopY + Math.min(8, sedimentHeight * 0.28)}q85 ${-sedimentArch * 0.7} 170 0`}
            fill="none"
            stroke="#e4efe9"
            strokeWidth="2"
          />
          {/* Các hạt bông kết tủa AgCl tỉ lệ cả về số lượng lẫn kích thước theo phản ứng */}
          {Array.from({ length: particleCount }, (_, i) => {
            const spreadX =
              396 +
              ((i % 7) - 3) * (8 + precipRatio * 11) +
              (i % 2 === 0 ? 4 : -4);
            const clampedX = Math.max(322, Math.min(454, spreadX));
            const bandY =
              sedimentTopY -
              3 -
              (i % 4) * (3 + precipRatio * 7) +
              (i % 2) * 3;
            const clampedY = Math.max(liquidTopY + 8, Math.min(344, bandY));
            const radius = 1.6 + (i % 3) * 0.65 + precipRatio * 2.1;
            return (
              <g key={i} transform={`translate(${clampedX} ${clampedY})`}>
                <circle
                  r={radius}
                  fill="#ffffff"
                  stroke="#b8cdc2"
                  strokeWidth="0.9"
                  opacity=".94"
                  className={
                    reactBurst
                      ? `precip-particle-active gas-delay-${i % 4}`
                      : `precip-crystal-drift gas-delay-${i % 5}`
                  }
                />
              </g>
            );
          })}
        </g>
      )}

      {/* Hiện tượng thoát khí CO2, sủi bọt liên tục, bốc hơi khí & Xi-lanh thu khí */}
      {gas && (
        <>
          <path
            d="M476 165v-34h76"
            fill="none"
            stroke="#8e7ca6"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {amount > 0 && (
            <path
              d="M476 165v-34h76"
              fill="none"
              stroke="#ffffffd9"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="gas-tube-flow"
            />
          )}
          <g transform="translate(552 102)">
            <rect
              x="0"
              y="0"
              width="148"
              height="50"
              rx="10"
              fill="#ffffffeb"
              stroke="#b9accb"
              strokeWidth="1.5"
            />
            <text x="12" y="17" fontSize="8.5" fontWeight="700" fill="#68567d">
              KHÍ CO₂ THU ĐƯỢC
            </text>
            <text
              x="136"
              y="18"
              textAnchor="end"
              fontSize="11.5"
              fontWeight="700"
              fill="#28775c"
            >
              {amount.toFixed(1)} mL
            </text>
            <rect x="12" y="28" width="124" height="10" rx="5" fill="#e6dff0" />
            <rect
              x="12"
              y="28"
              width={Math.min(124, syringeFill + 8)}
              height="10"
              rx="5"
              fill="#6f588f"
            />
          </g>
          {amount > 0 && (
            <g pointerEvents="none">
              {/* Lớp bọt sủi trắng xóa trên bề mặt chất lỏng (liquidTopY) */}
              {Array.from({ length: 12 }, (_, i) => {
                const fx = 320 + i * 14.5;
                return (
                  <g
                    key={`foam-${i}`}
                    transform={`translate(${fx} ${liquidTopY})`}
                  >
                    <circle
                      r={3.2 + (i % 3) * 1.1}
                      fill="#ffffff"
                      fillOpacity=".86"
                      stroke="#b5a4cc"
                      strokeWidth="1"
                      className={`surface-foam gas-delay-${i % 4}`}
                    />
                  </g>
                );
              })}

              {/* Các bọt khí CO₂ sủi từ đáy dung dịch lên mặt thoáng (animation liên tục) */}
              {Array.from({ length: bubbleCount }, (_, i) => {
                const bx = 324 + ((i * 19) % 140);
                const by = Math.max(
                  liquidTopY + 14,
                  344 - ((i * 17) % Math.max(20, liquidHeight - 14)),
                );
                const br = 2.2 + (i % 3) * 1.0 + Math.min(2.2, amount / 55);
                return (
                  <g key={`bubble-${i}`} transform={`translate(${bx} ${by})`}>
                    <circle
                      r={br}
                      fill="#ffffff"
                      fillOpacity=".82"
                      stroke="#7e6899"
                      strokeWidth="1.4"
                      className={`gas-bubble-rise gas-delay-${i % 5}`}
                    />
                  </g>
                );
              })}

              {/* Luồng hơi và khí CO₂ bốc lên từ mặt thoáng hướng về ống dẫn khí */}
              {Array.from({ length: 5 }, (_, i) => {
                const wx = 345 + i * 32;
                const wy = Math.max(195, liquidTopY - 6);
                return (
                  <g key={`vapor-${i}`} transform={`translate(${wx} ${wy})`}>
                    <path
                      d="M0 0 Q-7 -14 0 -28 T4 -56"
                      fill="none"
                      stroke="#9e8bb8"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      opacity=".65"
                      className={`vapor-wisp gas-delay-${i % 5}`}
                    />
                  </g>
                );
              })}

              {/* Bùng nổ sủi bọt mạnh (effervescence burst) ngay lúc vừa thêm HCl hoặc NaHCO₃ */}
              {reactBurst && (
                <g key={`fizz-${reactBurst.seq}`}>
                  <ellipse
                    cx={reactBurst.key === "a" ? 367 : 447}
                    cy={Math.min(340, liquidTopY + liquidHeight * 0.5)}
                    rx="42"
                    ry={Math.max(16, liquidHeight * 0.45)}
                    fill="#ffffffaa"
                    className="reaction-plume-bloom"
                  />
                  {Array.from({ length: 16 }, (_, i) => {
                    const ex =
                      (reactBurst.key === "a" ? 367 : 447) +
                      ((i % 6) - 2.5) * 14;
                    const clampedEx = Math.max(320, Math.min(484, ex));
                    const ey = Math.min(
                      346,
                      liquidTopY + 16 + (i % 4) * 14,
                    );
                    return (
                      <g
                        key={`erupt-${i}`}
                        transform={`translate(${clampedEx} ${ey})`}
                      >
                        <circle
                          r={2.5 + (i % 3) * 1.2}
                          fill="#ffffff"
                          stroke="#6f588f"
                          strokeWidth="1.5"
                          className={`fizz-eruption gas-delay-${i % 4}`}
                        />
                      </g>
                    );
                  })}
                </g>
              )}
            </g>
          )}
        </>
      )}

      {/* Hiệu ứng lọ nghiêng & nhỏ giọt khi bấm nút hoặc thả lọ vào cốc */}
      {pourAnim && (
        <g key={pourAnim.seq} pointerEvents="none">
          <g
            transform={
              pourAnim.key === "a" ? "translate(316 194)" : "translate(498 194)"
            }
          >
            <g
              className={
                pourAnim.key === "a"
                  ? "pouring-bottle-right"
                  : "pouring-bottle-left"
              }
            >
              <ReagentBottle
                isLeft={pourAnim.key === "a"}
                gas={gas}
                label={pourAnim.key === "a" ? labelA : labelB}
                tilted
              />
            </g>
          </g>
          <DropletStream
            x={pourAnim.key === "a" ? 367 : 447}
            y={162}
            color={pourAnim.key === "a" ? "#9b7ec4" : "#6cb39a"}
            solid={gas && pourAnim.key === "b"}
          />
          {liquidHeight > 0 && (
            <ellipse
              cx={pourAnim.key === "a" ? 367 : 447}
              cy={Math.max(185, liquidTopY)}
              rx="18"
              ry="4"
              fill="none"
              stroke={pourAnim.key === "a" ? "#8c72a6" : "#4f8f7a"}
              strokeWidth="2"
              className="surface-ripple"
            />
          )}
        </g>
      )}

      {/* Nhãn thông tin AgCl / CO₂ và hướng dẫn đặt hẳn bên dưới đáy cốc (y = 374..418) để không bao giờ vướng vào lọ */}
      <g transform="translate(407 384)">
        <rect
          x="-158"
          y="-13"
          width="316"
          height="22"
          rx="11"
          fill={amount > 0 ? "#28775ce6" : "#ffffffd9"}
          stroke={amount > 0 ? "none" : "#cbd8d1"}
          strokeWidth="1"
        />
        <text
          y="2"
          textAnchor="middle"
          fontSize="10.5"
          fontWeight="700"
          fill={amount > 0 ? "#ffffff" : "#4f665b"}
        >
          {gas
            ? amount > 0
              ? `Khí CO₂↑ thoát ra: ${amount.toFixed(1)} mL · V(dd) = ${liquidVolume} mL`
              : "Chạm hoặc kéo lọ HCl / NaHCO₃ vào cốc để sinh khí CO₂"
            : amount > 0
              ? `Kết tủa AgCl↓ trắng: ${amount.toFixed(4)} g · V(tổng) = ${liquidVolume} mL`
              : "Chạm hoặc kéo lọ AgNO₃ / NaCl vào cốc để tạo kết tủa AgCl"}
        </text>
      </g>
      <text
        x="407"
        y="414"
        textAnchor="middle"
        fill="#5b6e64"
        fontSize="10.5"
        fontWeight="600"
      >
        {gas
          ? "Chạm hoặc kéo lọ HCl / NaHCO₃ vào cốc · Khí lý tưởng ở 25°C, 1 atm"
          : "Chạm hoặc kéo lọ AgNO₃ / NaCl vào cốc để thêm từng lượng dung dịch"}
      </text>

      {/* Hai lọ tác chất đặt trên bàn */}
      {[
        ["a", 95, labelA],
        ["b", 600, labelB],
      ].map(([key, rawX, label]) => {
        const x = Number(rawX);
        const isLeft = key === "a";
        const isPouringThis = pourAnim?.key === key;
        return (
          <g
            key={key}
            data-testid={`reaction-bottle-${key}`}
            role="button"
            tabIndex={0}
            aria-label={`Thêm ${label}`}
            className="svg-draggable"
            onPointerDown={(e) => start(e, String(key))}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPour(String(key));
              }
            }}
            opacity={
              (drag?.key === key && drag.moved) || isPouringThis ? 0.3 : 1
            }
          >
            <ellipse cx={x + 35} cy="322" rx="34" ry="8" fill="#576b6020" />
            <g transform={`translate(${x + 35} 250)`}>
              <ReagentBottle isLeft={isLeft} gas={gas} label={String(label)} />
            </g>
          </g>
        );
      })}

      {/* Lọ nghiêng đi theo con trỏ khi người dùng đang kéo thả */}
      {drag?.moved && (
        <g pointerEvents="none">
          <g
            transform={`translate(${drag.x} ${drag.y}) rotate(${drag.key === "a" ? 48 : -48})`}
          >
            <ReagentBottle
              isLeft={drag.key === "a"}
              gas={gas}
              label={drag.key === "a" ? labelA : labelB}
              tilted
            />
          </g>
          {dragOverBeaker && (
            <DropletStream
              x={Math.max(
                325,
                Math.min(485, drag.x + (drag.key === "a" ? 45 : -45)),
              )}
              y={Math.max(158, Math.min(250, drag.y - 38))}
              color={drag.key === "a" ? "#9b7ec4" : "#6cb39a"}
              solid={gas && drag.key === "b"}
            />
          )}
        </g>
      )}
    </svg>
  );
}

function ReactionLayout({
  id,
  gas,
  amount,
  liquidVolume,
  molesA,
  molesB,
  limitingLabel,
  subEquation,
  pourAnim,
  onPour,
  controls,
  presets,
  readings,
  equation,
  data,
  yLabel,
  onReset,
  onRecord,
  footer,
}: {
  id: LabId;
  gas: boolean;
  amount: number;
  liquidVolume: number;
  molesA: number;
  molesB: number;
  limitingLabel: string;
  subEquation: string;
  pourAnim: { key: string; seq: number } | null;
  onPour: (key: string) => void;
  controls: ReactNode;
  presets: ReactNode;
  readings: ReactNode;
  equation: string;
  data: { x: number; y: number }[];
  yLabel: string;
  onReset: () => void;
  onRecord: () => void;
  footer: ReactNode;
}) {
  return (
    <>
      <div className="workbench-grid interactive-lab" data-lab={id}>
        <section className="stage-panel">
          <div className="panel-title">
            <h2>
              {gas
                ? "Quan sát khí CO₂ tạo thành"
                : "Quan sát kết tủa AgCl trắng"}
            </h2>
            <span className="mode-chip">
              <i />{" "}
              {gas ? "25°C · 1 atm · Tỉ lệ 1:1" : "Dung dịch 0,1 M · Tỉ lệ 1:1"}
            </span>
          </div>
          <Reactor
            gas={gas}
            amount={amount}
            liquidVolume={liquidVolume}
            labelA={gas ? "HCl" : "AgNO₃"}
            labelB={gas ? "NaHCO₃" : "NaCl"}
            molesA={molesA}
            molesB={molesB}
            limitingLabel={limitingLabel}
            subEquation={subEquation}
            pourAnim={pourAnim}
            onPour={onPour}
          />
          <div className="stage-actions">
            <button className="primary-button" onClick={() => onPour("a")}>
              ＋5 mL {gas ? "HCl" : "AgNO₃"}
            </button>
            <button className="secondary-button" onClick={() => onPour("b")}>
              {gas ? "＋0,05 g NaHCO₃" : "＋5 mL NaCl"}
            </button>
            <button className="secondary-button" onClick={onReset}>
              ↺ Đặt lại
            </button>
            <button className="record-button" onClick={onRecord}>
              ＋ Ghi số đo
            </button>
          </div>
          {readings}
        </section>

        <aside className="experiment-sidebar">
          <section className="parameter-panel">
            <div className="panel-title">
              <h2>Lượng chất tham gia</h2>
              <span>Điều kiện chuẩn 25°C</span>
            </div>
            {controls}
            {presets}
            <div className="reaction-equation">{equation}</div>
            <p className="content-note" style={{ marginTop: 10 }}>
              {gas
                ? "Bọt khí và xi-lanh minh họa thể tích CO₂ lý thuyết ở 25°C, 1 atm; không mô phỏng tốc độ thoát khí."
                : "Độ đục và lớp lắng minh họa khối lượng AgCl kết tủa hoàn toàn; không mô phỏng tích số tan Ksp."}
            </p>
          </section>
          <section className="chart-panel">
            <div className="panel-title">
              <h2>
                {gas
                  ? "Thể tích CO₂ theo lượng NaHCO₃"
                  : "Khối lượng AgCl theo thể tích NaCl"}
              </h2>
              <span>Điểm gãy = đổi chất giới hạn</span>
            </div>
            <ChartBoundary>
              <Suspense fallback={<p>Đang mở đồ thị…</p>}>
                <Chart
                  data={data}
                  xLabel={gas ? "NaHCO₃ (g)" : "NaCl 0,1 M (mL)"}
                  yLabel={yLabel}
                />
              </Suspense>
            </ChartBoundary>
          </section>
        </aside>
      </div>
      {footer}
    </>
  );
}

export function PrecipitationLab() {
  const { engine, state } = useLab("precipitation");
  const { parameters: p, reading: r } = state;
  const [pourAnim, setPourAnim] = useState<{ key: string; seq: number } | null>(
    null,
  );

  useEffect(() => {
    if (!pourAnim) return;
    const timer = window.setTimeout(() => setPourAnim(null), 650);
    return () => window.clearTimeout(timer);
  }, [pourAnim]);

  const pour = (key: string) => {
    engine.setParameters(
      key === "a"
        ? { silverVolume_ml: Math.min(50, p.silverVolume_ml + 5) }
        : { chlorideVolume_ml: Math.min(50, p.chlorideVolume_ml + 5) },
    );
    setPourAnim((prev) => ({ key, seq: (prev?.seq ?? 0) + 1 }));
  };

  const limitingLabel =
    r.limitingReagent === "equivalent"
      ? r.precipitateMoles
        ? "Vừa đủ"
        : "Chưa thêm chất"
      : r.limitingReagent;

  return (
    <ReactionLayout
      id="precipitation"
      gas={false}
      amount={r.precipitateMass_g}
      liquidVolume={r.totalVolume_ml}
      molesA={r.silverMoles}
      molesB={r.chlorideMoles}
      limitingLabel={limitingLabel}
      subEquation={r.ionicEquation}
      pourAnim={pourAnim}
      onPour={pour}
      onReset={() => {
        engine.reset();
        setPourAnim(null);
      }}
      onRecord={() => engine.record()}
      equation={r.equation}
      data={Array.from({ length: 51 }, (_, x) => ({
        x,
        y: precipitationReading({ ...p, chlorideVolume_ml: x })
          .precipitateMass_g,
      }))}
      yLabel="AgCl (g)"
      controls={
        <>
          <LabSlider
            label="Thể tích AgNO3"
            unit="mL"
            min={0}
            max={50}
            step={1}
            value={p.silverVolume_ml}
            onChange={(silverVolume_ml) =>
              engine.setParameters({ silverVolume_ml })
            }
          />
          <LabSlider
            label="Thể tích NaCl"
            unit="mL"
            min={0}
            max={50}
            step={1}
            value={p.chlorideVolume_ml}
            onChange={(chlorideVolume_ml) =>
              engine.setParameters({ chlorideVolume_ml })
            }
          />
          <p className="content-note">
            AgNO₃ và NaCl đều 0,100 M · M(AgCl) = 143,32 g/mol
          </p>
        </>
      }
      presets={
        <div className="preset-row" aria-label="Kịch bản tỉ lượng kết tủa">
          {[
            { label: "AgNO₃ giới hạn (10 / 25 mL)", a: 10, b: 25 },
            { label: "Vừa đủ 1:1 (25 / 25 mL)", a: 25, b: 25 },
            { label: "NaCl giới hạn (25 / 10 mL)", a: 25, b: 10 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={`preset-pill ${p.silverVolume_ml === item.a && p.chlorideVolume_ml === item.b ? "active" : ""}`}
              onClick={() =>
                engine.setParameters({
                  silverVolume_ml: item.a,
                  chlorideVolume_ml: item.b,
                })
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      }
      readings={
        <ExpandedReadings
          items={[
            {
              label: "Khối lượng AgCl",
              value: r.precipitateMass_g.toFixed(4),
              unit: "g",
              testId: "precipitate-mass",
            },
            {
              label: "Số mol AgCl",
              value: r.precipitateMoles.toFixed(4),
              unit: "mol",
            },
            { label: "Chất giới hạn", value: limitingLabel },
          ]}
        />
      }
      footer={
        <ExpandedFooter
          id="precipitation"
          formulas={
            <p>
              <strong>
                n = CV · nAgCl = min(nAgNO₃, nNaCl) · mAgCl = 143,32 × nAgCl
              </strong>
            </p>
          }
          columns={["AgNO₃ (mL)", "NaCl (mL)", "AgCl (g)"]}
          rows={state.records.map((row) => [
            row.parameters.silverVolume_ml,
            row.parameters.chlorideVolume_ml,
            row.reading.precipitateMass_g.toFixed(4),
          ])}
          onClear={() => engine.clearRecords()}
        />
      }
    />
  );
}

export function GasReactionLab() {
  const { engine, state } = useLab("gas-reaction");
  const { parameters: p, reading: r } = state;
  const [pourAnim, setPourAnim] = useState<{ key: string; seq: number } | null>(
    null,
  );

  useEffect(() => {
    if (!pourAnim) return;
    const timer = window.setTimeout(() => setPourAnim(null), 650);
    return () => window.clearTimeout(timer);
  }, [pourAnim]);

  const pour = (key: string) => {
    engine.setParameters(
      key === "a"
        ? { acidVolume_ml: Math.min(50, p.acidVolume_ml + 5) }
        : {
            bicarbonateMass_g: Math.min(
              1,
              Math.round((p.bicarbonateMass_g + 0.05) * 100) / 100,
            ),
          },
    );
    setPourAnim((prev) => ({ key, seq: (prev?.seq ?? 0) + 1 }));
  };

  const limitingLabel =
    r.limitingReagent === "equivalent"
      ? r.reactionMoles
        ? "Vừa đủ"
        : "Chưa thêm chất"
      : r.limitingReagent;

  return (
    <ReactionLayout
      id="gas-reaction"
      gas
      amount={r.carbonDioxideVolume_ml}
      liquidVolume={p.acidVolume_ml}
      molesA={r.acidMoles}
      molesB={r.bicarbonateMoles}
      limitingLabel={limitingLabel}
      subEquation="HCO₃⁻ + H⁺ → CO₂↑ + H₂O"
      pourAnim={pourAnim}
      onPour={pour}
      onReset={() => {
        engine.reset();
        setPourAnim(null);
      }}
      onRecord={() => engine.record()}
      equation={r.equation}
      data={Array.from({ length: 51 }, (_, i) => ({
        x: i / 50,
        y: gasReactionReading({ ...p, bicarbonateMass_g: i / 50 })
          .carbonDioxideVolume_ml,
      }))}
      yLabel="CO₂ (mL)"
      controls={
        <>
          <LabSlider
            label="Thể tích HCl"
            unit="mL"
            min={0}
            max={50}
            value={p.acidVolume_ml}
            onChange={(acidVolume_ml) =>
              engine.setParameters({ acidVolume_ml })
            }
          />
          <LabSlider
            label="Khối lượng NaHCO3"
            unit="g"
            min={0}
            max={1}
            step={0.01}
            value={p.bicarbonateMass_g}
            onChange={(bicarbonateMass_g) =>
              engine.setParameters({ bicarbonateMass_g })
            }
          />
          <p className="content-note">
            HCl 0,100 M · M(NaHCO₃) = 84,0066 g/mol · Khí lý tưởng 25°C, 1 atm
          </p>
        </>
      }
      presets={
        <div className="preset-row" aria-label="Kịch bản tỉ lượng tạo khí">
          {[
            { label: "NaHCO₃ giới hạn (25 mL / 0,10 g)", v: 25, m: 0.1 },
            { label: "Gần tương đương (25 mL / 0,21 g)", v: 25, m: 0.21 },
            { label: "HCl giới hạn (25 mL / 0,42 g)", v: 25, m: 0.42 },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={`preset-pill ${p.acidVolume_ml === item.v && Math.abs(p.bicarbonateMass_g - item.m) < 0.005 ? "active" : ""}`}
              onClick={() =>
                engine.setParameters({
                  acidVolume_ml: item.v,
                  bicarbonateMass_g: item.m,
                })
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      }
      readings={
        <ExpandedReadings
          items={[
            {
              label: "CO₂ lý thuyết",
              value: r.carbonDioxideVolume_ml.toFixed(2),
              unit: "mL",
              testId: "gas-volume",
            },
            {
              label: "Số mol CO₂",
              value: r.reactionMoles.toFixed(4),
              unit: "mol",
            },
            { label: "Chất giới hạn", value: limitingLabel },
          ]}
        />
      }
      footer={
        <ExpandedFooter
          id="gas-reaction"
          formulas={
            <p>
              <strong>
                nCO₂ = min(nHCl, nNaHCO₃) · VCO₂ = nRT/P · T = 298,15 K, P = 1
                atm
              </strong>
            </p>
          }
          columns={["HCl (mL)", "NaHCO₃ (g)", "CO₂ (mL)"]}
          rows={state.records.map((row) => [
            row.parameters.acidVolume_ml,
            row.parameters.bicarbonateMass_g,
            row.reading.carbonDioxideVolume_ml.toFixed(2),
          ])}
          onClear={() => engine.clearRecords()}
        />
      }
    />
  );
}
