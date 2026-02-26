export interface TargetRateResult {
  powers: number[];           // P_i* per channel
  rates: number[];            // r_i per channel
  caps: number[];             // P_i_cap per channel
  lambda: number;             // KKT multiplier lambda*
  objective: number;          // J = sum (r_i - k)^2
  perChannelError: number[];  // (r_i - k)^2 per channel
  powerUsed: number;          // sum P_i*
  leftover: number;           // Ptot - powerUsed
  activeCount: number;
  caseA: boolean;             // true if Ptot >= sum(caps)
}

export interface WaterFillingResult {
  powers: number[];
  rates: number[];
  totalRate: number;
  activeCount: number;
}

export interface SweepPoint {
  ptot: number;
  objective: number;
  powerUsed: number;
  [key: string]: number;
}
