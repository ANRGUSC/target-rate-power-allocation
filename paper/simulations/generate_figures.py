#!/usr/bin/env python3
"""
Master script: generate all figures and tables for the paper.

Usage:
    cd paper/simulations
    pip install -r requirements.txt
    python generate_figures.py
"""

import os
import sys
import time
import numpy as np
from scipy.special import lambertw

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from core.target_rate import solve as tr_solve, objective as tr_objective, \
    cap_power, pi_lambda, sum_power, C2
from core.waterfilling import solve as wf_solve
from core.uniform import solve as uni_solve
from core.propfair import solve as pf_solve
from core.channel_models import deterministic_gains, rayleigh_gains
from plotting import ieee_style, new_figure, save_figure, COLORS, SINGLE_COL, DOUBLE_COL

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs')


def fig1_validation():
    """Fig 1: Lambert-W vs CVXPY objective over P_tot sweep."""
    print("Figure 1: Validation (Lambert-W vs CVXPY)...")
    from cvxpy_solver import solve as cvx_solve

    np.random.seed(42)
    N = 8
    a = deterministic_gains(N)
    k = np.full(N, 3.0)

    P_tots = np.linspace(0.5, 25.0, 30)
    J_lambert = []
    J_cvxpy = []

    for Pt in P_tots:
        res_lw = tr_solve(a, k, Pt)
        res_cx = cvx_solve(a, k, Pt)
        J_lambert.append(res_lw['objective'])
        J_cvxpy.append(res_cx['objective'])

    fig, ax = new_figure(SINGLE_COL, aspect=0.8)
    ax.plot(P_tots, J_lambert, '-', color=COLORS['target_rate'],
            linewidth=1.2, label='Lambert-W (closed form)')
    ax.plot(P_tots, J_cvxpy, 'o', color=COLORS['cvxpy'],
            markersize=4, markerfacecolor='none', markeredgewidth=0.8,
            label='SLSQP (numerical)')
    ax.set_xlabel(r'Total power budget $P_{\mathrm{tot}}$')
    ax.set_ylabel(r'Objective $J^*$')
    ax.legend(loc='upper right')
    ax.set_ylim(bottom=-0.5)
    save_figure(fig, 'fig1_validation', OUTPUT_DIR)


def fig2_allocation_bars():
    """Fig 2: Allocation bars — target-rate vs waterfilling (N=8)."""
    print("Figure 2: Allocation comparison bars...")
    N = 8
    a = deterministic_gains(N)
    k = np.full(N, 3.0)
    P_tot = 10.0

    res_tr = tr_solve(a, k, P_tot)
    res_wf = wf_solve(a, P_tot)

    x = np.arange(N)
    width = 0.35

    fig, ax = new_figure(SINGLE_COL, aspect=0.75)
    bars1 = ax.bar(x - width / 2, res_tr['P'], width,
                   color=COLORS['target_rate'], label='Target-rate', alpha=0.85)
    bars2 = ax.bar(x + width / 2, res_wf['P'], width,
                   color=COLORS['waterfilling'], label='Waterfilling', alpha=0.85)

    # Show caps as horizontal markers
    p_bar = cap_power(a, k)
    for i in range(N):
        ax.plot([i - width, i + width], [p_bar[i], p_bar[i]], '--',
                color=COLORS['cap'], linewidth=0.7, alpha=0.7)
    ax.plot([], [], '--', color=COLORS['cap'], linewidth=0.7, label=r'Cap $\bar{P}_i$')

    ax.set_xlabel('Channel index $i$')
    ax.set_ylabel(r'Power $P_i$')
    ax.set_xticks(x)
    ax.set_xticklabels([str(i + 1) for i in x])
    ax.legend(loc='upper right', fontsize=6)
    save_figure(fig, 'fig2_allocation_bars', OUTPUT_DIR)


