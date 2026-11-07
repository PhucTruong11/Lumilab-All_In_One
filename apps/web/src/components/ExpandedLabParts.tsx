import type { ReactNode } from 'react';
import { labDefinitions, type LabId } from '@lumilab/lab-engine';

export function LabSlider({ label, unit, value, min, max, step = 1, onChange }: { label: string; unit: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return <label className="parameter"><span>{label}<output>{Number(value.toFixed(3))} {unit}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/><span className="range-limits"><span>{min} {unit}</span><span>{max} {unit}</span></span></label>;
}
export function ExpandedReadings({ items }: { items: { label: string; value: string; unit?: string; testId?: string }[] }) {
  return <div className="readings">{items.map(item => <div key={item.label}><span>{item.label}</span><strong data-testid={item.testId}>{item.value}<small>{item.unit}</small></strong></div>)}</div>;
}
export function ExpandedFooter({ id, formulas, columns, rows, onClear }: { id: LabId; formulas: ReactNode; columns: string[]; rows: (string | number)[][]; onClear: () => void }) {
  const definition = labDefinitions[id];
  return <div className="below-lab"><details className="model-details"><summary>Công thức & giới hạn mô hình</summary><div className="expanded-formulas">{formulas}{definition.assumptions.map(text => <p key={text}>{text}</p>)}<p>Số liệu tính trên máy; nội dung đang chờ duyệt học thuật.</p><div className="science-links">{definition.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label}</a>)}</div></div></details><section className="notebook"><div className="panel-title"><h2>Sổ tay <span className="count">{rows.length}</span></h2><button className="text-button" onClick={onClear}>Xóa số đo</button></div>{!rows.length ? <p className="empty-notebook">Ghi hai lượt để so sánh điều bạn vừa thay đổi.</p> : <div className="table-scroll"><table><thead><tr>{columns.map(column => <th key={column}>{column}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>}</section></div>;
}
