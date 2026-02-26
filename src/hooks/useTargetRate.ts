import { useState, useMemo, useCallback } from 'react';
import { solveTargetRate, generateSweepData } from '../utils/targetRate';
import { solveWaterFilling } from '../utils/waterfilling';
import type { TargetRateResult, WaterFillingResult, SweepPoint } from '../types';

const CHANNEL_COLORS = [
  '#22d3ee', '#f97316', '#22c55e', '#a855f7',
  '#ef4444', '#3b82f6', '#eab308', '#ec4899',
];

// Preset configurations for channel gains (a_i = g_i/n_i)
const PRESETS = {
  equal: (n: number) => new Array(n).fill(1),
  gradual: (n: number) =>
    Array.from({ length: n }, (_, i) => {
      const maxGain = 3;
      const minGain = 0.3;
      return maxGain - (i * (maxGain - minGain)) / Math.max(n - 1, 1);
    }),
  oneWeak: (n: number) => {
    const arr = new Array(n).fill(2);
    arr[n - 1] = 0.2;
    return arr;
  },
  random: (n: number) =>
    Array.from({ length: n }, () => Math.round((0.1 + Math.random() * 2.9) * 10) / 10),
};

export type PresetName = keyof typeof PRESETS;

export function useTargetRate() {
  const [numChannels, setNumChannels] = useState(4);
  const [totalPower, setTotalPower] = useState(10);
  const [targetRate, setTargetRate] = useState(2);
  const [logBase, setLogBase] = useState<'ln' | 'log2'>('log2');
  const [channelGains, setChannelGains] = useState<number[]>(() =>
    PRESETS.gradual(4),
  );

  const setNumChannelsWrapped = useCallback((n: number) => {
    setNumChannels(n);
    setChannelGains((prev) => {
      if (n > prev.length) {
        return [...prev, ...new Array(n - prev.length).fill(1)];
      }
      return prev.slice(0, n);
    });
  }, []);

  const setChannelGain = useCallback((index: number, value: number) => {
    setChannelGains((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const applyPreset = useCallback(
    (preset: PresetName) => {
      setChannelGains(PRESETS[preset](numChannels));
    },
    [numChannels],
  );

  const toggleLogBase = useCallback(() => {
    setLogBase(prev => prev === 'ln' ? 'log2' : 'ln');
  }, []);

  const targetResult: TargetRateResult = useMemo(
    () => solveTargetRate(channelGains, totalPower, targetRate, logBase),
    [channelGains, totalPower, targetRate, logBase],
  );

  const waterfillingResult: WaterFillingResult = useMemo(
    () => solveWaterFilling(channelGains, totalPower, logBase),
    [channelGains, totalPower, logBase],
  );

  const sweepData: SweepPoint[] = useMemo(
    () => generateSweepData(channelGains, targetRate, logBase, 20, 200),
    [channelGains, targetRate, logBase],
  );

  return {
    numChannels,
    setNumChannels: setNumChannelsWrapped,
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
    channelColors: CHANNEL_COLORS,
  };
}
