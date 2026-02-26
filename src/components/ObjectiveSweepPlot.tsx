import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { SweepPoint } from '../types';
import type { Theme } from '../hooks/useTheme';

interface Props {
  data: SweepPoint[];
  totalPower: number;
  numChannels: number;
  channelColors: string[];
  theme: Theme;
}

export function ObjectiveSweepPlot({ data, totalPower, numChannels, channelColors, theme }: Props) {
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#475569' : '#cbd5e1';

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Objective J vs Ptot */}
      <div>
        <div className={`text-xs font-semibold mb-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Objective J = &Sigma;(r<sub>i</sub> &minus; k)<sup>2</sup> vs P<sub>tot</sub>
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="ptot"
              type="number"
              domain={[0, 20]}
              tick={{ fill: axisColor, fontSize: 11 }}
              label={{
                value: 'Total Power (Ptot)',
                position: 'insideBottom',
                offset: -5,
                fill: axisColor,
                fontSize: 12,
              }}
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 11 }}
              label={{
                value: 'Objective J',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: axisColor,
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelFormatter={(val) => `Ptot = ${Number(val).toFixed(2)}`}
              formatter={(val: number | undefined) => [(val ?? 0).toFixed(4), 'J']}
            />
            <ReferenceLine
              x={totalPower}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={2}
              label={{
                value: `Ptot=${totalPower.toFixed(1)}`,
                position: 'top',
                fill: '#ef4444',
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey="objective"
              stroke="#22d3ee"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Per-channel power allocation vs Ptot */}
      <div>
        <div className={`text-xs font-semibold mb-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Per-Channel Power P<sub>i</sub> vs P<sub>tot</sub>
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis
              dataKey="ptot"
              type="number"
              domain={[0, 20]}
              tick={{ fill: axisColor, fontSize: 11 }}
              label={{
                value: 'Total Power (Ptot)',
                position: 'insideBottom',
                offset: -5,
                fill: axisColor,
                fontSize: 12,
              }}
            />
            <YAxis
              tick={{ fill: axisColor, fontSize: 11 }}
              label={{
                value: 'Allocated Pi*',
                angle: -90,
                position: 'insideLeft',
                offset: 10,
                fill: axisColor,
                fontSize: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '6px',
                fontSize: '12px',
              }}
              labelFormatter={(val) => `Ptot = ${Number(val).toFixed(2)}`}
              formatter={(val: number | undefined, name: string | undefined) => {
                const chIdx = parseInt((name ?? '').replace('p', ''));
                return [(val ?? 0).toFixed(3), `Ch ${chIdx + 1}`];
              }}
            />
            <Legend
              formatter={(value: string) => {
                const chIdx = parseInt(value.replace('p', ''));
                return `Ch ${chIdx + 1}`;
              }}
              wrapperStyle={{ fontSize: '11px' }}
            />
            <ReferenceLine
              x={totalPower}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={2}
            />
            {Array.from({ length: numChannels }, (_, i) => (
              <Line
                key={i}
                type="linear"
                dataKey={`p${i}`}
                stroke={channelColors[i % channelColors.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
