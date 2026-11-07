import { useMemo } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { pendulumAngleAtTime, pendulumPeriod, type PendulumParameters } from '@lumilab/lab-engine';

export function PendulumChart({ parameters, side }: { parameters: PendulumParameters; side: number }) {
  const data = useMemo(() => {
    const duration = 2 * pendulumPeriod(parameters);
    return Array.from({ length: 121 }, (_, index) => {
      const time = index * duration / 120;
      return { time, angle: side * pendulumAngleAtTime(parameters, time) };
    });
  }, [parameters, side]);
  return <div className="chart-area" role="img" aria-label={`Đồ thị góc lệch theo thời gian trong hai chu kỳ, biên độ ${parameters.angle_deg} độ`}>
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <LineChart data={data} margin={{ top: 20, right: 15, bottom: 15, left: 0 }} accessibilityLayer>
        <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#dce7e1"/>
        <XAxis dataKey="time" type="number" domain={['dataMin', 'dataMax']} tickFormatter={value => `${Number(value).toFixed(1)}`} tick={{ fontSize: 11, fill: '#63796e' }} axisLine={false} tickLine={false} label={{ value: 'Thời gian (s)', position: 'insideBottomRight', offset: -10, fontSize: 11 }}/>
        <YAxis domain={[-Math.max(15, parameters.angle_deg), Math.max(15, parameters.angle_deg)]} tick={{ fontSize: 11, fill: '#63796e' }} tickFormatter={value => `${value}°`} width={43} axisLine={false} tickLine={false}/>
        <ReferenceLine y={0} stroke="#b3c9bd"/>
        <Tooltip formatter={value => [`${Number(value).toFixed(2)}°`, 'Góc lệch']} labelFormatter={value => `t = ${Number(value).toFixed(2)} s`} contentStyle={{ borderRadius: 12, border: '1px solid #d5e2da', fontSize: 13 }}/>
        <Line type="linear" dataKey="angle" stroke="#2a8263" strokeWidth={2.5} dot={false} isAnimationActive={false}/>
      </LineChart>
    </ResponsiveContainer>
  </div>;
}
