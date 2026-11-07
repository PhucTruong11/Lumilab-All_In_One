import { ChartBoundary } from './AppBoundary';
import { lazy, Suspense, useRef, useState } from 'react';
import { acids, bases, type Acid, type Base, type TitrationParameters } from '@lumilab/lab-engine';
import { useSvgDrag } from './useSvgDrag';
import { useLab } from '../labSession';

const Chart = lazy(() => import('./LabCharts').then(module => ({ default: module.TitrationChart })));
const solutions = [...Object.entries(acids).map(([key, label]) => ({ key, label, kind: 'acid' })), ...Object.entries(bases).map(([key, label]) => ({ key, label, kind: 'base' }))];
function Bottle({ label, kind }: { label: string; kind: string }) {
  return <g><rect x="-17" y="-48" width="34" height="13" rx="4" fill={kind === 'acid' ? '#a48eb7' : '#6ca593'}/><path d="M-13-35v12q0 3-9 8v52q0 7 7 7h30q7 0 7-7v-52q-9-5-9-8v-12z" fill={kind === 'acid' ? '#f1eaf5' : '#e2f2eb'} stroke={kind === 'acid' ? '#b7a3c5' : '#8eb9a7'} strokeWidth="2"/><path d="M-20 10h40v26q0 6-6 6h-28q-6 0-6-6z" fill={kind === 'acid' ? '#d9c6e5' : '#b1d9c9'} opacity=".65"/><rect x="-26" y="-5" width="52" height="25" rx="5" fill="white"/><text y="12" textAnchor="middle" fontSize="12" fontWeight="600" fill="#51675b">{label}</text></g>;
}
export function ChemistryLab() {
  const { engine, state } = useLab('chemistry');
  const { parameters, reading, records } = state;
  const setParameters = (updater: (previous: TitrationParameters) => TitrationParameters) => engine.setParameters(updater(engine.snapshot().parameters));
  const [notice, setNotice] = useState('');
  const [dropKey, setDropKey] = useState(0);
  const stopcockPressed = useRef(false);
  function pour(amount: number) {
    setParameters(previous => ({ ...previous, baseVolume_ml: Math.min(50, Math.round((previous.baseVolume_ml + amount) * 100) / 100) }));
    setDropKey(value => value + 1); setNotice(`Đã thêm ${amount.toFixed(2)} mL bazơ.`);
  }
  function choose(key: string, pourIntoFlask = false) {
    const solution = solutions.find(item => item.key === key)!;
    if (solution.kind === 'acid') {
      setParameters(previous => ({ ...previous, acid: key as Acid, baseVolume_ml: 0 }));
      setNotice(`Mẫu mới: 25 mL ${solution.label} 0,1 M.`);
    } else {
      const changed = key !== parameters.base;
      setParameters(previous => ({ ...previous, base: key as Base, baseVolume_ml: changed ? pourIntoFlask ? 1 : 0 : pourIntoFlask ? Math.min(50, previous.baseVolume_ml + 1) : previous.baseVolume_ml }));
      if (pourIntoFlask) setDropKey(value => value + 1);
      setNotice(changed ? `Đổi sang ${solution.label}; bắt đầu lượt thử mới${pourIntoFlask ? ', thêm 1 mL bazơ' : ''}.` : pourIntoFlask ? `Đã thêm 1 mL ${solution.label}.` : `Buret chứa ${solution.label} 0,1 M.`);
    }
  }
  const { drag, start, handlers } = useSvgDrag((key, x, y, moved) => {
    if (!moved) { choose(key); return; }
    if (x >= 350 && x <= 595 && y >= 220 && y <= 410) choose(key, true);
    else if (x >= 415 && x <= 535 && y < 220 && Object.hasOwn(bases, key)) choose(key);
    else setNotice('Đưa lọ vào bình hoặc chọn dung dịch bằng nút bên dưới.');
  });
  const selected = (key: string) => key === parameters.acid || key === parameters.base;
  return <>
    <div className="workbench-grid interactive-lab chemistry-lab">
      <section className="stage-panel" aria-label="Bàn chuẩn độ"><div className="panel-title"><h2>Bàn thí nghiệm</h2><span className="mode-chip"><i/>25°C · Phenolphthalein</span></div>
        <svg className="interactive-stage" viewBox="0 0 760 440" aria-label="Kéo lọ dung dịch vào bình chuẩn độ" {...handlers}>
          <defs><linearGradient id="chem-bg" x2="1" y2="1"><stop stopColor="#f7f3fb"/><stop offset="1" stopColor="#eef6f0"/></linearGradient><linearGradient id="flask-glass"><stop stopColor="#ffffffb0"/><stop offset="1" stopColor="#e3f0e880"/></linearGradient><clipPath id="flask-clip"><path d="M445 247v48l-47 75q-10 18 10 18h134q20 0 10-18l-47-75v-48z"/></clipPath></defs>
          <rect x="10" y="5" width="740" height="422" rx="22" fill="url(#chem-bg)"/><ellipse cx="475" cy="395" rx="100" ry="12" fill="#738e7b16"/>
          <path d="M570 385V48m-25 0h50M543 385h63" stroke="#9eafa4" strokeWidth="7" strokeLinecap="round"/><path d="M570 90h-93" stroke="#94a59a" strokeWidth="5"/>
          <rect x="461" y="40" width="28" height="170" rx="5" fill="#ffffffb0" stroke="#9eafa4" strokeWidth="2"/>
          <rect x="464" y={50 + parameters.baseVolume_ml / 50 * 140} width="22" height={Math.max(0, 140 - parameters.baseVolume_ml / 50 * 140)} rx="2" fill="#a9d6c5" opacity=".8"/>
          {Array.from({ length: 11 }, (_, i) => <g key={i}><path d={`M480 ${50 + i * 14}h8`} stroke="#8a9e90"/><text x="450" y={54 + i * 14} textAnchor="end" fontSize="9" fill="#809589">{i * 5}</text></g>)}
          <text x="510" y="54" fontSize="12" fill="#5b7d6a">{bases[parameters.base]}</text><text x="510" y="72" fontSize="10" fill="#87978b">0,1 M</text>
          <path d="M475 210v25" stroke="#a4b7aa" strokeWidth="5"/>
          <g role="button" tabIndex={0} aria-label="Khóa buret: thêm 0,05 mL" className="svg-button" onPointerDown={() => { stopcockPressed.current = true; }} onPointerUp={() => { if (stopcockPressed.current) pour(.05); stopcockPressed.current = false; }} onPointerLeave={() => { stopcockPressed.current = false; }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); pour(.05); } }}><rect x="440" y="194" width="70" height="42" fill="transparent"/><path d="M456 215h38" stroke="#797498" strokeWidth="7" strokeLinecap="round"/><circle cx="475" cy="215" r="6" fill="#aba2c5"/></g>
          {dropKey > 0 && <circle key={dropKey} cx="475" cy="240" r="4" fill="#85baa5" className="falling-drop"/>}
          <rect data-testid="flask-drop-target" x="350" y="246" width="245" height="162" rx="25" fill={drag ? '#e8e1f340' : 'transparent'} stroke={drag ? '#b4a1cb' : 'transparent'} strokeDasharray="6 5"/>
          <path d="M445 247v48l-47 75q-10 18 10 18h134q20 0 10-18l-47-75v-48" fill="url(#flask-glass)" stroke="#97b3a3" strokeWidth="2.5"/>
          <g clipPath="url(#flask-clip)"><rect x="390" y={356 - parameters.baseVolume_ml * .8} width="170" height="80" fill={reading.indicatorFraction > 0 ? `rgba(222,105,170,${.15 + reading.indicatorFraction * .65})` : '#b6dcd440'} className="flask-liquid"/><path d={`M390 ${356 - parameters.baseVolume_ml * .8}q40-5 85 0t85 0`} stroke={reading.indicatorFraction > 0 ? '#ce84b4' : '#a1cabb'} fill="none" strokeWidth="2"/></g>
          <path d="M437 247h76" stroke="#97b3a3" strokeWidth="3" strokeLinecap="round"/><path d="M448 304l-29 54" stroke="white" strokeWidth="5" opacity=".8" strokeLinecap="round"/>
          <text x="475" y="409" textAnchor="middle" fill="#658473" fontSize="11">25 mL {acids[parameters.acid]} · 0,1 M</text>
          <rect x="42" y="245" width="260" height="10" rx="5" fill="#b5c7b8"/><text x="43" y="84" fill="#92a395" fontSize="11" letterSpacing="2">DUNG DỊCH</text>
          {solutions.map((solution, i) => { const x = 92 + i % 2 * 150; const y = i < 2 ? 183 : 350; return <g key={solution.key} transform={`translate(${x} ${y})`} data-testid={`bottle-${solution.key}`} role="button" tabIndex={0} aria-label={`Chọn ${solution.label}`} aria-pressed={selected(solution.key)} className="svg-draggable" onPointerDown={event => start(event, solution.key)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(solution.key); } }} opacity={drag?.key === solution.key ? .3 : 1}>{selected(solution.key) && <ellipse cy="49" rx="42" ry="9" fill="#a1b8a32e"/>}<Bottle label={solution.label} kind={solution.kind}/></g>; })}
          {drag?.moved && <g transform={`translate(${drag.x} ${drag.y}) rotate(25)`} pointerEvents="none"><Bottle label={solutions.find(item => item.key === drag.key)!.label} kind={solutions.find(item => item.key === drag.key)!.kind}/></g>}
        </svg>
        <div className="stage-actions"><button className="primary-button" disabled={parameters.baseVolume_ml >= 50} onClick={() => pour(.05)}>＋ 0,05 mL</button><button className="secondary-button" disabled={parameters.baseVolume_ml >= 50} onClick={() => pour(1)}>Rót 1 mL</button><button className="secondary-button" onClick={() => { setParameters(previous => ({ ...previous, baseVolume_ml: 0 })); setNotice('Đã tạo mẫu axit mới.'); setDropKey(0); }}>↺ Mẫu mới</button><button className="record-button" onClick={() => engine.record()}>＋ Ghi số đo</button></div>
        <div className="readings"><div><span>pH</span><strong data-testid="ph-reading">{reading.pH.toFixed(3)}</strong></div><div><span>Bazơ đã thêm</span><strong data-testid="base-volume-reading">{parameters.baseVolume_ml.toFixed(2)} <small>mL</small></strong></div><div><span>Chỉ thị</span><strong className="indicator-reading" data-testid="indicator-reading">{reading.indicatorFraction > 0 ? 'Hồng' : 'Không màu'}</strong></div></div>
      </section>
      <aside className="experiment-sidebar"><section className="parameter-panel"><div className="panel-title"><h2>Dung dịch</h2><span>0,1 mol/L</span></div><div className="solution-selectors"><label>Axit<select aria-label="Dung dịch axit" value={parameters.acid} onChange={event => choose(event.target.value)}>{Object.entries(acids).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>Bazơ<select aria-label="Dung dịch bazơ" value={parameters.base} onChange={event => choose(event.target.value)}>{Object.entries(bases).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div><label className="parameter"><span>Bazơ đã thêm <output>{parameters.baseVolume_ml.toFixed(2)} mL</output></span><input aria-label="Thể tích bazơ" type="range" min="0" max="50" step=".05" value={parameters.baseVolume_ml} onChange={event => setParameters(previous => ({ ...previous, baseVolume_ml: Number(event.target.value) }))}/></label><label className="compact-number">Nhập thể tích (mL)<input aria-label="Nhập thể tích bazơ" type="number" min="0" max="50" step=".05" value={parameters.baseVolume_ml} onChange={event => { if (event.target.value !== '') setParameters(previous => ({ ...previous, baseVolume_ml: Math.max(0, Math.min(50, Number(event.target.value))) })); }}/></label><div className="reaction-equation" data-testid="reaction-equation">{reading.equation}</div><p className="lab-notice" role="status">{notice || 'Kéo lọ vào bình để thử.'}</p></section>
        <section className="chart-panel"><div className="panel-title"><h2>Đường cong chuẩn độ</h2><span>pH · V</span></div><ChartBoundary><Suspense fallback={<div className="chart-area chart-loading">Đang mở đồ thị…</div>}><Chart parameters={parameters}/></Suspense></ChartBoundary></section></aside>
    </div>
    <div className="below-lab"><details className="model-details"><summary>Công thức & giới hạn</summary><div className="model-content"><div><p><strong>n = C × V</strong> (V theo L) · <strong>CₐVₐ = CᵦVᵦ</strong> tại tương đương: 25 mL. H⁺ + OH⁻ → H₂O.</p><p>pH = −log₁₀[H⁺]; [H⁺][OH⁻] = 10⁻¹⁴ ở 25°C. Mô hình axit–bazơ mạnh 1:1, loãng lý tưởng, thể tích cộng được. Bỏ qua lượng chỉ thị tiêu thụ.</p><p>pH 7 không màu; phenolphthalein chuyển màu trong khoảng 8,2–10. Màu minh họa không phải phép đo. Một bước 0,05 mL là quy ước của lab. Số liệu local, chưa kiểm chứng server. Nguồn: OpenStax Chemistry 2e §14.7.</p></div></div></details><section className="notebook"><div className="panel-title"><h2>Sổ tay <span className="count">{records.length}</span></h2><button className="text-button" onClick={() => engine.clearRecords()}>Xóa số đo</button></div>{!records.length ? <p className="empty-notebook">Ghi số đo hai phía điểm tương đương.</p> : <div className="table-scroll"><table><thead><tr><th>Phản ứng</th><th>V (mL)</th><th>pH</th></tr></thead><tbody>{records.map((row, i) => <tr key={i}><td>{row.reading.equation}</td><td>{row.parameters.baseVolume_ml.toFixed(2)}</td><td>{row.reading.pH.toFixed(3)}</td></tr>)}</tbody></table></div>}</section></div>
  </>;
}
