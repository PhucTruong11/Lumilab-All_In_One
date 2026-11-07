import { useMemo, type ReactNode } from 'react';
import { dampedSpringReading, type LabId } from '@lumilab/lab-engine';
import { useLab } from '../labSession';
import { ExpandedFooter, ExpandedReadings, LabSlider } from './ExpandedLabParts';

type Items = { label: string; value: string; unit?: string; testId?: string }[];
const number = (value: number) => Number(value.toFixed(3)).toString();

function Workbench({ id, stage, controls, readings, actions, formula, columns, rows, onClear }:
  { id: LabId; stage: ReactNode; controls: ReactNode; readings: Items; actions: ReactNode;
    formula: string; columns: string[]; rows: (string | number)[][]; onClear: () => void }) {
  return <>
    <div className="workbench-grid interactive-lab">
      <section className="stage-panel">
        <div className="panel-title"><h2>Quan sát mô phỏng</h2></div>
        {stage}
        <div className="stage-actions">{actions}</div>
        <ExpandedReadings items={readings}/>
      </section>
      <aside className="control-panel"><div className="panel-title"><h2>Điều kiện</h2></div>{controls}</aside>
    </div>
    <ExpandedFooter id={id} formulas={<p>{formula}</p>} columns={columns} rows={rows} onClear={onClear}/>
  </>;
}

function MotionActions({ running, onToggle, onReset, onRecord }:
  { running: boolean; onToggle: () => void; onReset: () => void; onRecord: () => void }) {
  return <>
    <button className="primary-button" onClick={onToggle}>{running ? 'Tạm dừng' : 'Chạy mô phỏng'}</button>
    <button className="secondary-button" onClick={onReset}>Đặt lại</button>
    <button className="record-button" onClick={onRecord}>Ghi số đo</button>
  </>;
}

export function DampedSpringLab() {
  const { engine, state } = useLab('spring-damped');
  const { parameters: p, reading: r } = state;
  const running = state.phase === 'running';
  const samples = useMemo(() => Array.from({ length: 601 }, (_, i) => dampedSpringReading(p, i / 50)), [p]);
  const x = (t: number) => 48 + t * 43;
  const y = (value: number) => 142 - value * 100 / Math.max(0.1, samples[0].envelope_m);
  const curve = (key: 'displacement_m' | 'envelope_m', sign = 1) =>
    samples.map(sample => `${x(sample.time_s)},${y(sign * sample[key])}`).join(' ');
  return <Workbench id="spring-damped"
    stage={<svg className="interactive-stage" viewBox="0 0 610 285" role="img" aria-label="Đồ thị li độ lò xo tắt dần theo thời gian">
      <rect x="8" y="8" width="594" height="269" rx="18" fill="#edf5f4"/>
      <path d="M48 28v227h516M48 142h516" fill="none" stroke="#507674" strokeWidth="1.5"/>
      <text x="19" y="30" fill="#305954">x (m)</text><text x="555" y="272" fill="#305954">t (s)</text>
      {[0, 3, 6, 9, 12].map(t => <text key={t} x={x(t)} y="272" textAnchor="middle" fill="#305954">{t}</text>)}
      <polyline points={curve('envelope_m')} fill="none" stroke="#a06e31" strokeDasharray="5 4"/>
      <polyline points={curve('envelope_m', -1)} fill="none" stroke="#a06e31" strokeDasharray="5 4"/>
      <polyline points={curve('displacement_m')} fill="none" stroke="#18786b" strokeWidth="2"/>
      <circle cx={x(r.time_s)} cy={y(r.displacement_m)} r="6" fill="#183952"/>
    </svg>}
    controls={<>
      <LabSlider label="Khối lượng" value={p.mass_kg} unit="kg" min={.1} max={2} step={.1} onChange={mass_kg => engine.setParameters({ mass_kg })}/>
      <LabSlider label="Độ cứng" value={p.stiffness_N_m} unit="N/m" min={5} max={100} onChange={stiffness_N_m => engine.setParameters({ stiffness_N_m })}/>
      <LabSlider label="Li độ thả" value={p.displacement_m} unit="m" min={-.4} max={.4} step={.01} onChange={displacement_m => engine.setParameters({ displacement_m })}/>
      <LabSlider label="Tỉ số cản" value={p.damping_ratio} unit="" min={0} max={.9} step={.05} onChange={damping_ratio => engine.setParameters({ damping_ratio })}/>
      <p className="content-note">Đường nét đứt là đường bao. Đặt tỉ số cản bằng 0 để so với trường hợp lý tưởng.</p>
    </>}
    readings={[{ label: 'Thời gian', value: number(r.time_s), unit: 's' }, { label: 'Li độ', value: number(r.displacement_m), unit: 'm' },
      { label: 'Cơ năng', value: number(r.energy_J), unit: 'J' }, { label: 'Chu kỳ mô hình', value: r.period_s === null ? '—' : number(r.period_s), unit: 's' }]}
    actions={<MotionActions running={running} onToggle={() => running ? engine.pause() : engine.run()} onReset={() => engine.reset()} onRecord={() => engine.record()}/>}
    formula="ωd = √(k/m)√(1 − ζ²). Lực cản nhớt làm cơ năng giảm khi ζ > 0."
    columns={['t (s)', 'ζ', 'm (kg)', 'k (N/m)', 'x (m)', 'E (J)']}
    rows={state.records.map(row => [number(row.elapsed_s), row.parameters.damping_ratio, row.parameters.mass_kg,
      row.parameters.stiffness_N_m, number(row.reading.displacement_m), number(row.reading.energy_J)])}
    onClear={() => engine.clearRecords()}/>;
}

