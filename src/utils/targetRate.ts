import { lambertW } from './lambertW';
import type { TargetRateResult, SweepPoint } from '../types';

const EPS = 1e-10;

/** Get ln(B) for the chosen log base */
function getC(logBase: 'ln' | 'log2'): number {
  return logBase === 'ln' ? 1 : Math.LN2;
}

/** Get B^k for the chosen log base */
function getBk(k: number, logBase: 'ln' | 'log2'): number {
  return logBase === 'ln' ? Math.exp(k) : Math.pow(2, k);
}

/**
 * Power cap per channel: P_i^cap = (B^k - 1) / a_i
 * This is the power needed so that r_i = k exactly.
 */
export function computeCap(ai: number, k: number, logBase: 'ln' | 'log2'): number {
  return (getBk(k, logBase) - 1) / ai;
}

/**
 * Compute optimal P_i for a given lambda (KKT multiplier).
 *
 * From KKT stationarity:
 *   P_i(lambda) = max(0, (2 / (lambda * C^2)) * W(lambda * C^2 * B^k / (2*a_i)) - 1/a_i)
 *
 * where C = ln(B), W is Lambert W principal branch.
 */
export function computePi(
  lambda: number,
  ai: number,
  k: number,
  logBase: 'ln' | 'log2',
): number {
  if (lambda <= 0) return computeCap(ai, k, logBase);

  const C = getC(logBase);
  const C2 = C * C;
  const Bk = getBk(k, logBase);
  const arg = lambda * C2 * Bk / (2 * ai);
  const w = lambertW(arg);
  const pi = (2 / (lambda * C2)) * w - 1 / ai;
  return Math.max(0, pi);
}

/**
 * Total power at a given lambda across all channels.
 */
function totalPowerAtLambda(
  lambda: number,
  channelGains: number[],
  k: number,
  logBase: 'ln' | 'log2',
): number {
  let total = 0;
  for (const ai of channelGains) {
    total += computePi(lambda, ai, k, logBase);
  }
  return total;
}

/**
 * Solve the target-rate power allocation problem:
 *   minimize sum_i (r_i - k)^2
 *   subject to: sum P_i <= P_tot, P_i >= 0
 *
 * Uses bisection on lambda (the KKT multiplier).
 */
export function solveTargetRate(
  channelGains: number[],
  totalPower: number,
  k: number,
  logBase: 'ln' | 'log2',
): TargetRateResult {
  const n = channelGains.length;
  const C = getC(logBase);
  const Bk = getBk(k, logBase);

  // Compute caps
  const caps = channelGains.map(ai => (Bk - 1) / ai);
  const sumCaps = caps.reduce((s, c) => s + c, 0);

  // Case A: enough power to hit target on all channels
  if (totalPower >= sumCaps - EPS) {
    const powers = caps.slice();
    const rates = new Array(n).fill(k);
    return {
      powers,
      rates,
      caps,
      lambda: 0,
      objective: 0,
      perChannelError: new Array(n).fill(0),
      powerUsed: sumCaps,
      leftover: totalPower - sumCaps,
      activeCount: n,
      caseA: true,
    };
  }

  // Case B: power-limited — bisection to find lambda*
  // At lambda=0, total power = sumCaps > Ptot
  // At lambda -> inf, total power -> 0
  // Find lambda such that totalPowerAtLambda(lambda) = Ptot

  let lo = 0;
  let hi = Math.max(...channelGains.map(ai => 2 * k * ai / C)) * 2; // safe upper bound

  // Ensure hi gives less power than Ptot
  while (totalPowerAtLambda(hi, channelGains, k, logBase) > totalPower) {
    hi *= 2;
  }

  // Bisection
  for (let iter = 0; iter < 200; iter++) {
    const mid = (lo + hi) / 2;
    const s = totalPowerAtLambda(mid, channelGains, k, logBase);
    if (Math.abs(s - totalPower) < EPS) {
      lo = mid;
      break;
    }
    if (s > totalPower) {
      lo = mid; // need more lambda to reduce power
    } else {
      hi = mid; // need less lambda to increase power
    }
  }

  const lambda = lo;
  const powers = channelGains.map(ai => computePi(lambda, ai, k, logBase));
  const rates = channelGains.map((ai, i) =>
    Math.log(1 + ai * powers[i]) / C
  );
  const perChannelError = rates.map(r => (r - k) * (r - k));
  const objective = perChannelError.reduce((s, e) => s + e, 0);
  const powerUsed = powers.reduce((s, p) => s + p, 0);
  const activeCount = powers.filter(p => p > EPS).length;

  return {
    powers,
    rates,
    caps,
    lambda,
    objective,
    perChannelError,
    powerUsed,
    leftover: totalPower - powerUsed,
    activeCount,
    caseA: false,
  };
}

/**
 * Generate sweep data: J vs Ptot for a range of total powers.
 */
export function generateSweepData(
  channelGains: number[],
  k: number,
  logBase: 'ln' | 'log2',
  ptotMax: number,
  numPoints: number = 200,
): SweepPoint[] {
  const n = channelGains.length;
  const Bk = getBk(k, logBase);
  const sumCaps = channelGains.reduce((s, ai) => s + (Bk - 1) / ai, 0);

  // Include exact threshold point
  const ptotValues = new Set<number>();
  for (let i = 0; i <= numPoints; i++) {
    ptotValues.add(Math.round((ptotMax * i) / numPoints * 1e8) / 1e8);
  }
  if (sumCaps <= ptotMax) {
    ptotValues.add(Math.round(sumCaps * 1e8) / 1e8);
  }

  const sorted = Array.from(ptotValues).sort((a, b) => a - b);
  const data: SweepPoint[] = [];

  for (const ptot of sorted) {
    const result = solveTargetRate(channelGains, ptot, k, logBase);
    const point: SweepPoint = {
      ptot,
      objective: result.objective,
      powerUsed: result.powerUsed,
    };
    for (let i = 0; i < n; i++) {
      point[`p${i}`] = result.powers[i];
      point[`r${i}`] = result.rates[i];
    }
    data.push(point);
  }

  return data;
}
