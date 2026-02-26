"""
Proportional fairness power allocation.

Maximizes sum_i log(log2(1 + a_i P_i)) subject to sum P_i <= P_tot, P_i >= 0.

This is equivalent to maximizing the product of rates (Nash bargaining),
a standard proportional fairness criterion.
"""

import numpy as np
from scipy.optimize import minimize


def solve(a: np.ndarray, P_tot: float, k: np.ndarray = None) -> dict:
    """
    Proportional fairness allocation via scipy SLSQP.

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
        'P' : optimal power allocation (N,)
        'rates' : achieved rates r_i
        'power_used' : total power used (always P_tot for PF)
    """
    a = np.asarray(a, dtype=float)
    N = len(a)

    ln2 = np.log(2.0)

    def neg_obj(P):
        """Negative of sum log(log2(1 + a_i P_i))."""
        rates = np.log2(np.maximum(1.0 + a * P, 1.0 + 1e-15))
        # Avoid log(0) for channels with zero rate
        rates_safe = np.maximum(rates, 1e-15)
        return -np.sum(np.log(rates_safe))

    def neg_grad(P):
        """Gradient of negative objective."""
        y = 1.0 + a * P
        r = np.log2(np.maximum(y, 1.0 + 1e-15))
        r_safe = np.maximum(r, 1e-15)
        # d/dP_i [-log(log2(1+a_i P_i))]
        #   = -1/(log2(y_i)) * a_i / (y_i * ln2)
        #   = -a_i / (y_i * ln2 * log2(y_i))
        #   = -a_i / (y_i * ln(y_i))  [since ln2 * log2(y) = ln(y)]
        ln_y = np.log(np.maximum(y, 1.0 + 1e-15))
        ln_y_safe = np.maximum(ln_y, 1e-15)
        return -a / (y * ln_y_safe)

    # Constraints: sum(P) <= P_tot
    constraints = [{'type': 'ineq', 'fun': lambda P: P_tot - np.sum(P)}]
    # Bounds: P_i >= small positive (avoid log(0))
    bounds = [(1e-10, None)] * N

    # Initial guess: uniform
    P0 = np.full(N, P_tot / N)

    result = minimize(neg_obj, P0, jac=neg_grad, method='SLSQP',
                      bounds=bounds, constraints=constraints,
                      options={'maxiter': 1000, 'ftol': 1e-14})

    P_val = np.maximum(result.x, 0.0)
    rates = np.log2(1.0 + a * P_val)

    return {
        'P': P_val,
        'rates': rates,
        'power_used': float(np.sum(P_val)),
    }