def fig3_achieved_rates():
    """Fig 3: Achieved rates r_i vs target T_i showing no-overshoot."""
    print("Figure 3: Achieved rates (no-overshoot)...")
    N = 8
    a = deterministic_gains(N)
    k = np.full(N, 3.0)
    P_tot = 10.0

    res_tr = tr_solve(a, k, P_tot)
    res_wf = wf_solve(a, P_tot)

    x = np.arange(N)
    width = 0.35

    fig, ax = new_figure(SINGLE_COL, aspect=0.75)
    ax.bar(x - width / 2, res_tr['rates'], width,
           color=COLORS['target_rate'], label='Target-rate', alpha=0.85)
    ax.bar(x + width / 2, res_wf['rates'], width,
           color=COLORS['waterfilling'], label='Waterfilling', alpha=0.85)
    ax.axhline(y=k[0], color=COLORS['target_line'], linestyle='--',
               linewidth=1.0, label=r'Target $T$')

    ax.set_xlabel('Channel index $i$')
    ax.set_ylabel(r'Rate $r_i$ (bits/s/Hz)')
    ax.set_xticks(x)
    ax.set_xticklabels([str(i + 1) for i in x])
    ax.legend(loc='upper right', fontsize=6)
    save_figure(fig, 'fig3_achieved_rates', OUTPUT_DIR)


def fig4_dual_search():
    """Fig 4: S(lambda) vs lambda — monotonicity + bisection."""
    print("Figure 4: Dual search S(lambda) vs lambda...")
    N = 8
    a = deterministic_gains(N)
    k = np.full(N, 3.0)
    P_tot = 10.0

    lambdas = np.linspace(0.001, 5.0, 500)
    S_vals = [sum_power(lam, a, k) for lam in lambdas]

    # Run solver to get bisection trace
    res = tr_solve(a, k, P_tot)
    lam_star = res['lambda_star']

    fig, ax = new_figure(SINGLE_COL, aspect=0.75)
    ax.plot(lambdas, S_vals, '-', color=COLORS['target_rate'], linewidth=1.2,
            label=r'$S(\lambda)$')
    ax.axhline(y=P_tot, color=COLORS['target_line'], linestyle='--',
               linewidth=0.8, label=r'$P_{\mathrm{tot}}$')
    ax.axvline(x=lam_star, color=COLORS['inactive'], linestyle=':',
               linewidth=0.8, label=r'$\lambda^*$')
    ax.plot(lam_star, P_tot, 'o', color=COLORS['target_rate'],
            markersize=5, zorder=5)

    ax.set_xlabel(r'Dual variable $\lambda$')
    ax.set_ylabel(r'$S(\lambda) = \sum_i P_i^*(\lambda)$')
    ax.legend(loc='upper right', fontsize=6)
    save_figure(fig, 'fig4_dual_search', OUTPUT_DIR)


def fig5_objective_vs_ptot():
    """Fig 5: Objective J vs P_tot showing zero-threshold transition."""
    print("Figure 5: Objective J vs P_tot...")
    N = 8
    a = deterministic_gains(N)
    k = np.full(N, 3.0)

    p_bar = cap_power(a, k)
    P_threshold = np.sum(p_bar)

    P_tots = np.linspace(0.5, P_threshold * 1.5, 200)
    J_vals = []
    for Pt in P_tots:
        res = tr_solve(a, k, Pt)
        J_vals.append(res['objective'])

    fig, ax = new_figure(SINGLE_COL, aspect=0.75)
    ax.plot(P_tots, J_vals, '-', color=COLORS['target_rate'], linewidth=1.2)
    ax.axvline(x=P_threshold, color=COLORS['target_line'], linestyle='--',
               linewidth=0.8, label=r'$\sum_i \bar{P}_i$')
    ax.fill_between([P_threshold, P_tots[-1]], 0, max(J_vals) * 0.05,
                    color=COLORS['cvxpy'], alpha=0.15, label='$J^* = 0$ region')

    ax.set_xlabel(r'Total power budget $P_{\mathrm{tot}}$')
    ax.set_ylabel(r'Objective $J^*$')
    ax.legend(loc='upper right', fontsize=6)
    ax.set_ylim(bottom=-0.5)
    save_figure(fig, 'fig5_objective_vs_ptot', OUTPUT_DIR)


