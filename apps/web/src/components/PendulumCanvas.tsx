import { useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';
import { pendulumAngleAtTime, type PendulumParameters } from '@lumilab/lab-engine';

const W = 760, H = 420, PX = 148, pivot = { x: W / 2, y: 56 };
const materials = { steel: ['#5b8596', '#bbd3df'], copper: ['#b86b43', '#f1c39c'], wood: ['#9c754d', '#e1c69c'] };
export type Material = keyof typeof materials;
interface Props {
  parameters: PendulumParameters; time: number; side: number; material: Material;
  onDrag: (length: number, angle: number, side: number) => void;
}

export function PendulumCanvas({ parameters, time, side, material, onDrag }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const elapsed = useRef(time);
  const repaint = useRef<() => void>(() => {});
  const dragging = useRef(false);
  const pointerId = useRef<number | null>(null);

  useEffect(() => { elapsed.current = time; repaint.current(); }, [time]);

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
      const height = width * H / W;
      if (element!.width !== Math.round(width * ratio) || element!.height !== Math.round(height * ratio)) {
        element!.width = Math.round(width * ratio); element!.height = Math.round(height * ratio);
      }
      ctx.setTransform(element!.width / W, 0, 0, element!.height / H, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#edf6f2'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#c9ddd4';
      for (let x = 20; x < W; x += 24) for (let y = 20; y < H - 24; y += 24) { ctx.beginPath(); ctx.arc(x, y, 0.8, 0, 2 * Math.PI); ctx.fill(); }
      const length = parameters.length_m * PX;
      const theta = side * pendulumAngleAtTime(parameters, elapsed.current) * Math.PI / 180;
      const x = pivot.x + length * Math.sin(theta), y = pivot.y + length * Math.cos(theta);
      ctx.strokeStyle = '#c2d9ce'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 6]);
      ctx.beginPath(); ctx.moveTo(pivot.x, pivot.y); ctx.lineTo(pivot.x, 382); ctx.stroke();
      ctx.beginPath(); ctx.arc(pivot.x, pivot.y, length, 0, Math.PI); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#2e6b57'; ctx.beginPath(); ctx.roundRect(pivot.x - 74, 31, 148, 12, 5); ctx.fill();
      ctx.fillStyle = '#a8c5b4'; ctx.fillRect(pivot.x - 4, 43, 8, 13);
      ctx.strokeStyle = '#486658'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(pivot.x, pivot.y); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = '#335d4d'; ctx.beginPath(); ctx.arc(pivot.x, pivot.y, 5, 0, 2 * Math.PI); ctx.fill();
      const gradient = ctx.createRadialGradient(x - radius / 3, y - radius / 3, 1, x, y, radius);
      gradient.addColorStop(0, materials[material][1]); gradient.addColorStop(1, materials[material][0]);
      ctx.shadowColor = '#244a3924'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 7;
      ctx.fillStyle = gradient; ctx.beginPath(); ctx.arc(x, y, radius, 0, 2 * Math.PI); ctx.fill();
      ctx.shadowBlur = 0; ctx.shadowOffsetY = 0; ctx.strokeStyle = '#ffffffb0'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#4f7562'; ctx.font = '13px "Segoe UI", sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(`${parameters.length_m.toFixed(2)} m`, (pivot.x + x) / 2 + 13, (pivot.y + y) / 2);
      ctx.fillStyle = '#d7e6dc'; ctx.fillRect(0, 398, W, 22);
      ctx.strokeStyle = '#a7c4b4'; ctx.beginPath(); ctx.moveTo(0, 398); ctx.lineTo(W, 398); ctx.stroke();
      ctx.fillStyle = '#607b6b'; ctx.font = '12px "Segoe UI", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(`${parameters.mass_kg.toFixed(2)} kg`, x, Math.min(y + radius + 23, 389));
    }
    repaint.current = draw;
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    draw();
    return () => { observer.disconnect(); repaint.current = () => {}; };
  }, [parameters, material, side]);

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) * W / bounds.width, y: (event.clientY - bounds.top) * H / bounds.height };
  }
  function drag(event: PointerEvent<HTMLCanvasElement>) {
    const p = point(event), dx = p.x - pivot.x, dy = Math.max(0, p.y - pivot.y);
    const length = Math.max(0.3, Math.min(2, Math.hypot(dx, dy) / PX));
    const angle = Math.max(0, Math.min(90, Math.abs(Math.atan2(dx, dy) * 180 / Math.PI)));
    onDrag(Math.round(length * 100) / 100, Math.round(angle), dx < 0 ? -1 : 1);
  }
  function release(event: PointerEvent<HTMLCanvasElement>) {
    dragging.current = false;
    if (pointerId.current !== null && event.currentTarget.hasPointerCapture(pointerId.current)) event.currentTarget.releasePointerCapture(pointerId.current);
    pointerId.current = null;
  }
  return <canvas ref={canvas} width={W} height={H} className="pendulum-canvas" data-testid="pendulum-canvas" role="img" aria-label="Con lắc tương tác: kéo quả nặng để đổi chiều dài và góc thả. Có thể dùng các thanh trượt bên dưới."
    onPointerDown={event => {
      const p = point(event), theta = side * pendulumAngleAtTime(parameters, time) * Math.PI / 180;
      const x = pivot.x + parameters.length_m * PX * Math.sin(theta), y = pivot.y + parameters.length_m * PX * Math.cos(theta);
      if (Math.hypot(p.x - x, p.y - y) > 42) return;
      event.currentTarget.setPointerCapture(event.pointerId); pointerId.current = event.pointerId; dragging.current = true; drag(event);
    }} onPointerMove={event => { if (dragging.current && pointerId.current === event.pointerId) drag(event); }}
    onPointerUp={release} onPointerCancel={release} onLostPointerCapture={() => { dragging.current = false; pointerId.current = null; }}>
    Mô phỏng con lắc. Sử dụng các thanh trượt chiều dài, khối lượng và góc thả để thay đổi thông số.
  </canvas>;
}