export function InclineLab() {
  const { engine, state } = useLab('inclined-plane');
  const { parameters: p, reading: r } = state;
  const running = state.phase === 'running';
  return <Workbench id="inclined-plane"
    stage={<svg className="interactive-stage" viewBox="0 0 610 285" role="img" aria-label="Vật trượt trên mặt phẳng nghiêng">
      <rect x="8" y="8" width="594" height="269" rx="18" fill="#edf5f4"/>
      <g transform={`translate(150 52) rotate(${p.angle_deg})`}>
        <path d="M-20 0h234" stroke="#507674" strokeWidth="6" strokeLinecap="round"/>
        <g transform={`translate(${r.position_m * 40} 0)`}><rect x="-12" y="-26" width="24" height="24" rx="4" fill="#1c796b"/></g>
      </g>
      <text x="400" y="130" fill="#305954" fontSize="18">{r.state}</text>
      <text x="400" y="157" fill="#305954">α = {p.angle_deg}°</text>
    </svg>}
    controls={<>
      <LabSlider label="Góc nghiêng" value={p.angle_deg} unit="°" min={0} max={60} onChange={angle_deg => engine.setParameters({ angle_deg })}/>
      <LabSlider label="Khối lượng" value={p.mass_kg} unit="kg" min={.5} max={5} step={.1} onChange={mass_kg => engine.setParameters({ mass_kg })}/>
      <LabSlider label="Hệ số ma sát nghỉ" value={p.static_friction} unit="" min={0} max={1} step={.01} onChange={static_friction => engine.setParameters({ static_friction })}/>
      <p className="content-note">Bài dùng μₖ = 0,8 μₛ. Vận tốc ở cuối dốc là giá trị ngay trước khi vật rời dốc.</p>
    </>}
    readings={[{ label: 'Trạng thái', value: r.state }, { label: 'Phản lực', value: number(r.normal_N), unit: 'N' },
      { label: 'Ma sát', value: number(r.friction_N), unit: 'N' }, { label: 'Gia tốc dọc dốc', value: number(r.acceleration_m_s2), unit: 'm/s²' },
      { label: 'Vận tốc', value: number(r.velocity_m_s), unit: 'm/s' }, { label: 'Quãng đường', value: number(r.position_m), unit: 'm' }]}
    actions={<MotionActions running={running} onToggle={() => running ? engine.pause() : engine.run()} onReset={() => engine.reset()} onRecord={() => engine.record()}/>}
    formula="N = mg cos α. Nếu tan α ≤ μₛ thì vật đứng yên. Khi trượt, a = g(sin α − μₖ cos α)."
    columns={['α (°)', 'm (kg)', 'μₛ', 't trên dốc (s)', 'a (m/s²)', 's (m)']}
    rows={state.records.map(row => [row.parameters.angle_deg, row.parameters.mass_kg, row.parameters.static_friction,
      number(row.reading.time_s), number(row.reading.acceleration_m_s2), number(row.reading.position_m)])}
    onClear={() => engine.clearRecords()}/>;
}