def fig6_heterogeneous():
    """Fig 6: Heterogeneous targets — 2x2 panel (P_tot=5 vs P_tot=15)."""
    print("Figure 6: Heterogeneous targets (2x2 panel)...")
    N = 8
    a = deterministic_gains(N)
    k = np.array([5.0, 4.0, 3.0, 3.0, 2.0, 2.0, 1.0, 1.0])
    p_bar = cap_power(a, k)
    sum_caps = np.sum(p_bar)

    P_tots = [5.0, 15.0]
    results = [tr_solve(a, k, Pt) for Pt in P_tots]

    x = np.arange(N)
    fig, axes = plt.subplots(2, 2, figsize=(DOUBLE_COL, DOUBLE_COL * 0.55),
                              gridspec_kw={'hspace': 0.12, 'wspace': 0.08})

    # Shared y-limits for each row
    max_power = max(np.max(p_bar), max(np.max(r['P']) for r in results)) * 1.15
    max_rate = max(np.max(k), max(np.max(r['rates']) for r in results)) * 1.15

    for col, (Pt, res) in enumerate(zip(P_tots, results)):
        ax_pow = axes[0, col]
        ax_rate = axes[1, col]

        # Top row: power allocation bars + gap to cap
        ax_pow.bar(x, res['P'], color=COLORS['target_rate'], alpha=0.85,
                   label=r'$P_i^*$')
        ax_pow.bar(x, p_bar - res['P'], bottom=res['P'],
                   color=COLORS['inactive'], alpha=0.3,
                   label=r'$\bar{P}_i - P_i^*$')
        ax_pow.set_ylim(0, max_power)
        ax_pow.set_title(f'({chr(97 + col)}) $P_{{\\mathrm{{tot}}}} = {Pt:.0f}$',
                         fontsize=8, pad=4)

        # Bottom row: achieved rates vs targets
        ax_rate.bar(x, res['rates'], color=COLORS['target_rate'], alpha=0.85,
                    label=r'$r_i^*$')
        ax_rate.plot(x, k, 's', color=COLORS['target_line'], markersize=5,
                     markerfacecolor='none', markeredgewidth=1.0, label=r'$T_i$')
        ax_rate.set_ylim(0, max_rate)
        ax_rate.set_xticks(x)
        ax_rate.set_xticklabels([str(i + 1) for i in x])
        ax_rate.set_xlabel('Channel index $i$')

        # Legends on left column only
        if col == 0:
            ax_pow.set_ylabel(r'Power $P_i$')
            ax_rate.set_ylabel(r'Rate (bits/s/Hz)')
            ax_pow.legend(loc='upper right', fontsize=6)
            ax_rate.legend(loc='upper right', fontsize=6)
        else:
            ax_pow.set_yticklabels([])
            ax_rate.set_yticklabels([])

        # Slack annotation on P_tot=15 power panel
        if Pt > sum_caps:
            used = np.sum(res['P'])
            ax_pow.text(0.97, 0.92,
                        f'Used: {used:.2f} / Budget: {Pt:.0f}',
                        transform=ax_pow.transAxes, fontsize=6,
                        ha='right', va='top',
                        bbox=dict(boxstyle='round,pad=0.3',
                                  facecolor='white', edgecolor='0.7',
                                  alpha=0.9))

    # Remove x-tick labels from top row
    for ax in axes[0]:
        ax.set_xticklabels([])

    save_figure(fig, 'fig6_heterogeneous', OUTPUT_DIR)


