import { useState } from 'react';
import { BlockMath } from 'react-katex';
import type { Theme } from '../hooks/useTheme';

interface Props {
  theme: Theme;
}

export function EquationsPanel({ theme }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const isDark = theme === 'dark';

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wider cursor-pointer ${
          isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Key Equations
      </button>

      {isOpen && (
        <div className={`mt-3 space-y-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          <div>
            <div className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Per-channel rate:
            </div>
            <BlockMath math="r_i = \log_B\!\left(1 + a_i \, P_i\right)" />
          </div>

          <div>
            <div className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Optimization problem:
            </div>
            <BlockMath math="\min_{\{P_i\}} \sum_{i=1}^{N} (r_i - k)^2 \quad \text{s.t.} \quad \sum_{i=1}^{N} P_i \le P_{\text{tot}}, \;\; P_i \ge 0" />
          </div>

          <div>
            <div className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              KKT stationarity (active channels):
            </div>
            <BlockMath math="2(r_i - k) \cdot \frac{a_i}{C(1 + a_i P_i)} = -\lambda, \quad C = \ln B" />
          </div>

          <div>
            <div className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Closed-form via Lambert W:
            </div>
            <BlockMath math="P_i^* = \max\!\left(\frac{2}{\lambda C^2}\,W\!\!\left(\frac{\lambda C^2 B^k}{2 a_i}\right) - \frac{1}{a_i},\; 0\right)" />
          </div>

          <div>
            <div className={`text-xs mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Power cap (to achieve rate = k exactly):
            </div>
            <BlockMath math="P_i^{\text{cap}} = \frac{B^k - 1}{a_i}" />
          </div>

          <p className={`text-xs italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            <strong>Case A:</strong> If P<sub>tot</sub> &ge; &Sigma; P<sub>i</sub><sup>cap</sup>,
            all channels achieve rate k exactly, with leftover power. <br />
            <strong>Case B:</strong> If power-limited (&lambda;* &gt; 0), bisection finds &lambda;*
            such that &Sigma; P<sub>i</sub>(&lambda;*) = P<sub>tot</sub>.
          </p>
        </div>
      )}
    </div>
  );
}
