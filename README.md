# Target-Rate Power Allocation Simulator

An interactive, educational web application for exploring the target-rate power allocation problem — minimizing the squared deviation of channel rates from a target rate k. Built for students studying wireless networks and optimization.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-brightgreen.svg)](https://target-rate-power-allocation.vercel.app)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](LICENSE.md)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61DAFB.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

**[Try the Live Demo →](https://target-rate-power-allocation.vercel.app)**

## Overview

In multi-channel communication systems, a common objective is to allocate power so that each channel achieves a **target rate** k. Unlike the classic water-filling problem (which maximizes total throughput), the target-rate formulation minimizes the sum of squared deviations from k:

```
minimize   Σ (r_i - k)²
subject to Σ P_i ≤ P_tot,  P_i ≥ 0
```

This leads to a fundamentally different allocation strategy derived via KKT conditions and the **Lambert W function**. This simulator makes the solution intuitive through real-time visualization and side-by-side comparison with water-filling.

### Key Features

- **Interactive Allocation Diagram**: Canvas visualization showing per-channel power bars with dashed cap lines (power needed to hit rate k) and achieved rates
- **2–8 Configurable Channels**: Adjust each channel's gain a_i = g_i/n_i individually
- **Target Rate Control**: Slider for k from 0.1 to 5.0
- **Total Power Control**: Slider from 0 to 20 — see the transition from Case B (power-limited) to Case A (target achieved)
- **Log Base Toggle**: Switch between log₂ (bits) and ln (nats)
- **Preset Configurations**: Equal, Gradual, One Weak, and Random presets
- **Case A/B Indicator**: Shows whether all channels hit the target (leftover power) or are power-limited
- **Target-Rate vs Water-Filling Comparison**: Side-by-side bar charts comparing power allocation and achieved rates for both strategies
- **Objective Sweep Plot**: J vs P_tot showing the objective decreasing to zero at the threshold
- **Per-Channel Power Sweep**: Power allocation per channel as total power varies
- **Statistics Panel**: λ*, objective J, power used/budget, active channels, per-channel rate bars
- **KaTeX Equations**: Collapsible panel showing the optimization problem, KKT conditions, Lambert W closed-form solution, and cap formula
- **Dark/Light Mode**: Toggle with localStorage persistence

## How It Works

### The Math

Given N parallel channels with gains a_i = g_i/n_i, the per-channel rate is:

```
r_i = log_B(1 + a_i · P_i)
```

where B is the log base (2 for bits, e for nats). The optimization problem minimizes total squared deviation from target rate k.

Applying KKT conditions and solving via the **Lambert W function** yields:

```
P_i* = max( (2/(λ·C²)) · W(λ·C²·B^k / (2·a_i)) - 1/a_i,  0 )
```

where C = ln(B), W is the Lambert W principal branch, and λ* is found by bisection so that Σ P_i* = P_tot.

Each channel has a **power cap** — the power needed to achieve rate k exactly:

```
P_i^cap = (B^k - 1) / a_i
```

### Two Cases

| Case | Condition | Behavior |
|------|-----------|----------|
| **Case A** | P_tot ≥ Σ P_i^cap | All channels achieve rate k exactly; leftover power is unused; λ* = 0 |
| **Case B** | P_tot < Σ P_i^cap | Power constraint is binding; λ* > 0; all channels fall short of k |

### Key Insights Students Can Discover

| Observation | How to See It |
|-------------|---------------|
| **Better channels need less power to hit k** | Compare cap lines across channels with different a_i |
| **Target-rate gives more power to weak channels** | Compare with water-filling, which favors strong channels |
| **Water-filling maximizes throughput, target-rate equalizes rates** | Side-by-side rate comparison shows the tradeoff |
| **Objective J drops to zero at a threshold** | Sweep the J vs P_tot plot — there's a sharp transition |
| **Leftover power in Case A** | Set high P_tot or low k — power used is less than budget |
| **Log base changes the cap values** | Toggle between log₂ and ln; caps shift accordingly |

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/ANRGUSC/target-rate-power-allocation.git
cd target-rate-power-allocation

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Project Structure

```
target-rate-power-allocation/
├── src/
│   ├── components/
│   │   ├── AllocationDiagram.tsx      # Canvas: power bars + cap lines + rates
│   │   ├── ComparisonPlot.tsx         # Recharts: target-rate vs waterfilling
│   │   ├── ObjectiveSweepPlot.tsx     # Recharts: J vs Ptot + power sweep
│   │   ├── Controls.tsx               # Sliders, presets, channel config
│   │   ├── StatsPanel.tsx             # λ*, J, power, active channels
│   │   └── EquationsPanel.tsx         # Collapsible KaTeX equations
│   ├── hooks/
│   │   ├── useTargetRate.ts           # State management + solver orchestration
│   │   └── useTheme.ts               # Dark/light mode toggle
│   ├── utils/
│   │   ├── lambertW.ts               # Lambert W (Halley's method)
│   │   ├── targetRate.ts             # KKT solver with bisection
│   │   └── waterfilling.ts           # Classic waterfilling (for comparison)
│   ├── types/
│   │   ├── index.ts                  # TypeScript interfaces
│   │   └── react-katex.d.ts          # Module declaration
│   ├── App.tsx                       # Main layout
│   ├── main.tsx                      # Entry point
│   └── index.css                     # Tailwind + theme styles
├── LICENSE.md                        # PolyForm Noncommercial 1.0.0
└── README.md
```

## Technologies Used

- **React 19** with hooks for UI
- **TypeScript 5.9** for type safety
- **Vite 7** for fast development and building
- **Tailwind CSS 4** for styling
- **Recharts 3** for charts
- **HTML Canvas** for the allocation diagram
- **KaTeX** for LaTeX equation rendering

## Related

- [Water-Filling Power Allocation Simulator](https://github.com/ANRGUSC/waterfilling-demo) — companion demo for the classic water-filling solution

## License

This project is licensed under the [PolyForm Noncommercial License 1.0.0](LICENSE.md).

- **Non-commercial use**: Free for educational, research, and personal use
- **Commercial use**: Requires a separate commercial license

For commercial licensing inquiries, please contact the author.

## Author

**Bhaskar Krishnamachari**
University of Southern California
EE 597 - Wireless Networks

Developed with Claude Code, February 2026