def fig7_monte_carlo_cdf():
    """Fig 7: CDF of |r_i - T| over 1000 Rayleigh realizations (4 methods)."""
    print("Figure 7: Monte Carlo CDF (4 methods)...")
    N = 8
    k_val = 3.0
    k = np.full(N, k_val)
    P_tot = 10.0
    n_trials = 1000

    deviations_tr = []
    deviations_wf = []
    deviations_uni = []
    deviations_pf = []

    rng = np.random.default_rng(seed=42)
    for _ in range(n_trials):
        a = rayleigh_gains(N, mean_snr=10.0, rng=rng)
        res_tr = tr_solve(a, k, P_tot)
        res_wf = wf_solve(a, P_tot)
        res_uni = uni_solve(a, P_tot)
        res_pf = pf_solve(a, P_tot)
        deviations_tr.extend(np.abs(res_tr['rates'] - k_val))
        deviations_wf.extend(np.abs(res_wf['rates'] - k_val))
        deviations_uni.extend(np.abs(res_uni['rates'] - k_val))
        deviations_pf.extend(np.abs(res_pf['rates'] - k_val))

    deviations_tr = np.sort(deviations_tr)
    deviations_wf = np.sort(deviations_wf)
    deviations_uni = np.sort(deviations_uni)
    deviations_pf = np.sort(deviations_pf)
    cdf = np.linspace(0, 1, len(deviations_tr))

    # Print quantitative CDF stats for paper text
    for name, dev in [('Target-rate', deviations_tr), ('Waterfilling', deviations_wf),
                      ('Uniform', deviations_uni), ('Prop. fair', deviations_pf)]:
        med = np.median(dev)
        p90 = np.percentile(dev, 90)
        print(f"  {name:14s}: median |r-T| = {med:.3f}, 90th pctl = {p90:.3f}")

    fig, ax = new_figure(SINGLE_COL, aspect=0.75)
    ax.plot(deviations_tr, cdf, '-', color=COLORS['target_rate'],
            linewidth=1.2, label='Target-rate')
    ax.plot(deviations_wf, cdf, '--', color=COLORS['waterfilling'],
            linewidth=1.2, label='Waterfilling')
    ax.plot(deviations_uni, cdf, '-.', color=COLORS['uniform'],
            linewidth=1.2, label='Uniform')
    ax.plot(deviations_pf, cdf, ':', color=COLORS['propfair'],
            linewidth=1.2, label='Prop. fairness')
    ax.set_xlabel(r'$|r_i - T|$ (bits/s/Hz)')
    ax.set_ylabel('CDF')
    ax.legend(loc='lower right', fontsize=6)
    ax.set_xlim(left=0)
    save_figure(fig, 'fig7_monte_carlo_cdf', OUTPUT_DIR)


def fig8_computation_time():
    """Fig 8: Computation time — Lambert-W vs SLSQP for N=4..1024."""
    print("Figure 8: Computation time scalability...")
    from cvxpy_solver import solve as cvx_solve

    Ns = [4, 8, 16, 32, 64, 128, 256, 512, 1024]
    times_lw = []
    times_cvx = []
    stds_lw = []
    stds_cvx = []
    n_repeat = 5

    rng = np.random.default_rng(seed=123)
    for N in Ns:
        a = rayleigh_gains(N, mean_snr=10.0, rng=rng)
        k = np.full(N, 3.0)
        P_tot = N * 1.5

        # Lambert-W timing: collect per-run times
        run_times_lw = []
        for _ in range(n_repeat):
            t0 = time.perf_counter()
            tr_solve(a, k, P_tot)
            run_times_lw.append(time.perf_counter() - t0)
        times_lw.append(np.mean(run_times_lw))
        stds_lw.append(np.std(run_times_lw))

        # SLSQP timing: collect per-run times
        run_times_cvx = []
        for _ in range(n_repeat):
            t0 = time.perf_counter()
            cvx_solve(a, k, P_tot)
            run_times_cvx.append(time.perf_counter() - t0)
        times_cvx.append(np.mean(run_times_cvx))
        stds_cvx.append(np.std(run_times_cvx))

        print(f"    N={N:4d}: Lambert-W={times_lw[-1]:.4f}s, SLSQP={times_cvx[-1]:.4f}s")

    fig, ax = new_figure(SINGLE_COL, aspect=0.75)
    ax.loglog(Ns, times_lw, 'o-', color=COLORS['target_rate'],
              linewidth=1.2, markersize=4, label='Lambert-W (bisection)')
    ax.loglog(Ns, times_cvx, 's--', color=COLORS['cvxpy'],
              linewidth=1.2, markersize=4, label='SLSQP (numerical)')
    ax.set_xlabel('Number of channels $N$')
    ax.set_ylabel('Time (seconds)')
    ax.legend(loc='upper left', fontsize=6)
    ax.set_xticks(Ns)
    ax.set_xticklabels([str(n) for n in Ns])
    ax.get_xaxis().set_major_formatter(plt.ScalarFormatter())
    save_figure(fig, 'fig8_computation_time', OUTPUT_DIR)

    return Ns, times_lw, times_cvx, stds_lw, stds_cvx


