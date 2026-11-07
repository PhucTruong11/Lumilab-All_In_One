import { useRef, useState, type PointerEvent } from 'react';

type Drag = { key: string; pointerId: number; x: number; y: number; startX: number; startY: number; moved: boolean };
/** Pointer capture keeps mouse, pen and touch dragging alive outside the SVG. */
export function useSvgDrag(onDrop: (key: string, x: number, y: number, moved: boolean) => void,
  onMove?: (drag: Drag) => void) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const active = useRef<Drag | null>(null);
  function point(event: PointerEvent<SVGElement>) {
    const svg = event.currentTarget instanceof SVGSVGElement ? event.currentTarget : event.currentTarget.ownerSVGElement!;
    const p = svg.createSVGPoint(); p.x = event.clientX; p.y = event.clientY;
    return p.matrixTransform(svg.getScreenCTM()!.inverse());
  }
  function start(event: PointerEvent<SVGElement>, key: string) {
    if (event.button !== 0 || active.current) return;
    event.preventDefault();
    const p = point(event);
    const svg = event.currentTarget.ownerSVGElement!;
    svg.setPointerCapture(event.pointerId);
    active.current = { key, pointerId: event.pointerId, x: p.x, y: p.y, startX: p.x, startY: p.y, moved: false };
    setDrag(active.current);
  }
  function move(event: PointerEvent<SVGSVGElement>) {
    if (!active.current || active.current.pointerId !== event.pointerId) return;
    const p = point(event);
    active.current = { ...active.current, x: p.x, y: p.y, moved: active.current.moved || Math.hypot(p.x - active.current.startX, p.y - active.current.startY) > 5 };
    setDrag(active.current);
    onMove?.(active.current);
  }
  function end(event: PointerEvent<SVGSVGElement>) {
    if (!active.current || active.current.pointerId !== event.pointerId) return;
    const { key, moved } = active.current;
    const p = point(event);
    active.current = null; setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onDrop(key, p.x, p.y, moved);
  }
  function cancel(event: PointerEvent<SVGSVGElement>) { if (active.current?.pointerId === event.pointerId) { active.current = null; setDrag(null); } }
  return { drag, start, handlers: { onPointerMove: move, onPointerUp: end, onPointerCancel: cancel, onLostPointerCapture: cancel } };
}