export function PulleyLab() {
  const { engine, state } = useLab('pulley');
  const { parameters: p, reading: r } = state;
  const blockY = 196 - p.lift_m * 33;
  const loadX = p.strands === 4 ? 252 : 240;
  const wheels = p.strands === 1 ? [[255, 65]] : p.strands === 2 ? [[240, blockY]] :
    [[252, 65], [312, 65], [222, blockY], [282, blockY]];
  const rope = p.strands === 1 ? `M240 ${blockY + 22}V65a15 15 0 0 1 30 0v78`
    : p.strands === 2 ? `M225 38V${blockY}a15 15 0 0 0 30 0V51`
    : `M207 38V${blockY}a15 15 0 0 0 30 0V65a15 15 0 0 1 30 0V${blockY}a15 15 0 0 0 30 0V65a15 15 0 0 1 30 0v78`;
  return <Workbench id="pulley"
    stage={<svg className="interactive-stage" viewBox="0 0 610 285" role="img" aria-label={`Sơ đồ ${p.strands} nhánh dây thẳng đứng đỡ cụm tải`}>
      <rect x="8" y="8" width="594" height="269" rx="18" fill="#edf5f4"/>
      <path d="M145 38h300" stroke="#507674" strokeWidth="6" strokeLinecap="round"/>
      {wheels.filter(([, y]) => y === 65).map(([x]) => <line key={x} x1={x} y1="38" x2={x} y2="65" stroke="#507674" strokeWidth="4"/>)}
      {p.strands === 4 && <path d={`M222 ${blockY}h60`} stroke="#507674" strokeWidth="5"/>}
      {p.strands !== 1 && <path d={`M${loadX} ${blockY}v24`} stroke="#507674" strokeWidth="4"/>}
      {wheels.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="13" fill="#d1e6e1" stroke="#507674" strokeWidth="2"/>)}
      <path d={rope} fill="none" stroke="#18786b" strokeWidth="3"/>
      <text x={p.strands === 4 ? 327 : p.strands === 2 ? 255 : 270} y={p.strands === 2 ? 48 : 160} textAnchor="middle" fill="#305954">{p.strands === 2 ? '↑' : '↓'}</text>
      <rect x={loadX - 29} y={blockY + 22} width="58" height="36" rx="6" fill="#8cc8af"/>
      <text x={loadX} y={blockY + 46} textAnchor="middle" fill="#183952">{p.mass_kg} kg</text>
      <text x="363" y="82" fill="#305954">{p.strands} nhánh đỡ tải</text>
      <text x="363" y="106" fill="#305954">Lực kéo {number(r.pull_N)} N</text>
      <text x="363" y="134" fill="#305954">Dây cần kéo {number(r.rope_m)} m</text>
    </svg>}
    controls={<>
      <label className="field">Số nhánh dây đỡ<select value={p.strands} onChange={e => engine.setParameters({ strands: Number(e.target.value) as 1 | 2 | 4 })}>
        <option value="1">1 · Ròng rọc cố định</option><option value="2">2 · Ròng rọc động</option><option value="4">4 · Pa-lăng</option>
      </select></label>
      <LabSlider label="Khối lượng cụm tải" value={p.mass_kg} unit="kg" min={1} max={20} step={.5} onChange={mass_kg => engine.setParameters({ mass_kg })}/>
      <LabSlider label="Độ cao nâng" value={p.lift_m} unit="m" min={0} max={2} step={.05} onChange={lift_m => engine.setParameters({ lift_m })}/>
      <p className="content-note">Sơ đồ tập trung vào các nhánh đỡ tải. So sánh lực và quãng đường kéo khi giữ nguyên tải.</p>
    </>}
    readings={[{ label: 'Trọng lượng', value: number(r.weight_N), unit: 'N' }, { label: 'Lực kéo', value: number(r.pull_N), unit: 'N', testId: 'pulley-force' },
      { label: 'Dây cần kéo', value: number(r.rope_m), unit: 'm' }, { label: 'Công', value: number(r.work_J), unit: 'J' }]}
    actions={<><button className="secondary-button" onClick={() => engine.reset()}>Đặt lại</button><button className="record-button" onClick={() => engine.record()}>Ghi số đo</button></>}
    formula="F = mg/n. Để nâng h, kéo dây s = nh. Công kéo bằng mgh trong mô hình lý tưởng."
    columns={['Nhánh', 'm (kg)', 'h (m)', 'F (N)', 'Dây (m)', 'Công (J)']}
    rows={state.records.map(row => [row.parameters.strands, row.parameters.mass_kg, row.parameters.lift_m,
      number(row.reading.pull_N), number(row.reading.rope_m), number(row.reading.work_J)])}
    onClear={() => engine.clearRecords()}/>;
}