def fig9_sensitivity_analysis():
    """Fig 9: Sensitivity — mean squared deviation vs mean SNR."""
    print("Figure 9: Sensitivity analysis...")
    N = 8
    k_val = 3.0
    k = np.full(N, k_val)
    P_tot = 10.0
    n_trials = 500

    snr_dbs = np.arange(0, 21, 2.5)  # 0, 2.5, 5, ..., 20 dB (9 points)
    mean_obj_tr = []
    mean_obj_wf = []
    mean_obj_uni = []
    mean_obj_pf = []

    for snr_db in snr_dbs:
        mean_snr = 10.0 ** (snr_db / 10.0)
        rng = np.random.default_rng(seed=int(snr_db * 100) + 7)

        objs_tr, objs_wf, objs_uni, objs_pf = [], [], [], []
        for _ in range(n_trials):
            a = rayleigh_gains(N, mean_snr=mean_snr, rng=rng)
            res_tr = tr_solve(a, k, P_tot)
            res_wf = wf_solve(a, P_tot)
            res_uni = uni_solve(a, P_tot)
            res_pf = pf_solve(a, P_tot)
            objs_tr.append(tr_objective(res_tr['P'], a, k))
            objs_wf.append(tr_objective(res_wf['P'], a, k))
            objs_uni.append(tr_objective(res_uni['P'], a, k))
            objs_pf.append(tr_objective(res_pf['P'], a, k))

        mean_obj_tr.append(np.mean(objs_tr))
        mean_obj_wf.append(np.mean(objs_wf))
        mean_obj_uni.append(np.mean(objs_uni))
        mean_obj_pf.append(np.mean(objs_pf))

        print(f"    SNR={snr_db:5.1f} dB: TR={mean_obj_tr[-1]:.3f}, "
              f"WF={mean_obj_wf[-1]:.3f}, Uni={mean_obj_uni[-1]:.3f}, "
              f"PF={mean_obj_pf[-1]:.3f}")

    fig, ax = new_figure(SINGLE_COL, aspect=0.75)
    ax.plot(snr_dbs, mean_obj_tr, 'o-', color=COLORS['target_rate'],
            linewidth=1.2, markersize=4, label='Target-rate')
    ax.plot(snr_dbs, mean_obj_wf, 's--', color=COLORS['waterfilling'],
            linewidth=1.2, markersize=4, label='Waterfilling')
    ax.plot(snr_dbs, mean_obj_uni, '^-.', color=COLORS['uniform'],
            linewidth=1.2, markersize=4, label='Uniform')
    ax.plot(snr_dbs, mean_obj_pf, 'D:', color=COLORS['propfair'],
            linewidth=1.2, markersize=4, label='Prop. fairness')
    ax.set_xlabel(r'Mean SNR (dB)')
    ax.set_ylabel(r'Mean objective $\bar{J}$')
    ax.legend(loc='upper right', fontsize=6)
    save_figure(fig, 'fig9_sensitivity', OUTPUT_DIR)


