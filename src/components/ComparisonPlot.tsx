import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { TargetRateResult, WaterFillingResult } from '../types';
import type { Theme } from '../hooks/useTheme';

interface Props {
  targetResult: TargetRateResult;
  waterfillingResult: WaterFillingResult;
  targetRate: number;
  channelColors: string[];
  theme: Theme;
}

interface ComparisonDatum {
  name: string;
  targetPower: number;
  wfPower: number;
  targetRateVal: number;
  wfRate: number;
  color: string;
}

export function ComparisonPlot({ targetResult, waterfillingResult, targetRate, channelColors, theme }: Props) {
  const isDark = theme === 'dark';
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#1e293b' : '#ffffff';
  const tooltipBorder = isDark ? '#475569' : '#cbd5e1';

  const n = targetResult.powers.length;
  const data: ComparisonDatum[] = Array.from({ length: n }, (_, i) => ({
    name: `Ch ${i + 1}`,
    targetPower: targetResult.powers[i],
    wfPower: waterfillingResult.powers[i],
    targetRateVal: targetResult.rates[i],
    wfRate: waterfillingResult.rates[i],
    color: channelColors[i % channelColors.length],
  }));

  return (
    <div className="grid grid-cols-2 gap-4 h-full">
      {/* Power comparison */}
      <div>
        <div className={`text-xs font-semibold mb-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Power Allocation (P<sub>i</sub>)
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(val: number | undefined) => (val ?? 0).toFixed(3)}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="targetPower" name="Target-Rate" fill="#22d3ee" />
            <Bar dataKey="wfPower" name="Waterfilling" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Rate comparison */}
      <div>
        <div className={`text-xs font-semibold mb-1 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Achieved Rates (r<sub>i</sub>)
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} />
            <YAxis tick={{ fill: axisColor, fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '6px',
                fontSize: '12px',
              }}
              formatter={(val: number | undefined) => (val ?? 0).toFixed(3)}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <ReferenceLine
              y={targetRate}
              stroke="#ef4444"
              strokeDasharray="6 3"
              strokeWidth={1.5}
              label={{
                value: `k=${targetRate.toFixed(1)}`,
                position: 'right',
                fill: '#ef4444',
                fontSize: 10,
              }}
            />
            <Bar dataKey="targetRateVal" name="Target-Rate" fill="#22d3ee" />
            <Bar dataKey="wfRate" name="Waterfilling" fill="#f97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
