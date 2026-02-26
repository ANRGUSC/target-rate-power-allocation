"""
IEEE-style matplotlib configuration for publication-quality figures.
"""

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib as mpl


# IEEE column width: ~3.5 in (single), ~7.16 in (double)
SINGLE_COL = 3.5
DOUBLE_COL = 7.16

# Color palette (colorblind-friendly)
COLORS = {
    'target_rate': '#1f77b4',    # blue
    'waterfilling': '#ff7f0e',   # orange
    'cvxpy': '#2ca02c',          # green
    'target_line': '#d62728',    # red
    'inactive': '#7f7f7f',       # gray
    'cap': '#9467bd',            # purple
    'uniform': '#8c564b',        # brown
    'propfair': '#e377c2',       # pink
}


def ieee_style():
    """Apply IEEE-style matplotlib parameters."""
    plt.rcParams.update({
        # Font
        'font.family': 'serif',
        'font.serif': ['Times New Roman', 'Times', 'DejaVu Serif'],
        'font.size': 8,
        'axes.labelsize': 9,
        'axes.titlesize': 9,
        'legend.fontsize': 7,
        'xtick.labelsize': 7,
        'ytick.labelsize': 7,

        # Figure
        'figure.dpi': 300,
        'savefig.dpi': 300,
        'savefig.bbox': 'tight',
        'savefig.pad_inches': 0.02,

        # Lines
        'lines.linewidth': 1.0,
        'lines.markersize': 4,

        # Axes
        'axes.linewidth': 0.5,
        'axes.grid': True,
        'grid.linewidth': 0.3,
        'grid.alpha': 0.4,

        # Ticks
        'xtick.major.width': 0.5,
        'ytick.major.width': 0.5,
        'xtick.direction': 'in',
        'ytick.direction': 'in',

        # Legend
        'legend.framealpha': 0.9,
        'legend.edgecolor': '0.8',

        # Text
        'text.usetex': False,
        'mathtext.fontset': 'dejavuserif',
    })


def new_figure(width=SINGLE_COL, height=None, aspect=0.75):
    """Create a new figure with IEEE dimensions."""
    if height is None:
        height = width * aspect
    fig, ax = plt.subplots(figsize=(width, height))
    return fig, ax


def save_figure(fig, name, output_dir='outputs'):
    """Save figure as both PDF and PNG."""
    import os
    os.makedirs(output_dir, exist_ok=True)
    pdf_path = os.path.join(output_dir, f'{name}.pdf')
    png_path = os.path.join(output_dir, f'{name}.png')
    fig.savefig(pdf_path)
    fig.savefig(png_path)
    plt.close(fig)
    print(f"  Saved {pdf_path} and {png_path}")
