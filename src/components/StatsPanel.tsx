import type { TargetRateResult } from '../types';
import type { Theme } from '../hooks/useTheme';

interface Props {
  result: TargetRateResult;
  targetRate: number;
  totalPower: number;
  channelColors: string[];
  theme: Theme;
}

export function StatsPanel({ result, targetRate, totalPower, channelColors, theme }: Props) {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col gap-3">
      <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Statistics
      </h3>

      {/* Case indicator */}
      <div className={`px-2 py-1.5 rounded text-xs font-medium ${
        result.caseA
          ? (isDark ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700' : 'bg-emerald-100 text-emerald-700 border border-emerald-300')
          : (isDark ? 'bg-amber-900/50 text-amber-300 border border-amber-700' : 'bg-amber-100 text-amber-700 border border-amber-300')
      }`}>
        {result.caseA
          ? 'Case A: All channels hit target \u2014 leftover power'
          : 'Case B: Power-limited \u2014 all power used'}
      </div>

      {/* Summary stats */}
      <div className={`grid grid-cols-2 gap-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
        <div className={`p-2 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>&lambda;*</div>
          <div className={`font-bold font-mono ${isDark ? 'text-cyan-400' : 'text-teal-600'}`}>
            {result.lambda.toFixed(4)}
          </div>
        </div>
        <div className={`p-2 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Objective J</div>
          <div className={`font-bold font-mono ${isDark ? 'text-cyan-400' : 'text-teal-600'}`}>
            {result.objective < 0.0001 ? result.objective.toExponential(2) : result.objective.toFixed(4)}
          </div>
        </div>
        <div className={`p-2 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Power Used / Budget</div>
          <div className={`font-bold font-mono ${isDark ? 'text-cyan-400' : 'text-teal-600'}`}>
            {result.powerUsed.toFixed(2)} / {totalPower.toFixed(1)}
          </div>
        </div>
        <div className={`p-2 rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
          <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Active Channels</div>
          <div className={`font-bold font-mono ${isDark ? 'text-cyan-400' : 'text-teal-600'}`}>
            {result.activeCount} / {result.powers.length}
          </div>
        </div>
      </div>

      {/* Leftover power (Case A only) */}
      {result.caseA && result.leftover > 0.001 && (
        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Leftover power: <span className="font-mono font-bold">{result.leftover.toFixed(2)}</span>
        </div>
      )}

      {/* Per-channel rates */}
      <div>
        <div className={`text-xs font-semibold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Per-Channel Rates (target k = {targetRate.toFixed(1)})
        </div>
        <div className="flex flex-col gap-1">
          {result.rates.map((rate, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: channelColors[i % channelColors.length] }}
              />
              <span className={`w-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ch {i + 1}
              </span>
              <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div
                  className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${Math.min(100, targetRate > 0 ? (rate / targetRate) * 100 : 0)}%`,
                    backgroundColor: channelColors[i % channelColors.length],
                    opacity: rate > 0.001 ? 1 : 0.2,
                  }}
                />
              </div>
              <span className={`w-14 text-right font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {rate.toFixed(3)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
