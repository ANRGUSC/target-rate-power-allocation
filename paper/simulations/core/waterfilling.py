"""
Classic waterfilling power allocation for sum-rate maximization.

Solves:  max  sum_i log2(1 + a_i P_i)
         s.t. sum_i P_i <= P_tot,  P_i >= 0

Solution: P_i = (nu - 1/a_i)_+  where nu is the water level.
"""

import numpy as np


def solve(a: np.ndarray, P_tot: float,
          tol: float = 1e-10, max_iter: int = 200) -> dict:
    """
    Solve waterfilling via bisection on the water level nu.

    Parameters
    ----------
    a : array, shape (N,)
        Channel gain-to-noise ratios.
    P_tot : float
        Total power budget.

    Returns
    -------
    dict with keys:
        'P' : optimal power allocation (N,)
        'rates' : achieved rates r_i
        'water_level' : optimal water level nu
        'power_used' : total power used (always equals P_tot)
    """
    a = np.asarray(a, dtype=float)
    N = len(a)
    inv_a = 1.0 / a

    # Bisection on water level nu
    nu_lo = 0.0
    nu_hi = P_tot + np.max(inv_a)

    for _ in range(max_iter):
        nu = (nu_lo + nu_hi) / 2.0
        P = np.maximum(0.0, nu - inv_a)
        s = np.sum(P)
        if abs(s - P_tot) < tol:
            break
        if s < P_tot:
            nu_lo = nu
        else:
            nu_hi = nu

    P = np.maximum(0.0, nu - inv_a)
    rates = np.log2(1.0 + a * P)

    return {
        'P': P,
        'rates': rates,
        'water_level': nu,
        'power_used': float(np.sum(P)),
    }
