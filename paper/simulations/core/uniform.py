"""
Uniform power allocation baseline.

Allocates equal power to all channels: P_i = P_tot / N.
"""

import numpy as np


def solve(a: np.ndarray, P_tot: float, k: np.ndarray = None) -> dict:
    """
    Uniform power allocation: P_i = P_tot / N for all i.

    Parameters
    ----------
    a : array, shape (N,)
        Channel gain-to-noise ratios.
    P_tot : float
        Total power budget.
    k : array, shape (N,), optional
        Per-channel targets (unused, accepted for interface consistency).

    Returns
    -------
    dict with keys:
        'P' : power allocation (N,)
        'rates' : achieved rates r_i
        'power_used' : total power used (always P_tot)
    """
    a = np.asarray(a, dtype=float)
    N = len(a)

    P = np.full(N, P_tot / N)
    rates = np.log2(1.0 + a * P)

    return {
        'P': P,
        'rates': rates,
        'power_used': float(np.sum(P)),
    }