def table1_power_usage():
    """Table I: Power usage and objective comparison (4 methods)."""
    print("Table I: Power usage comparison (4 methods)...")
    N = 8
    a = deterministic_gains(N)
    k = np.full(N, 3.0)

    P_tots = [5.0, 10.0, 15.0, 20.0, 25.0]
    p_bar_sum = np.sum(cap_power(a, k))

    rows = []
    for Pt in P_tots:
        res_tr = tr_solve(a, k, Pt)
        res_wf = wf_solve(a, Pt)
        res_uni = uni_solve(a, Pt)
        res_pf = pf_solve(a, Pt)
        rows.append({
            'P_tot': Pt,
            'tr_used': res_tr['power_used'],
            'tr_obj': res_tr['objective'],
            'wf_used': res_wf['power_used'],
            'wf_obj': tr_objective(res_wf['P'], a, k),
            'uni_used': res_uni['power_used'],
            'uni_obj': tr_objective(res_uni['P'], a, k),
            'pf_used': res_pf['power_used'],
            'pf_obj': tr_objective(res_pf['P'], a, k),
        })

    # Write LaTeX table
    out_path = os.path.join(OUTPUT_DIR, 'table1_power_usage.tex')
    with open(out_path, 'w') as f:
        f.write("% Table I: Power Usage Comparison (4 methods)\n")
        f.write(r"\begin{table*}[t]" + "\n")
        f.write(r"\centering" + "\n")
        f.write(r"\caption{Power usage and target-rate objective $J$ for four allocation strategies. "
                r"Target-rate allocation leaves power unused when $P_{\mathrm{tot}} \ge "
                r"\sum_i \bar{P}_i = " + f"{p_bar_sum:.1f}" + r"$.}" + "\n")
        f.write(r"\label{tab:power_usage}" + "\n")
        f.write(r"\begin{tabular}{rrrrrrrrr}" + "\n")
        f.write(r"\toprule" + "\n")
        f.write(r"$P_{\mathrm{tot}}$ & \multicolumn{2}{c}{Target-Rate} & "
                r"\multicolumn{2}{c}{Waterfilling} & "
                r"\multicolumn{2}{c}{Uniform} & "
                r"\multicolumn{2}{c}{Prop.\ Fairness} \\" + "\n")
        f.write(r"\cmidrule(lr){2-3} \cmidrule(lr){4-5} "
                r"\cmidrule(lr){6-7} \cmidrule(lr){8-9}" + "\n")
        f.write(r" & Used & $J$ & Used & $J$ & Used & $J$ & Used & $J$ \\" + "\n")
        f.write(r"\midrule" + "\n")
        for row in rows:
            f.write(f"{row['P_tot']:.0f} & {row['tr_used']:.2f} & "
                    f"{row['tr_obj']:.3f} & {row['wf_used']:.2f} & "
                    f"{row['wf_obj']:.3f} & {row['uni_used']:.2f} & "
                    f"{row['uni_obj']:.3f} & {row['pf_used']:.2f} & "
                    f"{row['pf_obj']:.3f} \\\\\n")
        f.write(r"\bottomrule" + "\n")
        f.write(r"\end{tabular}" + "\n")
        f.write(r"\end{table*}" + "\n")
    print(f"  Saved {out_path}")

    # Also print to console
    print(f"  Sum of caps: {p_bar_sum:.2f}")
    for row in rows:
        print(f"  P_tot={row['P_tot']:5.1f}  "
              f"TR: used={row['tr_used']:6.2f} J={row['tr_obj']:.4f}  "
              f"WF: used={row['wf_used']:6.2f} J={row['wf_obj']:.4f}  "
              f"Uni: used={row['uni_used']:6.2f} J={row['uni_obj']:.4f}  "
              f"PF: used={row['pf_used']:6.2f} J={row['pf_obj']:.4f}")


