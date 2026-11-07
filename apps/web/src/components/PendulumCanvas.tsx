import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { pendulumAngleAtTime, type PendulumParameters } from '@lumilab/lab-engine';

const W = 760, H = 420, PX = 148, pivot = { x: W / 2, y: 56 };
const materials = {
  steel: ['#5b8596', '#bbd3df'],
  copper: ['#b86b43', '#f1c39c'],
  wood: ['#9c754d', '#e1c69c'],
};
export type Material = keyof typeof materials;

export interface PendulumVisualOptions {
  showVectors?: boolean;
  showProtractor?: boolean;
  showEnergyBar?: boolean;
  dampingEnabled?: boolean;
  dampingCoeff?: number;
}

interface Props {
  parameters: PendulumParameters;
  time: number;
  side: number;
  material: Material;
  onDrag: (length: number, angle: number, side: number) => void;
  visualOptions?: PendulumVisualOptions;
}

function drawVector(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  vx: number,
  vy: number,
  color: string,
  label: string
) {
  const len = Math.hypot(vx, vy);
  if (len < 3) return;
  const toX = fromX + vx;
  const toY = fromY + vy;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  const headLen = 8;
  const angle = Math.atan2(vy, vx);
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  ctx.font = 'bold 11px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lx = toX + 13 * Math.cos(angle);
  const ly = toY + 13 * Math.sin(angle);
  ctx.fillText(label, lx, ly);
  ctx.restore();
}

