import type { PresetName } from '../hooks/useTargetRate';
import type { Theme } from '../hooks/useTheme';

interface Props {
  numChannels: number;
  setNumChannels: (n: number) => void;
  totalPower: number;
  setTotalPower: (p: number) => void;
  targetRate: number;
  setTargetRate: (k: number) => void;
  logBase: 'ln' | 'log2';
  toggleLogBase: () => void;
  channelGains: number[];
  setChannelGain: (index: number, value: number) => void;
  applyPreset: (preset: PresetName) => void;
  channelColors: string[];
  theme: Theme;
}

const PRESET_LABELS: { key: PresetName; label: string }[] = [
  { key: 'equal', label: 'Equal' },
  { key: 'gradual', label: 'Gradual' },
  { key: 'oneWeak', label: 'One Weak' },
  { key: 'random', label: 'Random' },
];

export function Controls({
  numChannels,
  setNumChannels,
  totalPower,
  setTotalPower,
  targetRate,
  setTargetRate,
  logBase,
  toggleLogBase,
  channelGains,
  setChannelGain,
  applyPreset,
  channelColors,
  theme,
}: Props) {
  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col gap-4">
      {/* Number of channels */}
      <div>
        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Channels (N): <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-teal-600'}`}>{numChannels}</span>
        </label>
        <input
          type="range"
          min={2}
          max={8}
          step={1}
          value={numChannels}
          onChange={(e) => setNumChannels(Number(e.target.value))}
          className="w-full"
        />
        <div className={`flex justify-between text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>2</span><span>8</span>
        </div>
      </div>

      {/* Total power */}
      <div>
        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Total Power (P<sub>tot</sub>): <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-teal-600'}`}>{totalPower.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={0}
          max={20}
          step={0.1}
          value={totalPower}
          onChange={(e) => setTotalPower(Number(e.target.value))}
          className="w-full"
        />
        <div className={`flex justify-between text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>0</span><span>20</span>
        </div>
      </div>

      {/* Target rate k */}
      <div>
        <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Target Rate (k): <span className={`font-bold ${isDark ? 'text-cyan-400' : 'text-teal-600'}`}>{targetRate.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={0.1}
          max={5}
          step={0.1}
          value={targetRate}
          onChange={(e) => setTargetRate(Number(e.target.value))}
          className="w-full"
        />
        <div className={`flex justify-between text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          <span>0.1</span><span>5</span>
        </div>
      </div>

      {/* Log base toggle */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Log Base
        </label>
        <button
          onClick={toggleLogBase}
          className={`w-full px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${
            isDark
              ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          }`}
        >
          {logBase === 'log2' ? 'log\u2082 (bits)' : 'ln (nats)'}
        </button>
      </div>

      {/* Presets */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Presets
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_LABELS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors cursor-pointer ${
                isDark
                  ? 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Per-channel a_i sliders */}
      <div>
        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          Channel Gains a<sub>i</sub> = g<sub>i</sub>/n<sub>i</sub>
        </label>
        <div className="flex flex-col gap-2">
          {channelGains.map((val, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: channelColors[i % channelColors.length] }}
              />
              <span className={`text-xs w-8 shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Ch {i + 1}
              </span>
              <input
                type="range"
                min={0.1}
                max={5}
                step={0.1}
                value={val}
                onChange={(e) => setChannelGain(i, Number(e.target.value))}
                className="flex-1"
              />
              <span className={`text-xs w-8 text-right font-mono ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {val.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
