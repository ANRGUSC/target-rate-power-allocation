import type { WaterFillingResult } from '../types';

const EPS = 1e-10;

/**
 * Solve classic waterfilling (maximize sum-rate) for comparison.
 * Uses a_i = g_i/n_i (channel gains), with log base B.
 *
 * P_i* = max(1/lambda* - 1/a_i, 0)
 * where 1/lambda* (water level) satisfies sum(P_i*) = Ptot.
 */
export function solveWaterFilling(
  channelGains: number[],
  totalPower: number,
  logBase: 'ln' | 'log2',
): WaterFillingResult {
  const n = channelGains.length;
  const C = logBase === 'ln' ? 1 : Math.LN2;

  // Floors = 1/a_i (inverse gain)
  const floors = channelGains.map(a => 1 / a);

  // Sort indices by floor ascending (best channels first)
  const sortedIndices = Array.from({ length: n }, (_, i) => i);
  sortedIndices.sort((a, b) => floors[a] - floors[b]);

  const sortedFloors = sortedIndices.map(i => floors[i]);

  if (totalPower <= EPS) {
    return {
      powers: new Array(n).fill(0),
      rates: new Array(n).fill(0),
      totalRate: 0,
      activeCount: 0,
    };
  }

  // Find number of active channels
  let numActive = n;
  let waterLevel = 0;

  while (numActive > 0) {
    const sumFloors = sortedFloors.slice(0, numActive).reduce((s, f) => s + f, 0);
    waterLevel = (totalPower + sumFloors) / numActive;

    if (waterLevel >= sortedFloors[numActive - 1] - EPS) {
      break;
    }
    numActive--;
  }

  // Compute allocations
  const powers = new Array(n).fill(0);
  const rates = new Array(n).fill(0);

  for (let k = 0; k < numActive; k++) {
    const origIdx = sortedIndices[k];
    const floor = floors[origIdx];
    const p = Math.max(waterLevel - floor, 0);
    powers[origIdx] = p;
    rates[origIdx] = Math.log(1 + channelGains[origIdx] * p) / C;
  }

  const totalRate = rates.reduce((s, r) => s + r, 0);

  return {
    powers,
    rates,
    totalRate,
    activeCount: numActive,
  };
}
