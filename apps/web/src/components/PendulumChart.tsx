import { useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { pendulumDisplayState, pendulumPeriod, type PendulumParameters } from '@lumilab/lab-engine';

export type PendulumChartTab = 'angle' | 'energy' | 'speed';

interface Props {
  parameters: PendulumParameters;
  side: number;
  currentTime?: number;
  dampingEnabled?: boolean;
  dampingCoeff?: number;
}

export function PendulumChart({ parameters, side, currentTime, dampingEnabled, dampingCoeff }: Props) {
  const [tab, setTab] = useState<PendulumChartTab>('angle');
  const windowDuration = 2 * pendulumPeriod(parameters);
  const windowStart = dampingEnabled ? Math.floor((currentTime ?? 0) / windowDuration) * windowDuration : 0;

  const { data, duration } = useMemo(() => {
    const dur = windowDuration;
    const b = dampingEnabled ? (dampingCoeff ?? 0.05) : 0;

    const points = Array.from({ length: 121 }, (_, index) => {
      const time = windowStart + (index * dur) / 120;
      const motion = pendulumDisplayState(parameters, time, side, b);
      const { angle_deg: angle, total_j: totalE, potential_j: potE, kinetic_j: kinE } = motion;
      const speed = motion.speed_m_s * motion.motionSign;

      return {
        time: Math.round(time * 1000) / 1000,
        angle: Math.round(angle * 100) / 100,
        kinE: Math.round(kinE * 10000) / 10000,
        potE: Math.round(potE * 10000) / 10000,
        totalE: Math.round(totalE * 10000) / 10000,
        speed: Math.round(speed * 1000) / 1000,
      };
    });

    return { data: points, duration: dur };
  }, [parameters, side, dampingEnabled, dampingCoeff, windowStart, windowDuration]);

  const currentMarker =
    currentTime !== undefined && duration > 0
      ? dampingEnabled ? currentTime : ((currentTime % duration) + duration) % duration
      : null;

  return (
    <div className="pendulum-chart-box">
      <div className="chart-tabs-bar" role="tablist" aria-label="Lựa chọn dạng đồ thị">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'angle'}
          className={`chart-tab ${tab === 'angle' ? 'active' : ''}`}
          onClick={() => setTab('angle')}
        >
          Li độ góc θ(t)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'energy'}
          className={`chart-tab ${tab === 'energy' ? 'active' : ''}`}
          onClick={() => setTab('energy')}
        >
          Năng lượng E(t)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'speed'}
          className={`chart-tab ${tab === 'speed' ? 'active' : ''}`}
          onClick={() => setTab('speed')}
        >
          Vận tốc v(t)
        </button>
      </div>

      <div
        className="chart-area"
        role="img"
        aria-label={`Đồ thị ${
          tab === 'angle' ? 'góc lệch' : tab === 'energy' ? 'năng lượng' : 'vận tốc'
        } theo thời gian`}
      >
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} margin={{ top: 15, right: 15, bottom: 15, left: 0 }} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#dce7e1" />
            <XAxis
              dataKey="time"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={value => `${Number(value).toFixed(1)}`}
              tick={{ fontSize: 11, fill: '#63796e' }}
              axisLine={false}
              tickLine={false}
              label={{
                value: 'Thời gian (s)',
                position: 'insideBottomRight',
                offset: -10,
                fontSize: 11,
              }}
            />

            {tab === 'angle' && (
              <>
                <YAxis
                  domain={[
                    -Math.max(15, parameters.angle_deg),
                    Math.max(15, parameters.angle_deg),
                  ]}
                  tick={{ fontSize: 11, fill: '#63796e' }}
                  tickFormatter={value => `${value}°`}
                  width={43}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine y={0} stroke="#b3c9bd" />
                {currentMarker !== null && (
                  <ReferenceLine x={currentMarker} stroke="#e11d48" strokeDasharray="3 3" />
                )}
                <Tooltip
                  formatter={value => [`${Number(value).toFixed(2)}°`, 'Góc lệch θ']}
                  labelFormatter={value => `t = ${Number(value).toFixed(2)} s`}
                  contentStyle={{ borderRadius: 10, border: '1px solid #d5e2da', fontSize: 12 }}
                />
                <Line
                  type="linear"
                  dataKey="angle"
                  name="Góc lệch"
                  stroke="#2a8263"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}

            {tab === 'energy' && (
              <>
                <YAxis
                  tick={{ fontSize: 11, fill: '#63796e' }}
                  tickFormatter={value => `${Number(value).toFixed(2)}J`}
                  width={48}
                  axisLine={false}
                  tickLine={false}
                />
                {currentMarker !== null && (
                  <ReferenceLine x={currentMarker} stroke="#e11d48" strokeDasharray="3 3" />
                )}
                <Tooltip
                  formatter={(value, name) => [
                    `${Number(value).toFixed(4)} J`,
                    name === 'kinE' ? 'Động năng Wđ' : name === 'potE' ? 'Thế năng Wt' : 'Cơ năng E',
                  ]}
                  labelFormatter={value => `t = ${Number(value).toFixed(2)} s`}
                  contentStyle={{ borderRadius: 10, border: '1px solid #d5e2da', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="kinE"
                  name="kinE"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="potE"
                  name="potE"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="totalE"
                  name="totalE"
                  stroke="#64748b"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}

            {tab === 'speed' && (
              <>
                <YAxis
                  tick={{ fontSize: 11, fill: '#63796e' }}
                  tickFormatter={value => `${Number(value).toFixed(1)}`}
                  width={44}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine y={0} stroke="#b3c9bd" />
                {currentMarker !== null && (
                  <ReferenceLine x={currentMarker} stroke="#e11d48" strokeDasharray="3 3" />
                )}
                <Tooltip
                  formatter={value => [`${Number(value).toFixed(3)} m/s`, 'Vận tốc v']}
                  labelFormatter={value => `t = ${Number(value).toFixed(2)} s`}
                  contentStyle={{ borderRadius: 10, border: '1px solid #d5e2da', fontSize: 12 }}
                />
                <Line
                  type="linear"
                  dataKey="speed"
                  name="Vận tốc"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  dot={false}
                  isAnimationActive={false}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="chart-legend-box">
        {tab === 'angle' && (
          <span className="chart-legend-item">
            <i style={{ background: '#2a8263' }} /> θ(t) Góc lệch
          </span>
        )}
        {tab === 'energy' && (
          <>
            <span className="chart-legend-item">
              <i style={{ background: '#10b981' }} /> Wđ Động năng
            </span>
            <span className="chart-legend-item">
              <i style={{ background: '#f59e0b' }} /> Wt Thế năng
            </span>
            <span className="chart-legend-item">
              <i style={{ background: '#64748b' }} /> E Cơ năng toàn phần
            </span>
          </>
        )}
        {tab === 'speed' && (
          <span className="chart-legend-item">
            <i style={{ background: '#0284c7' }} /> v(t) Vận tốc tức thời
          </span>
        )}
      </div>
    </div>
  );
}
