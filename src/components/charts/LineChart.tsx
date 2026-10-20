"use client";

import * as React from "react";

export interface LineSeries {
  id: string;
  label: string;
  /** CSS colour, e.g. `var(--chart-1)`. */
  color: string;
  points: { x: number; y: number }[];
  /** Drawn thicker and on top (the local player). */
  emphasized?: boolean;
}

interface LineChartProps {
  series: LineSeries[];
  /** Accessible summary; the same data is also available as a table elsewhere. */
  ariaLabel: string;
  formatX: (x: number) => string;
  formatY: (y: number) => string;
  height?: number;
}

const PAD = { top: 12, right: 16, bottom: 28, left: 40 };
const WIDTH = 640;

function niceMax(value: number): number {
  if (value <= 0) return 10;
  const step = 10 ** Math.floor(Math.log10(value));
  return Math.ceil(value / step) * step;
}

/** Value of a series at `x` (last point at or before it). */
function valueAt(points: LineSeries["points"], x: number): number | null {
  let found: number | null = null;
  for (const p of points) {
    if (p.x <= x) found = p.y;
    else break;
  }
  return found;
}

/**
 * Multi-series line chart in plain SVG: 2px lines, hairline grid, one shared
 * y-axis, a crosshair tooltip listing every series (mouse and keyboard) and a
 * legend so identity never relies on colour alone.
 */
export function LineChart({ series, ariaLabel, formatX, formatY, height = 240 }: LineChartProps) {
  const [hoverX, setHoverX] = React.useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))].sort((a, b) => a - b);
  const maxX = Math.max(1, ...xs);
  const maxY = niceMax(Math.max(0, ...series.flatMap((s) => s.points.map((p) => p.y))));
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;
  const sx = (x: number) => PAD.left + (x / maxX) * innerW;
  const sy = (y: number) => PAD.top + innerH - (y / maxY) * innerH;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxY);

  const ordered = [...series].sort((a, b) => Number(a.emphasized) - Number(b.emphasized));

  function snap(clientX: number) {
    const svg = svgRef.current;
    if (!svg || xs.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * WIDTH;
    const dataX = ((x - PAD.left) / innerW) * maxX;
    setHoverX(xs.reduce((best, v) => (Math.abs(v - dataX) < Math.abs(best - dataX) ? v : best)));
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (xs.length === 0) return;
    const index = hoverX === null ? -1 : xs.indexOf(hoverX);
    if (event.key === "ArrowRight") setHoverX(xs[Math.min(xs.length - 1, index + 1)]);
    else if (event.key === "ArrowLeft") setHoverX(xs[Math.max(0, index - 1)]);
    else return;
    event.preventDefault();
  }

  const readout =
    hoverX === null
      ? []
      : series
          .map((s) => ({ s, value: valueAt(s.points, hoverX) }))
          .filter((r): r is { s: LineSeries; value: number } => r.value !== null)
          .sort((a, b) => b.value - a.value);
  const tooltipLeft = hoverX === null ? 0 : (sx(hoverX) / WIDTH) * 100;

  return (
    <figure className="relative w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${height}`}
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        className="w-full overflow-visible rounded-xl focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[var(--chart-1)]"
        onPointerMove={(e) => snap(e.clientX)}
        onPointerLeave={() => setHoverX(null)}
        onFocus={() => setHoverX((x) => x ?? xs.at(-1) ?? null)}
        onBlur={() => setHoverX(null)}
        onKeyDown={onKeyDown}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={sy(tick)}
              y2={sy(tick)}
              stroke="var(--chart-grid)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={sy(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-zinc-600 text-[11px] font-bold dark:fill-zinc-300"
            >
              {formatY(tick)}
            </text>
          </g>
        ))}
        {[0, 0.5, 1].map((f) => (
          <text
            key={f}
            x={sx(f * maxX)}
            y={height - 8}
            textAnchor={f === 0 ? "start" : f === 1 ? "end" : "middle"}
            className="fill-zinc-600 text-[11px] font-bold dark:fill-zinc-300"
          >
            {formatX(f * maxX)}
          </text>
        ))}

        {ordered.map((s) => (
          <polyline
            key={s.id}
            fill="none"
            stroke={s.color}
            strokeWidth={s.emphasized ? 3 : 2}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={s.points.map((p) => `${sx(p.x)},${sy(p.y)}`).join(" ")}
          />
        ))}
        {ordered.map((s) => {
          const last = s.points.at(-1);
          return last ? (
            <circle
              key={`${s.id}-end`}
              cx={sx(last.x)}
              cy={sy(last.y)}
              r={4}
              fill={s.color}
              stroke="var(--chart-surface)"
              strokeWidth={2}
            />
          ) : null;
        })}

        {hoverX !== null && (
          <line
            x1={sx(hoverX)}
            x2={sx(hoverX)}
            y1={PAD.top}
            y2={PAD.top + innerH}
            stroke="var(--chart-ink)"
            strokeWidth={1}
          />
        )}
      </svg>

      {hoverX !== null && readout.length > 0 && (
        <div
          role="status"
          className="border-slate-dark pointer-events-none absolute top-2 z-10 min-w-36 rounded-xl border-2 bg-white px-3 py-2 text-xs shadow-lg dark:border-zinc-600 dark:bg-zinc-900"
          style={{
            left: `${tooltipLeft}%`,
            transform: tooltipLeft > 60 ? "translateX(calc(-100% - 8px))" : "translateX(8px)",
          }}
        >
          <p className="mb-1 font-bold text-zinc-600 dark:text-zinc-300">{formatX(hoverX)}</p>
          <ul className="space-y-0.5">
            {readout.slice(0, 8).map(({ s, value }) => (
              <li key={s.id} className="flex items-center gap-2">
                <span aria-hidden className="h-0.5 w-3 rounded" style={{ background: s.color }} />
                <span className="font-black">{formatY(value)}</span>
                <span className="truncate text-zinc-600 dark:text-zinc-300">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {series.length > 1 && (
        <figcaption>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold">
            {series.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="w-4 rounded"
                  style={{ background: s.color, height: s.emphasized ? 3 : 2 }}
                />
                {s.label}
              </li>
            ))}
          </ul>
        </figcaption>
      )}
    </figure>
  );
}

/** Fixed colour order; series past the palette share a muted grey (never cycled). */
export function seriesColor(index: number): string {
  return index < 4 ? `var(--chart-${index + 1})` : "var(--chart-muted)";
}
