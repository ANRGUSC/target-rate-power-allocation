"""
Numerical solver for validation of the Lambert W closed form.

Uses scipy.optimize.minimize (SLSQP) since the problem is:
    min  sum_i (log2(1 + a_i P_i) - T_i)^2
    s.t. sum P_i <= P_tot,  P_i >= 0

This is a smooth, convex problem but not DCP-compliant in CVXPY
(sum of squares of concave functions). We use SLSQP which handles
it directly as a general nonlinear program.
"""

import numpy as np
from scipy.optimize import minimize


def solve(a: np.ndarray, k: np.ndarray, P_tot: float) -> dict:
    """
    Solve target-rate power allocation via scipy SLSQP.

    Parameters
    ----------
    a : array, shape (N,)
        Channel gain-to-noise ratios.
    k : array, shape (N,)
        Per-channel targets (bits/s/Hz).
    P_tot : float
        Total power budget.

    Returns
    -------
    dict with keys:
        'P' : optimal power allocation (N,)
        'objective' : optimal objective value
        'rates' : achieved rates
        'status' : solver status string
    """
    a = np.asarray(a, dtype=float)
    k = np.asarray(k, dtype=float)
    N = len(a)

    def obj_func(P):
        r = np.log2(1.0 + a * P)
        return np.sum((r - k) ** 2)

    def obj_grad(P):
        ap = a * P
        y = 1.0 + ap
        r = np.log2(y)
        dev = r - k
        # d/dP_i [(log2(1+a_i P_i) - T_i)^2]
        #   = 2*(log2(y_i) - T_i) * a_i / (y_i * ln2)
        return 2.0 * dev * a / (y * np.log(2.0))

    # Constraints: sum(P) <= P_tot
    constraints = [{'type': 'ineq', 'fun': lambda P: P_tot - np.sum(P)}]
    # Bounds: P_i >= 0
    bounds = [(0.0, None)] * N

    # Initial guess: uniform allocation
    P0 = np.full(N, P_tot / N)

    result = minimize(obj_func, P0, jac=obj_grad, method='SLSQP',
                      bounds=bounds, constraints=constraints,
                      options={'maxiter': 1000, 'ftol': 1e-14})

    P_val = np.maximum(result.x, 0.0)
    r_val = np.log2(1.0 + a * P_val)

    return {
        'P': P_val,
        'objective': float(result.fun),
        'rates': r_val,
        'status': 'optimal' if result.success else result.message,
    }