def table2_computation(Ns=None, times_lw=None, times_cvx=None,
                       stds_lw=None, stds_cvx=None):
    """Table II: Computational performance vs N (with std devs)."""
    print("Table II: Computational performance...")

    if Ns is None:
        # Re-run if not provided
        from cvxpy_solver import solve as cvx_solve
        Ns = [4, 8, 16, 32, 64, 128, 256, 512, 1024]
        times_lw, times_cvx = [], []
        stds_lw, stds_cvx = [], []
        rng = np.random.default_rng(seed=123)
        for N in Ns:
            a = rayleigh_gains(N, mean_snr=10.0, rng=rng)
            k = np.full(N, 3.0)
            P_tot = N * 1.5
            run_lw, run_cvx = [], []
            for _ in range(5):
                t0 = time.perf_counter()
                tr_solve(a, k, P_tot)
                run_lw.append(time.perf_counter() - t0)
                t0 = time.perf_counter()
                cvx_solve(a, k, P_tot)
                run_cvx.append(time.perf_counter() - t0)
            times_lw.append(np.mean(run_lw))
            stds_lw.append(np.std(run_lw))
            times_cvx.append(np.mean(run_cvx))
            stds_cvx.append(np.std(run_cvx))

    # Compute speedup
    speedups = [tc / tl for tl, tc in zip(times_lw, times_cvx)]

    out_path = os.path.join(OUTPUT_DIR, 'table2_computation.tex')
    with open(out_path, 'w') as f:
        f.write("% Table II: Computational Performance\n")
        f.write(r"\begin{table}[t]" + "\n")
        f.write(r"\centering" + "\n")
        f.write(r"\caption{Computation time (seconds) and speedup of "
                r"Lambert-W bisection vs.\ SLSQP. Mean $\pm$ std over 5 runs.}" + "\n")
        f.write(r"\label{tab:computation}" + "\n")
        f.write(r"\begin{tabular}{rrrr}" + "\n")
        f.write(r"\toprule" + "\n")
        f.write(r"$N$ & Lambert-W & SLSQP & Speedup \\" + "\n")
        f.write(r"\midrule" + "\n")
        for i, N in enumerate(Ns):
            lw_str = f"{times_lw[i]:.4f}"
            cvx_str = f"{times_cvx[i]:.4f}"
            if stds_lw is not None:
                lw_str += f" $\\pm$ {stds_lw[i]:.4f}"
                cvx_str += f" $\\pm$ {stds_cvx[i]:.4f}"
            f.write(f"{N} & {lw_str} & {cvx_str} & "
                    f"{speedups[i]:.0f}$\\times$ \\\\\n")
        f.write(r"\bottomrule" + "\n")
        f.write(r"\end{tabular}" + "\n")
        f.write(r"\end{table}" + "\n")
    print(f"  Saved {out_path}")


# Need matplotlib.pyplot imported for fig6
import matplotlib.pyplot as plt


if __name__ == '__main__':
    print("=" * 60)
    print("Generating all figures and tables for the paper")
    print("=" * 60)

    ieee_style()

    t_start = time.time()

    # Figures 1-7 (no cross-dependencies)
    fig1_validation()
    fig2_allocation_bars()
    fig3_achieved_rates()
    fig4_dual_search()
    fig5_objective_vs_ptot()
    fig6_heterogeneous()
    fig7_monte_carlo_cdf()

    # Figure 8 + Table II share timing data
    Ns, times_lw, times_cvx, stds_lw, stds_cvx = fig8_computation_time()

    # Figure 9: sensitivity analysis
    fig9_sensitivity_analysis()

    # Tables
    table1_power_usage()
    table2_computation(Ns, times_lw, times_cvx, stds_lw, stds_cvx)

    elapsed = time.time() - t_start
    print(f"\nAll done in {elapsed:.1f}s. Outputs in: {OUTPUT_DIR}")
