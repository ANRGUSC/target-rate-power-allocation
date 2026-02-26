import { useTargetRate } from './hooks/useTargetRate';
import { useTheme } from './hooks/useTheme';
import { Controls } from './components/Controls';
import { StatsPanel } from './components/StatsPanel';
import { AllocationDiagram } from './components/AllocationDiagram';
import { EquationsPanel } from './components/EquationsPanel';
import { ComparisonPlot } from './components/ComparisonPlot';
import { ObjectiveSweepPlot } from './components/ObjectiveSweepPlot';

export function App() {
  const {
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
    targetResult,
    waterfillingResult,
    sweepData,
    channelColors,
  } = useTargetRate();

  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Header */}
      <header className={`px-6 py-4 border-b flex items-center justify-between ${
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}>
        <div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-cyan-400' : 'text-teal-600'}`}>
            Target-Rate Power Allocation
          </h1>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            EE 597 Wireless Networks &mdash; USC
          </p>
        </div>
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-lg transition-colors cursor-pointer ${
            isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-200 text-slate-600'
          }`}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          )}
        </button>
      </header>

      {/* Main content */}
      <main className="p-6">
        {/* Top row: Controls | Diagram + Equations */}
        <div className="grid grid-cols-[280px_1fr] gap-6 mb-6">
          {/* Left: Controls + Stats */}
          <div className={`rounded-lg p-4 border flex flex-col gap-6 ${
            isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
          }`}>
            <Controls
              numChannels={numChannels}
              setNumChannels={setNumChannels}
              totalPower={totalPower}
              setTotalPower={setTotalPower}
              targetRate={targetRate}
              setTargetRate={setTargetRate}
              logBase={logBase}
              toggleLogBase={toggleLogBase}
              channelGains={channelGains}
              setChannelGain={setChannelGain}
              applyPreset={applyPreset}
              channelColors={channelColors}
              theme={theme}
            />
            <div className={`border-t pt-4 ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <StatsPanel
                result={targetResult}
                targetRate={targetRate}
                totalPower={totalPower}
                channelColors={channelColors}
                theme={theme}
              />
            </div>
          </div>

          {/* Right: Diagram + Equations stacked */}
          <div className="flex flex-col gap-6">
            <div className={`rounded-lg border h-[400px] ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <AllocationDiagram
                channelGains={channelGains}
                result={targetResult}
                targetRate={targetRate}
                channelColors={channelColors}
                theme={theme}
              />
            </div>

            <div className={`rounded-lg p-4 border ${
              isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <EquationsPanel theme={theme} />
            </div>
          </div>
        </div>

        {/* Comparison: Target-Rate vs Waterfilling */}
        <div className={`rounded-lg p-4 border mb-6 ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Target-Rate vs Waterfilling Comparison
          </h2>
          <div className="h-[280px]">
            <ComparisonPlot
              targetResult={targetResult}
              waterfillingResult={waterfillingResult}
              targetRate={targetRate}
              channelColors={channelColors}
              theme={theme}
            />
          </div>
        </div>

        {/* Objective sweep + power allocation sweep */}
        <div className={`rounded-lg p-4 border ${
          isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <h2 className={`text-sm font-semibold uppercase tracking-wider mb-2 ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Objective &amp; Power Allocation vs Total Power
          </h2>
          <div className="h-[300px]">
            <ObjectiveSweepPlot
              data={sweepData}
              totalPower={totalPower}
              numChannels={numChannels}
              channelColors={channelColors}
              theme={theme}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`px-6 py-3 text-center text-xs border-t ${
        isDark ? 'text-slate-500 border-slate-800' : 'text-slate-400 border-slate-200'
      }`}>
        EE 597 Wireless Networks &mdash; Bhaskar Krishnamachari, USC &mdash; Developed with Claude Code
      </footer>
    </div>
  );
}
