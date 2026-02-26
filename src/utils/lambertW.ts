/**
 * Lambert W principal branch (W_0) using Halley's method.
 * Solves w * e^w = x for w >= 0 given x >= 0.
 */
export function lambertW(x: number): number {
  if (x < 0) return NaN;
  if (x === 0) return 0;
  if (x < 1e-10) return x; // For very small x, W(x) ≈ x

  // Initial guess
  let w: number;
  if (x <= 1) {
    w = x / (1 + x); // Good for small x
  } else if (x < 100) {
    w = Math.log(1 + x);
  } else {
    const lnx = Math.log(x);
    const lnlnx = Math.log(lnx);
    w = lnx - lnlnx + lnlnx / lnx;
  }

  // Halley's iteration
  for (let i = 0; i < 50; i++) {
    const ew = Math.exp(w);
    const wew = w * ew;
    const f = wew - x;

    if (Math.abs(f) < 1e-14 * (1 + Math.abs(x))) break;

    const fp = ew * (w + 1); // f' = e^w(w+1)
    // Halley step: w -= f/f' * 1/(1 - f*f''/(2*f'^2))
    // f'' = e^w(w+2)
    const fpp = ew * (w + 2);
    const denom = fp - f * fpp / (2 * fp);
    if (Math.abs(denom) < 1e-30) break;
    w -= f / denom;

    if (w < 0) w = 0;
  }

  return w;
}
