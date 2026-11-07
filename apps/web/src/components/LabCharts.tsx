import { CartesianGrid, Line, LineChart, ReferenceDot, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { circuitCurve, circuitReading, titrationCurve, titrationReading, type CircuitParameters, type TitrationParameters } from '@lumilab/lab-engine';

const tick = { fontSize: 10, fill: '#728477' };
export function TitrationChart({ parameters }: { parameters: TitrationParameters }) {
  const reading = titrationReading(parameters);
  return <div className="chart-area" role="img" aria-label="Đường cong chuẩn độ pH theo thể tích bazơ"><ResponsiveContainer width="100%" height="100%" minWidth={0}><LineChart data={titrationCurve(parameters)} margin={{ top: 15, right: 15, left: -12, bottom: 18 }} accessibilityLayer>
    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e3e9e2"/><XAxis type="number" dataKey="volume" domain={[0, 50]} tick={tick} tickLine={false} axisLine={false} label={{ value: 'Bazơ đã thêm (mL)', position: 'insideBottomRight', offset: -12, fontSize: 10 }}/><YAxis domain={[0, 14]} ticks={[0, 7, 14]} tick={tick} tickLine={false} axisLine={false}/><ReferenceLine x={25} stroke="#a6b8aa" strokeDasharray="4 4"/><ReferenceLine y={7} stroke="#e4eae4"/><Tooltip labelFormatter={value => `${Number(value).toFixed(2)} mL`} formatter={value => [Number(value).toFixed(3), 'pH']} contentStyle={{ fontSize: 12, borderRadius: 10 }}/><Line dataKey="pH" type="linear" stroke="#9c6baf" strokeWidth={2.5} dot={false} isAnimationActive={false}/><ReferenceDot x={parameters.baseVolume_ml} y={reading.pH} r={5} fill="#c766a0" stroke="white" strokeWidth={2}/>
  </LineChart></ResponsiveContainer></div>;
}
export function CircuitChart({ parameters }: { parameters: CircuitParameters }) {
  const reading = circuitReading(parameters);
  return <div className="chart-area" role="img" aria-label="Đồ thị dòng điện theo điện áp nguồn"><ResponsiveContainer width="100%" height="100%" minWidth={0}><LineChart data={circuitCurve(parameters)} margin={{ top: 15, right: 15, left: -8, bottom: 18 }} accessibilityLayer>
    <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#e3e9e2"/><XAxis type="number" dataKey="voltage" domain={[0, 12]} tick={tick} axisLine={false} tickLine={false} label={{ value: 'U nguồn (V)', position: 'insideBottomRight', offset: -12, fontSize: 10 }}/><YAxis domain={[0, 'auto']} tickFormatter={value => Number(value).toFixed(2)} tick={tick} axisLine={false} tickLine={false} label={{ value: 'I (A)', position: 'insideTopLeft', fontSize: 10 }}/><Tooltip labelFormatter={value => `${Number(value).toFixed(1)} V`} formatter={value => [`${Number(value).toFixed(3)} A`, 'Dòng điện']} contentStyle={{ fontSize: 12, borderRadius: 10 }}/><Line dataKey="current" type="linear" stroke="#348575" strokeWidth={2.5} dot={false} isAnimationActive={false}/>{reading.current_A !== null && <ReferenceDot x={parameters.voltage_V} y={reading.current_A} r={5} fill="#d69b42" stroke="white" strokeWidth={2}/>}
  </LineChart></ResponsiveContainer></div>;
}