export function PendulumCanvas({
  parameters,
  time,
  side,
  material,
  onDrag,
  visualOptions = { showVectors: true, showProtractor: true, showEnergyBar: true },
}: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const elapsed = useRef(time);
  const repaint = useRef<() => void>(() => {});
  const dragging = useRef(false);
  const pointerId = useRef<number | null>(null);

  useEffect(() => {
    elapsed.current = time;
    repaint.current();
  }, [time]);

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const context = element.getContext('2d');
    if (!context) return;
    const ctx = context;
    const radius = 18 + parameters.mass_kg * 10;

    function draw() {
      const ratio = window.devicePixelRatio || 1;
      const width = element!.getBoundingClientRect().width;
      const height = (width * H) / W;
      if (element!.width !== Math.round(width * ratio) || element!.height !== Math.round(height * ratio)) {
        element!.width = Math.round(width * ratio);
        element!.height = Math.round(height * ratio);
      }
      ctx.setTransform(element!.width / W, 0, 0, element!.height / H, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Background grid
      ctx.fillStyle = '#edf6f2';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c9ddd4';
      for (let x = 20; x < W; x += 24) {
        for (let y = 20; y < H - 24; y += 24) {
          ctx.beginPath();
          ctx.arc(x, y, 0.8, 0, 2 * Math.PI);
          ctx.fill();
        }
      }

      const length = parameters.length_m * PX;
      const bCoeff = visualOptions.dampingEnabled ? (visualOptions.dampingCoeff ?? 0.05) : 0;
      const beta = bCoeff / (2 * parameters.mass_kg);
      const decay = visualOptions.dampingEnabled ? Math.exp(-beta * elapsed.current) : 1;

      const rawAngleDeg = side * pendulumAngleAtTime(parameters, elapsed.current);
      const thetaDeg = rawAngleDeg * decay;
      const thetaRad = (thetaDeg * Math.PI) / 180;
      const bobX = pivot.x + length * Math.sin(thetaRad);
      const bobY = pivot.y + length * Math.cos(thetaRad);

      // Trajectory dashed arc
      const releaseRad = (parameters.angle_deg * Math.PI) / 180;
      ctx.strokeStyle = '#c2d9ce';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(pivot.x, pivot.y, length, Math.PI / 2 - releaseRad, Math.PI / 2 + releaseRad);
      ctx.stroke();

      // Vertical equilibrium line
      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(pivot.x, Math.min(385, pivot.y + length + 35));
      ctx.stroke();
      ctx.setLineDash([]);

      // Protractor (Thước đo góc)
      if (visualOptions.showProtractor !== false) {
        const pR = 76;
        ctx.save();
        ctx.fillStyle = 'rgba(235, 244, 238, 0.55)';
        ctx.beginPath();
        ctx.arc(pivot.x, pivot.y, pR, Math.PI / 6, (5 * Math.PI) / 6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#9ebdb0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pivot.x, pivot.y, pR, Math.PI / 6, (5 * Math.PI) / 6);
        ctx.stroke();

        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#658576';

        // Ticks for angles: -60, -45, -30, -15, 0, 15, 30, 45, 60
        for (const deg of [-60, -45, -30, -15, 0, 15, 30, 45, 60]) {
          const r = (deg * Math.PI) / 180;
          const tickLen = deg % 30 === 0 ? 8 : 4;
          const tx1 = pivot.x + (pR - tickLen) * Math.sin(r);
          const ty1 = pivot.y + (pR - tickLen) * Math.cos(r);
          const tx2 = pivot.x + pR * Math.sin(r);
          const ty2 = pivot.y + pR * Math.cos(r);
          ctx.beginPath();
          ctx.moveTo(tx1, ty1);
          ctx.lineTo(tx2, ty2);
          ctx.stroke();
          if (deg % 30 === 0) {
            const lx = pivot.x + (pR - 16) * Math.sin(r);
            const ly = pivot.y + (pR - 16) * Math.cos(r);
            ctx.fillText(`${Math.abs(deg)}°`, lx, ly);
          }
        }

        // Active deflection angle sector
        if (Math.abs(thetaDeg) > 0.5) {
          ctx.fillStyle = 'rgba(40, 119, 92, 0.16)';
          ctx.beginPath();
          ctx.moveTo(pivot.x, pivot.y);
          if (thetaRad > 0) {
            ctx.arc(pivot.x, pivot.y, pR, Math.PI / 2, Math.PI / 2 - thetaRad, true);
          } else {
            ctx.arc(pivot.x, pivot.y, pR, Math.PI / 2, Math.PI / 2 - thetaRad, false);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // Top suspension mount
      ctx.fillStyle = '#2e6b57';
      ctx.beginPath();
      ctx.roundRect(pivot.x - 74, 31, 148, 12, 5);
      ctx.fill();
      ctx.fillStyle = '#a8c5b4';
      ctx.fillRect(pivot.x - 4, 43, 8, 13);

      // Cord
      ctx.strokeStyle = '#486658';
      ctx.lineWidth = 2.8;
      ctx.beginPath();
      ctx.moveTo(pivot.x, pivot.y);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Pivot pin
      ctx.fillStyle = '#26483b';
      ctx.beginPath();
      ctx.arc(pivot.x, pivot.y, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Bob (Quả nặng)
      const gradient = ctx.createRadialGradient(bobX - radius / 3, bobY - radius / 3, 1, bobX, bobY, radius);
      gradient.addColorStop(0, materials[material][1]);
      gradient.addColorStop(1, materials[material][0]);

      ctx.save();
      ctx.shadowColor = '#244a3933';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(bobX, bobY, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = '#ffffffb0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bobX, bobY, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Physics vector calculations
      const g = parameters.gravity_m_s2;
      const m = parameters.mass_kg;
      const hMax = parameters.length_m * (1 - Math.cos((parameters.angle_deg * Math.PI) / 180));
      const initialTotalE = m * g * hMax;
      const totalE = visualOptions.dampingEnabled ? initialTotalE * (decay * decay) : initialTotalE;
      const hCurrent = parameters.length_m * (1 - Math.cos(thetaRad));
      const potE = m * g * hCurrent;
      const kinE = Math.max(0, totalE - potE);
      const speed = Math.sqrt((2 * kinE) / m);

      // Direction via finite difference
      const dtEps = 0.005;
      const nextRawAngleDeg = side * pendulumAngleAtTime(parameters, elapsed.current + dtEps);
      const nextDecay = visualOptions.dampingEnabled ? Math.exp(-beta * (elapsed.current + dtEps)) : 1;
      const nextAngleDeg = nextRawAngleDeg * nextDecay;
      const motionSign = nextAngleDeg >= thetaDeg ? 1 : -1;

      // Vectors: Gravity P, Tension T, Velocity v, Air resistance Fc
      if (visualOptions.showVectors !== false) {
        // Gravity P = mg (downward)
        const pLen = Math.min(65, Math.max(26, m * 55));
        drawVector(ctx, bobX, bobY, 0, pLen, '#d97706', 'P');

        // Tension T = m(g*cos(theta) + v^2/L) towards pivot
        const tensionMag = m * (g * Math.cos(thetaRad) + (speed * speed) / parameters.length_m);
        const tScale = Math.min(80, Math.max(30, (tensionMag / (m * g)) * 38));
        const tVx = -Math.sin(thetaRad) * tScale;
        const tVy = -Math.cos(thetaRad) * tScale;
        drawVector(ctx, bobX, bobY, tVx, tVy, '#7c3aed', 'T');

        // Velocity v (tangent to arc)
        if (speed > 0.03) {
          const vScale = Math.min(80, speed * 42);
          const vVx = motionSign * Math.cos(thetaRad) * vScale;
          const vVy = motionSign * -Math.sin(thetaRad) * vScale;
          drawVector(ctx, bobX, bobY, vVx, vVy, '#0284c7', 'v');

          // Air resistance Fc = -b*v (opposite to velocity)
          if (visualOptions.dampingEnabled) {
            const fcScale = Math.min(60, vScale * (bCoeff / 0.12));
            if (fcScale > 5) {
              drawVector(ctx, bobX, bobY, -vVx * (fcScale / vScale), -vVy * (fcScale / vScale), '#e11d48', 'Fc');
            }
          }
        }
      }

      // Energy Bar Gauge (Thanh bảo toàn / tiêu tán cơ năng thời gian thực)
      if (visualOptions.showEnergyBar !== false) {
        const cardX = 20, cardY = 20, cardW = 160, cardH = 68;
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
        ctx.strokeStyle = '#d0ded5';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 9);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.fillStyle = visualOptions.dampingEnabled ? '#b91c1c' : '#2e6b57';
        ctx.textAlign = 'left';
        ctx.fillText(visualOptions.dampingEnabled ? 'Cơ năng E (Tắt dần)' : 'Bảo toàn cơ năng (E)', cardX + 10, cardY + 16);

        // Bar container
        const barX = cardX + 10, barY = cardY + 24, barW = cardW - 20, barH = 10;
        ctx.fillStyle = '#e5ece7';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 4);
        ctx.fill();

        const safeTotal = totalE > 0 ? totalE : 1e-6;
        const kinRatio = Math.min(1, Math.max(0, kinE / safeTotal));
        const kinW = Math.round(barW * kinRatio);
        const potW = barW - kinW;

        // Kinetic part (green)
        if (kinW > 0) {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.roundRect(barX, barY, kinW, barH, kinW === barW ? 4 : [4, 0, 0, 4]);
          ctx.fill();
        }

        // Potential part (amber)
        if (potW > 0) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.roundRect(barX + kinW, barY, potW, barH, kinW === 0 ? 4 : [0, 4, 4, 0]);
          ctx.fill();
        }

        // Labels
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillStyle = '#0f766e';
        ctx.fillText(`Wđ: ${kinE.toFixed(3)} J`, barX, cardY + 50);

        ctx.fillStyle = '#b45309';
        ctx.textAlign = 'right';
        ctx.fillText(`Wt: ${potE.toFixed(3)} J`, barX + barW, cardY + 50);
        ctx.restore();
      }

      // Labels on canvas
      ctx.fillStyle = '#4f7562';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${parameters.length_m.toFixed(2)} m`,
        (pivot.x + bobX) / 2 + 13,
        (pivot.y + bobY) / 2
      );

      // Floor ground
      ctx.fillStyle = '#d7e6dc';
      ctx.fillRect(0, 398, W, 22);
      ctx.strokeStyle = '#a7c4b4';
      ctx.beginPath();
      ctx.moveTo(0, 398);
      ctx.lineTo(W, 398);
      ctx.stroke();

      // Bob mass label
      ctx.fillStyle = '#607b6b';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${parameters.mass_kg.toFixed(2)} kg`, bobX, Math.min(bobY + radius + 23, 389));
    }

    repaint.current = draw;
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    draw();
    return () => {
      observer.disconnect();
      repaint.current = () => {};
    };
  }, [parameters, material, side, visualOptions]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) * W) / bounds.width,
      y: ((event.clientY - bounds.top) * H) / bounds.height,
    };
  }

  function drag(event: PointerEvent<HTMLCanvasElement>) {
    const p = point(event);
    const dx = p.x - pivot.x;
    const dy = Math.max(0, p.y - pivot.y);
    const length = Math.max(0.3, Math.min(2, Math.hypot(dx, dy) / PX));
    const angle = Math.max(0, Math.min(90, Math.abs((Math.atan2(dx, dy) * 180) / Math.PI)));
    onDrag(Math.round(length * 100) / 100, Math.round(angle), dx < 0 ? -1 : 1);
  }

  function release(event: PointerEvent<HTMLCanvasElement>) {
    dragging.current = false;
    if (pointerId.current !== null && event.currentTarget.hasPointerCapture(pointerId.current)) {
      event.currentTarget.releasePointerCapture(pointerId.current);
    }
    pointerId.current = null;
  }

  return (
    <canvas
      ref={canvas}
      width={W}
      height={H}
      className="pendulum-canvas"
      data-testid="pendulum-canvas"
      role="img"
      tabIndex={0}
      aria-label="Con lắc tương tác: kéo quả nặng; phím trái/phải đổi góc, lên/xuống đổi chiều dài dây."
      onKeyDown={event => {
        if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
        event.preventDefault();
        const length = event.key === 'ArrowUp' ? parameters.length_m + .01 : event.key === 'ArrowDown' ? parameters.length_m - .01 : parameters.length_m;
        const angle = event.key === 'ArrowRight' ? parameters.angle_deg + 1 : event.key === 'ArrowLeft' ? parameters.angle_deg - 1 : parameters.angle_deg;
        onDrag(Math.max(.3, Math.min(2, Number(length.toFixed(2)))), Math.max(0, Math.min(90, angle)), side);
      }}
      onPointerDown={event => {
        const p = point(event);
        const theta = (side * pendulumAngleAtTime(parameters, time) * Math.PI) / 180;
        const x = pivot.x + parameters.length_m * PX * Math.sin(theta);
        const y = pivot.y + parameters.length_m * PX * Math.cos(theta);
        if (Math.hypot(p.x - x, p.y - y) > 42) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointerId.current = event.pointerId;
        dragging.current = true;
        drag(event);
      }}
      onPointerMove={event => {
        if (dragging.current && pointerId.current === event.pointerId) drag(event);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={() => {
        dragging.current = false;
        pointerId.current = null;
      }}
    >
      Mô phỏng con lắc. Sử dụng các thanh trượt chiều dài, khối lượng và góc thả để thay đổi thông số.
    </canvas>
  );
}