type Observation = { product: string | null; appearance: string | null; equation: string | null; detail: string };
const colors: Record<string, string> = {
  'Vàng': '#f0b335', 'Tím nhạt': '#b094cf', 'Nâu đỏ': '#9f4b30', 'Có thể chuyển nâu đỏ': '#b07960',
  'Không màu': '#fff', 'Giấy màu nhạt rõ': '#e5cedc', 'Không thấy tẩy màu rõ': '#954a76',
  'Bọt khí': '#99ccdc', 'Minh họa oxi hóa': '#a7c875',
};
function ObservationWorkbench({ id, reading, observed, controls, rows, onObserve, onRecord, onReset, onClear }:
  { id: LabId; reading: Observation; observed: boolean; controls: ReactNode; rows: string[][];
    onObserve: () => void; onRecord: () => void; onReset: () => void; onClear: () => void }) {
  return <Workbench id={id}
    stage={<div className="panel-empty">
      <svg viewBox="0 0 420 140" className="interactive-stage" role="img" aria-label={reading.appearance ?? 'Chờ quan sát'}>
        <rect x="110" y="25" width="200" height="88" rx="18" fill={colors[reading.appearance ?? ''] ?? '#edf5f4'} stroke="#698380" strokeWidth="2"/>
        {reading.appearance === 'Bọt khí' && <g fill="none" stroke="#fff" strokeWidth="3"><circle cx="168" cy="56" r="11"/><circle cx="225" cy="79" r="15"/><circle cx="258" cy="48" r="8"/></g>}
      </svg>
      <p>{reading.detail}</p>
      {reading.equation && <p><strong>{reading.equation}</strong></p>}
    </div>}
    controls={<>{controls}<p className="content-note">Thí nghiệm ảo. Màu và hiện tượng chỉ minh họa định tính.</p></>}
    readings={[{ label: 'Quan sát', value: reading.appearance ?? '—', testId: 'chem-observation' }, { label: 'Chất liên quan', value: reading.product ?? '—' }]}
    actions={<>
      <button className="primary-button" disabled={observed} onClick={onObserve}>Quan sát</button>
      <button className="secondary-button" onClick={onReset}>Đặt lại</button>
      <button className="record-button" disabled={!observed} onClick={onRecord}>Ghi quan sát</button>
    </>}
    formula="Xem phương trình và giải thích cho từng điều kiện ở ô quan sát."
    columns={['Điều kiện', 'Hiện tượng', 'Chất liên quan']} rows={rows} onClear={onClear}/>;
}

