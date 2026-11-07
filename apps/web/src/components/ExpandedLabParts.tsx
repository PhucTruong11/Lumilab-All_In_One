import { useEffect, useId, useState, type ReactNode } from 'react';
import { labDefinitions, type LabId } from '@lumilab/lab-engine';

export function LabSlider({ label, unit, value, min, max, step = 1, onChange, presets, integer = false }: { label: string; unit: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void; presets?: number[]; integer?: boolean }) {
  const id = useId();
  const [edit, setEdit] = useState<{ baseValue: number; text: string; invalid: boolean } | null>(null);
  useEffect(() => { setEdit(null); }, [value]);
  const currentEdit = edit?.baseValue === value ? edit : null;
  const error = currentEdit?.invalid ?? false;
  function commit() {
    if (!currentEdit) return;
    const number = Number(currentEdit.text);
    if (!currentEdit.text.trim() || !Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) { setEdit({ ...currentEdit, invalid: true }); return; }
    onChange(number);
    setEdit(null);
  }
  return <div className="parameter precision-parameter">
    <div className="parameter-heading"><label htmlFor={id}>{label}</label><div className="parameter-value">
      <input aria-label={`${label} chính xác`} aria-describedby={error ? `${id}-error` : undefined} aria-invalid={error || undefined}
        type="number" min={min} max={max} step={integer ? 1 : 'any'} value={currentEdit?.text ?? Number(value.toFixed(6))}
        onChange={e => setEdit({ baseValue: value, text: e.target.value, invalid: false })} onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') setEdit(null); }}/>
      <span>{unit}</span></div></div>
    <input id={id} aria-label={label} type="range" min={min} max={max} step={step} value={value}
      onChange={e => { setEdit(null); onChange(Number(e.target.value)); }}/>
    <div className="range-limits"><span>{min} {unit}</span><span>{max} {unit}</span></div>
    {error && <p id={`${id}-error`} className="parameter-error" role="alert">Nhập {integer ? 'số nguyên' : 'số'} từ {min} đến {max}. Thông số chưa thay đổi.</p>}
    {presets && <div className="preset-row">{presets.map(preset => <button key={preset} type="button" className="preset-pill"
      aria-pressed={Math.abs(value - preset) < 1e-6} onClick={() => { setEdit(null); onChange(preset); }}>{preset} {unit}</button>)}</div>}
  </div>;
}
export function ExpandedReadings({ items }: { items: { label: string; value: string; unit?: string; testId?: string }[] }) {
  return <div className="readings">{items.map(item => <div key={item.label}><span>{item.label}</span><strong data-testid={item.testId}>{item.value}<small>{item.unit}</small></strong></div>)}</div>;
}
export function ObserveOnStage({ observed, onObserve }: { observed: boolean; onObserve: () => void }) {
  return <g transform="translate(210 468)" role="button" tabIndex={0} className="svg-button stage-cta-pill" aria-label="Mở quan sát trên bàn"
    onClick={onObserve} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onObserve(); } }}>
    <rect width="340" height="46" rx="23" fill={observed ? '#eaf5ef' : '#1f7054'} stroke={observed ? '#5c9c7d' : '#15543e'} strokeWidth="2"/>
    <circle cx="28" cy="23" r="9" fill={observed ? '#1f7054' : '#ffffff33'} />
    <path d={observed ? 'M24 23l3 3 6-6' : 'M26 18l8 5-8 5z'} fill={observed ? 'none' : '#fff'} stroke={observed ? '#fff' : 'none'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <text x="182" y="29" textAnchor="middle" fill={observed ? '#1b382b' : '#fff'} fontSize="14.5" fontWeight="600">
      {observed ? 'Đã mở hiện tượng · Đổi điều kiện để thử tiếp' : 'Thực hiện thí nghiệm & Quan sát hiện tượng'}
    </text>
  </g>;
}
export function ExpandedFooter({ id, formulas, columns, rows, onClear }: { id: LabId; formulas: ReactNode; columns: string[]; rows: (string | number)[][]; onClear: () => void }) {
  const definition = labDefinitions[id];
  return <div className="below-lab"><details className="model-details"><summary>Công thức & giới hạn mô hình</summary><div className="expanded-formulas">{formulas}{definition.assumptions.map(text => <p key={text}>{text}</p>)}<p>Số liệu tính trên máy; nội dung đang chờ duyệt học thuật.</p><div className="science-links">{definition.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div></div></details><section className="notebook"><div className="panel-title"><h2>Sổ tay <span className="count">{rows.length}</span></h2>{rows.length > 0 && <button className="text-button" onClick={onClear}>Xóa số đo</button>}</div>{!rows.length ? <p className="empty-notebook">Bấm “Ghi số đo” trên bàn thực hành sau mỗi lần thay đổi để lập bảng đối chiếu.</p> : <div className="table-scroll"><table><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index} className={index === rows.length - 1 ? 'latest-record-row' : undefined}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>}</section></div>;
}
