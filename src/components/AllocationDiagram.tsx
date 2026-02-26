import { useRef, useEffect } from 'react';
import type { TargetRateResult } from '../types';
import type { Theme } from '../hooks/useTheme';

interface Props {
  channelGains: number[];
  result: TargetRateResult;
  targetRate: number;
  channelColors: string[];
  theme: Theme;
}

const THEME_COLORS = {
  dark: {
    panelBg: '#1e293b',
    border: '#334155',
    text: '#f1f5f9',
    textMuted: '#94a3b8',
    axisLine: '#64748b',
    capLine: '#ef4444',
    targetLine: '#22d3ee',
  },
  light: {
    panelBg: '#ffffff',
    border: '#cbd5e1',
    text: '#0f172a',
    textMuted: '#475569',
    axisLine: '#94a3b8',
    capLine: '#dc2626',
    targetLine: '#0891b2',
  },
};

export function AllocationDiagram({ channelGains, result, targetRate, channelColors, theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const colors = THEME_COLORS[theme];
    const width = container.clientWidth;
    const height = container.clientHeight;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = colors.panelBg;
    ctx.fillRect(0, 0, width, height);

    const n = channelGains.length;
    const { powers, rates, caps } = result;

    // Layout
    const margin = { top: 30, right: 120, bottom: 55, left: 60 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const barGap = 8;
    const barWidth = Math.max(20, (plotW - barGap * (n + 1)) / n);
    const totalBarsWidth = n * barWidth + (n + 1) * barGap;
    const offsetX = margin.left + (plotW - totalBarsWidth) / 2;

    // Y-axis scale (power)
    const maxPower = Math.max(...powers, ...caps, 1);
    const yMax = maxPower * 1.3;
    const yScale = (val: number) => margin.top + plotH * (1 - val / yMax);

    // Draw axes
    ctx.strokeStyle = colors.axisLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotH);
    ctx.lineTo(width - margin.right, margin.top + plotH);
    ctx.stroke();

    // Y-axis ticks
    ctx.fillStyle = colors.textMuted;
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const numTicks = 5;
    for (let i = 0; i <= numTicks; i++) {
      const val = (yMax * i) / numTicks;
      const y = yScale(val);
      ctx.fillText(val.toFixed(1), margin.left - 8, y);
      if (i > 0) {
        ctx.strokeStyle = colors.border;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(margin.left, y);
        ctx.lineTo(width - margin.right, y);
        ctx.stroke();
      }
    }

    // Draw power bars for each channel
    for (let i = 0; i < n; i++) {
      const color = channelColors[i % channelColors.length];
      const x = offsetX + barGap + i * (barWidth + barGap);
      const power = powers[i];
      const cap = caps[i];
      const yBottom = yScale(0);

      // Power bar
      if (power > 0.001) {
        const yTop = yScale(power);
        ctx.fillStyle = color + 'cc';
        ctx.fillRect(x, yTop, barWidth, yBottom - yTop);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, yTop, barWidth, yBottom - yTop);

        // Power label above bar
        ctx.fillStyle = color;
        ctx.font = 'bold 10px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`P=${power.toFixed(2)}`, x + barWidth / 2, yTop - 3);
      }

      // Cap line (dashed horizontal at cap level)
      if (cap <= yMax) {
        const yCap = yScale(cap);
        ctx.strokeStyle = colors.capLine;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x - 3, yCap);
        ctx.lineTo(x + barWidth + 3, yCap);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cap value label
        ctx.fillStyle = colors.capLine;
        ctx.font = '9px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`cap=${cap.toFixed(1)}`, x + barWidth / 2, yCap - 2);
      }

      // Channel label
      ctx.fillStyle = colors.textMuted;
      ctx.font = '11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(`Ch ${i + 1}`, x + barWidth / 2, yBottom + 6);

      // a_i value
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(`a=${channelGains[i].toFixed(1)}`, x + barWidth / 2, yBottom + 20);

      // Rate below a_i
      const rate = rates[i];
      ctx.fillStyle = rate >= targetRate - 0.01 ? '#22c55e' : colors.textMuted;
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillText(`r=${rate.toFixed(2)}`, x + barWidth / 2, yBottom + 33);
    }

    // Legend on right side
    const legendX = width - margin.right + 10;
    let legendY = margin.top + 10;

    // Cap line legend
    ctx.strokeStyle = colors.capLine;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY);
    ctx.lineTo(legendX + 20, legendY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Cap (rate=k)', legendX + 24, legendY);

    legendY += 20;

    // Power bar legend
    ctx.fillStyle = channelColors[0] + 'cc';
    ctx.fillRect(legendX, legendY - 5, 20, 10);
    ctx.fillStyle = colors.textMuted;
    ctx.fillText('Allocated P_i', legendX + 24, legendY);

    legendY += 30;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(`Target k=${targetRate.toFixed(1)}`, legendX, legendY);

    // Y-axis label
    ctx.save();
    ctx.translate(14, margin.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = colors.textMuted;
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Power', 0, 0);
    ctx.restore();
  }, [channelGains, result, targetRate, channelColors, theme]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[300px]">
      <canvas ref={canvasRef} />
    </div>
  );
}