export function AlkaliWaterLab() {
  const { engine, state } = useLab('alkali-water');
  const p = state.parameters;
  return <ObservationWorkbench id="alkali-water" reading={state.reading} observed={p.observed}
    onObserve={() => engine.setParameters({ observed: true })} onReset={() => engine.reset()}
    onRecord={() => engine.record()} onClear={() => engine.clearRecords()}
    controls={<>
      <label className="field">Kim loại hoặc ion tương ứng<select value={p.metal}
        onChange={e => engine.setParameters({ metal: e.target.value as typeof p.metal, observed: false })}>
        <option value="Na">Natri (Na)</option><option value="K">Kali (K)</option>
      </select></label>
      <label className="field">Quan sát<select value={p.mode}
        onChange={e => engine.setParameters({ mode: e.target.value as typeof p.mode, observed: false })}>
        <option value="water">Tác dụng với nước</option><option value="flame">Màu ngọn lửa của ion</option>
      </select></label>
    </>}
    rows={state.records.map(({ parameters, reading }) => [parameters.metal + (parameters.mode === 'water' ? ' và nước' : ' · màu của ion'), reading.appearance ?? '—', reading.product ?? '—'])}/>;
}

export function CopperNitricLab() {
  const { engine, state } = useLab('copper-nitric');
  const p = state.parameters;
  return <ObservationWorkbench id="copper-nitric" reading={state.reading} observed={p.observed}
    onObserve={() => engine.setParameters({ observed: true })} onReset={() => engine.reset()}
    onRecord={() => engine.record()} onClear={() => engine.clearRecords()}
    controls={<>
      <label className="field">Kịch bản axit<select value={p.acid}
        onChange={e => engine.setParameters({ acid: e.target.value as typeof p.acid, air: false, observed: false })}>
        <option value="dilute">Cu và HNO₃ loãng</option><option value="concentrated">Cu và HNO₃ đặc</option>
      </select></label>
      <label className="field"><span><input type="checkbox" checked={p.air} disabled={p.acid !== 'dilute'}
        onChange={e => engine.setParameters({ air: e.target.checked, observed: false })}/> Quan sát sau khi NO gặp không khí</span></label>
    </>}
    rows={state.records.map(({ parameters, reading }) => [(parameters.acid === 'dilute' ? 'Loãng' : 'Đặc') + (parameters.air ? ' · tiếp xúc không khí' : ''), reading.appearance ?? '—', reading.product ?? '—'])}/>;
}

export function ChlorineLab() {
  const { engine, state } = useLab('chlorine-bleach');
  const p = state.parameters;
  return <ObservationWorkbench id="chlorine-bleach" reading={state.reading} observed={p.observed}
    onObserve={() => engine.setParameters({ observed: true })} onReset={() => engine.reset()}
    onRecord={() => engine.record()} onClear={() => engine.clearRecords()}
    controls={<>
      <label className="field">Chế độ<select value={p.mode}
        onChange={e => engine.setParameters({ mode: e.target.value as typeof p.mode, observed: false })}>
        <option value="bleach">Tẩy màu giấy</option><option value="formation">Nguyên lí tạo clo</option>
      </select></label>
      <label className="field">Điều kiện giấy màu<select value={p.damp ? 'damp' : 'dry'} disabled={p.mode !== 'bleach'}
        onChange={e => engine.setParameters({ damp: e.target.value === 'damp', observed: false })}>
        <option value="dry">Giấy khô trong môi trường khô</option><option value="damp">Giấy ẩm</option>
      </select></label>
    </>}
    rows={state.records.map(({ parameters, reading }) => [parameters.mode === 'formation' ? 'Nguyên lí tạo clo' : parameters.damp ? 'Giấy ẩm' : 'Đối chứng khô', reading.appearance ?? '—', reading.product ?? '—'])}/>;
}
