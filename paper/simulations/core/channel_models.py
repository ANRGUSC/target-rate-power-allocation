"""
Channel gain models for simulation experiments.

Provides Rayleigh fading, log-normal shadowing, and deterministic test channels.
All models return gain-to-noise ratios a_i = |h_i|^2 / sigma^2.
"""

import numpy as np


def rayleigh_gains(N: int, mean_snr: float = 10.0,
                   rng: np.random.Generator = None) -> np.ndarray:
    """
    Generate Rayleigh fading channel gains.

    Each a_i ~ Exponential(mean_snr), modeling |h_i|^2 / sigma^2
    where h_i ~ CN(0, 1) and SNR scaling is via mean_snr.
    """
    if rng is None:
        rng = np.random.default_rng()
    return rng.exponential(scale=mean_snr, size=N)


def lognormal_gains(N: int, mu_db: float = 10.0, sigma_db: float = 8.0,
                    rng: np.random.Generator = None) -> np.ndarray:
    """
    Generate log-normal shadowing channel gains.

    a_i (dB) ~ N(mu_db, sigma_db^2), converted to linear scale.
    """
    if rng is None:
        rng = np.random.default_rng()
    a_db = rng.normal(loc=mu_db, scale=sigma_db, size=N)
    return 10.0 ** (a_db / 10.0)


def deterministic_gains(N: int = 8) -> np.ndarray:
    """
    Fixed channel gains for reproducible examples.

    Returns a hand-picked set with a mix of good and poor channels.
    """
    base = np.array([20.0, 15.0, 10.0, 7.0, 5.0, 3.0, 2.0, 1.0])
    if N <= len(base):
        return base[:N]
    # Tile and scale for larger N
    reps = int(np.ceil(N / len(base)))
    gains = np.tile(base, reps)[:N]
    # Add slight variation to avoid exact duplicates
    gains *= np.linspace(1.0, 0.5, N)
    return gains
