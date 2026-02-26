"""
Target-rate least-squares power allocation via KKT + Lambert W.

Solves:  min  sum_i (log2(1 + a_i P_i) - T_i)^2
         s.t. sum_i P_i <= P_tot,  P_i >= 0

Closed-form per-channel allocation (active set):
    P_i(lam) = max(0, (2 / (lam * C^2)) * W(lam * C^2 * 2^{T_i} / (2 * a_i)) - 1/a_i)
where C = ln(2), W = Lambert W principal branch.
"""

import numpy as np
from scipy.special import lambertw


C = np.log(2.0)  # ln(2)
C2 = C ** 2      # (ln 2)^2


def cap_power(a: np.ndarray, k: np.ndarray) -> np.ndarray:
    """Per-channel power cap: P_bar_i = (2^{T_i} - 1) / a_i."""
    return (2.0 ** k - 1.0) / a


def pi_lambda(lam: float, a: np.ndarray, k: np.ndarray) -> np.ndarray:
    """
    Compute per-channel power P_i(lambda) for a given dual variable lambda.

    For lambda > 0, uses the Lambert W closed form.
    For lambda = 0, returns the cap powers (all targets met exactly).
    """
    N = len(a)
    p_bar = cap_power(a, k)

    if lam <= 0.0:
        return p_bar.copy()

    alpha = lam * C2 / (2.0 * a)          # alpha_i = lam * C^2 / (2 a_i)
    arg = alpha * (2.0 ** k)              # argument to Lambert W
    w_val = np.real(lambertw(arg, k=0))   # principal branch W_0

    # y_i = W(arg) / alpha_i, then P_i = (y_i - 1) / a_i
    # Equivalent: P_i = (2 / (lam * C^2)) * W(arg) - 1/a_i
    P = (2.0 / (lam * C2)) * w_val - 1.0 / a

    # Project: clamp to [0, P_bar_i]
    P = np.clip(P, 0.0, p_bar)
    return P


def sum_power(lam: float, a: np.ndarray, k: np.ndarray) -> float:
    """Total power S(lambda) = sum_i P_i(lambda)."""
    return float(np.sum(pi_lambda(lam, a, k)))


def objective(P: np.ndarray, a: np.ndarray, k: np.ndarray) -> float:
    """Evaluate J = sum_i (log2(1 + a_i P_i) - T_i)^2."""
    r = np.log2(1.0 + a * P)
    return float(np.sum((r - k) ** 2))


def solve(a: np.ndarray, k: np.ndarray, P_tot: float,
          tol: float = 1e-10, max_iter: int = 200) -> dict:
    """
    Solve the target-rate power allocation problem via bisection on lambda.

    Parameters
    ----------
    a : array, shape (N,)
        Channel gain-to-noise ratios.
    k : array, shape (N,)
        Per-channel targets (bits/s/Hz).
    P_tot : float
        Total power budget.
    tol : float
        Bisection tolerance on |S(lambda) - P_tot|.
    max_iter : int
        Maximum bisection iterations.

    Returns
    -------
    dict with keys:
        'P' : optimal power allocation (N,)
        'lambda_star' : optimal dual variable
        'objective' : objective value J*
        'rates' : achieved rates r_i*
        'iterations' : number of bisection iterations
        'power_used' : total power used
    """
    a = np.asarray(a, dtype=float)
    k = np.asarray(k, dtype=float)
    N = len(a)

    p_bar = cap_power(a, k)
    sum_caps = float(np.sum(p_bar))

    # Case A: all targets achievable
    if P_tot >= sum_caps:
        P_star = p_bar.copy()
        return {
            'P': P_star,
            'lambda_star': 0.0,
            'objective': 0.0,
            'rates': k.copy(),
            'iterations': 0,
            'power_used': sum_caps,
        }

    # Case B: bisection on lambda
    # Find upper bound: need S(lam_hi) <= P_tot
    lam_hi = 1.0
    while sum_power(lam_hi, a, k) > P_tot:
        lam_hi *= 2.0
    lam_lo = 0.0

    iterations = 0
    for iterations in range(1, max_iter + 1):
        lam_mid = (lam_lo + lam_hi) / 2.0
        s = sum_power(lam_mid, a, k)
        if abs(s - P_tot) < tol:
            break
        if s > P_tot:
            lam_lo = lam_mid
        else:
            lam_hi = lam_mid

    P_star = pi_lambda(lam_mid, a, k)
    rates = np.log2(1.0 + a * P_star)

    return {
        'P': P_star,
        'lambda_star': lam_mid,
        'objective': objective(P_star, a, k),
        'rates': rates,
        'iterations': iterations,
        'power_used': float(np.sum(P_star)),
    }
