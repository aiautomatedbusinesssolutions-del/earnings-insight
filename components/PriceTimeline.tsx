"use client";

import { useMemo, useCallback } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
} from "recharts";
import { TrendingUp } from "lucide-react";
import type { DailyPrice, EarningsEvent } from "@/lib/mockData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PriceTimelineProps {
  prices: DailyPrice[];
  earnings: EarningsEvent[];
  selectedQuarter: string | null;
  onEarningsSelect: (quarter: string | null) => void;
}

interface ChartDataPoint {
  date: string;
  close: number;
  earnings?: EarningsEvent;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatMonth(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short" });
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function shortQuarter(quarter: string): string {
  // "Q1 2025" -> "Q1"
  return quarter.split(" ")[0];
}

// ---------------------------------------------------------------------------
// Custom 'E' Marker shape — shows quarter label, highlights when selected
// ---------------------------------------------------------------------------
function EarningsMarker(props: {
  cx?: number;
  cy?: number;
  quarter?: string;
  isSelected?: boolean;
}) {
  const { cx = 0, cy = 0, quarter = "", isSelected = false } = props;
  const label = shortQuarter(quarter);

  return (
    <g style={{ cursor: "pointer" }}>
      {/* Selected: animated outer glow pulse */}
      {isSelected && (
        <circle
          cx={cx}
          cy={cy}
          r={22}
          fill="none"
          stroke="#38bdf8"
          strokeWidth={1.5}
          opacity={0.4}
        >
          <animate
            attributeName="r"
            values="18;24;18"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.15;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      )}
      {/* Outer glow ring — brighter when selected */}
      <circle
        cx={cx}
        cy={cy}
        r={18}
        fill={isSelected ? "rgba(56,189,248,0.15)" : "rgba(56,189,248,0.06)"}
      />
      {/* Background circle */}
      <circle
        cx={cx}
        cy={cy}
        r={14}
        fill={isSelected ? "#0c4a6e" : "#0f172a"}
        stroke={isSelected ? "#7dd3fc" : "#38bdf8"}
        strokeWidth={isSelected ? 2.5 : 2}
      />
      {/* Quarter label */}
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="central"
        fill={isSelected ? "#7dd3fc" : "#38bdf8"}
        fontSize={9}
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {label}
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Comparison bar used in the Earnings Scorecard tooltip
// ---------------------------------------------------------------------------
function ComparisonBar({
  label,
  estimate,
  actual,
  unit,
}: {
  label: string;
  estimate: number;
  actual: number;
  unit: string;
}) {
  const max = Math.max(estimate, actual);
  const estWidth = max > 0 ? (estimate / max) * 100 : 0;
  const actWidth = max > 0 ? (actual / max) * 100 : 0;
  const beat = actual >= estimate;

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
      {/* Estimate bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 w-12 shrink-0">Est.</span>
        <div className="flex-1 h-4 bg-slate-800 rounded-sm overflow-hidden">
          <div
            className="h-full bg-slate-600 rounded-sm"
            style={{ width: `${estWidth}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-400 w-16 text-right tabular-nums">
          {unit}
          {estimate.toFixed(2)}
        </span>
      </div>
      {/* Actual bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-slate-500 w-12 shrink-0">Act.</span>
        <div className="flex-1 h-4 bg-slate-800 rounded-sm overflow-hidden">
          <div
            className={`h-full rounded-sm ${beat ? "bg-emerald-500" : "bg-rose-500"}`}
            style={{ width: `${actWidth}%` }}
          />
        </div>
        <span
          className={`text-[11px] w-16 text-right font-medium tabular-nums ${beat ? "text-emerald-400" : "text-rose-400"}`}
        >
          {unit}
          {actual.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom Tooltip — ONLY shows earnings scorecard when hovering an E marker.
// Regular points show date + price only. Never leaks selected state.
// ---------------------------------------------------------------------------
interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: ChartDataPoint }[];
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.[0]) return null;

  const point = payload[0].payload;
  const earnings = point.earnings ?? null;

  // Earnings point: show the full scorecard for THIS hovered marker
  if (earnings) {
    const beat = earnings.epsActual >= earnings.epsEstimate;
    const reactionPositive = earnings.stockReaction >= 0;

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl shadow-black/50 w-[280px] pointer-events-none">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">
              {earnings.quarter}
            </p>
            <p className="text-xs text-slate-500">
              {formatFullDate(earnings.date)}
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              beat
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {beat ? "BEAT" : "MISS"}
          </span>
        </div>

        {/* EPS bars */}
        <ComparisonBar
          label="Earnings Per Share (EPS)"
          estimate={earnings.epsEstimate}
          actual={earnings.epsActual}
          unit="$"
        />

        <div className="my-3 border-t border-slate-800" />

        {/* Revenue bars */}
        <ComparisonBar
          label="Revenue (Billions)"
          estimate={earnings.revenueEstimate}
          actual={earnings.revenueActual}
          unit="$"
        />

        <div className="my-3 border-t border-slate-800" />

        {/* Bottom stats */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Surprise
            </p>
            <p
              className={`text-sm font-bold tabular-nums ${
                earnings.surprisePercent >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {earnings.surprisePercent >= 0 ? "+" : ""}
              {earnings.surprisePercent.toFixed(1)}%
              {earnings.surprisePercent >= 0 ? " ↑" : " ↓"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">
              Next-Day Move
            </p>
            <p
              className={`text-sm font-bold tabular-nums ${
                reactionPositive ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {reactionPositive ? "+" : ""}
              {earnings.stockReaction.toFixed(1)}%
              {reactionPositive ? " ↑" : " ↓"}
            </p>
          </div>
        </div>

        <p className="text-[10px] text-slate-600 mt-3 text-center">
          Click marker to lock this quarter into the Deep Dive
        </p>
      </div>
    );
  }

  // Regular price point: minimal date + price
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 shadow-xl shadow-black/40 pointer-events-none">
      <p className="text-xs text-slate-500">{formatFullDate(point.date)}</p>
      <p className="text-sm font-semibold text-slate-100 tabular-nums">
        ${point.close.toFixed(2)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Custom active dot — only for regular points (not earnings markers)
// ---------------------------------------------------------------------------
function ActiveDot(props: {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
}) {
  const { cx = 0, cy = 0, payload } = props;
  if (payload?.earnings) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="rgba(59,130,246,0.2)" />
      <circle cx={cx} cy={cy} r={3} fill="#3b82f6" />
    </g>
  );
}

// ---------------------------------------------------------------------------
// X-axis tick: show each month label once
// ---------------------------------------------------------------------------
function MonthTick(props: {
  x?: number;
  y?: number;
  payload?: { value: string };
}) {
  const { x = 0, y = 0, payload } = props;
  if (!payload) return null;
  return (
    <text x={x} y={y + 14} textAnchor="middle" fill="#64748b" fontSize={11}>
      {formatMonth(payload.value)}
    </text>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PriceTimeline({
  prices,
  earnings,
  selectedQuarter,
  onEarningsSelect,
}: PriceTimelineProps) {
  // Merge earnings into chart data so the Tooltip can detect them on hover
  const { chartData, earningsPoints, changePercent } = useMemo(() => {
    const earningsMap = new Map(earnings.map((e) => [e.date, e]));

    const data: ChartDataPoint[] = prices.map((p) => ({
      ...p,
      earnings: earningsMap.get(p.date),
    }));

    const points = earnings.map((e) => {
      const pricePoint = data.find((d) => d.date === e.date);
      return { ...e, close: pricePoint?.close ?? 0 };
    });

    const first = prices[0]?.close ?? 0;
    const last = prices[prices.length - 1]?.close ?? 0;
    const pct = first ? ((last - first) / first) * 100 : 0;

    return { chartData: data, earningsPoints: points, changePercent: pct };
  }, [prices, earnings]);

  const isPositive = changePercent >= 0;

  // Y-axis domain with padding
  const { yMin, yMax } = useMemo(() => {
    const closes = prices.map((p) => p.close);
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const pad = (max - min) * 0.1;
    return {
      yMin: Math.floor((min - pad) * 100) / 100,
      yMax: Math.ceil((max + pad) * 100) / 100,
    };
  }, [prices]);

  // X-axis ticks: one per month
  const monthTicks = useMemo(() => {
    const seen = new Set<string>();
    const ticks: string[] = [];
    for (const p of chartData) {
      const key = p.date.slice(0, 7);
      if (!seen.has(key)) {
        seen.add(key);
        ticks.push(p.date);
      }
    }
    return ticks;
  }, [chartData]);

  const handleMarkerClick = useCallback(
    (ep: EarningsEvent) => {
      onEarningsSelect(selectedQuarter === ep.quarter ? null : ep.quarter);
    },
    [onEarningsSelect, selectedQuarter]
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-sky-400" />
          <h2 className="text-lg font-semibold text-slate-100">
            Price &amp; Earnings Timeline
          </h2>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400">1Y</span>
          <span
            className={`font-medium ${isPositive ? "text-emerald-400" : "text-rose-400"}`}
          >
            {isPositive ? "↑" : "↓"}{" "}
            {isPositive ? "+" : ""}
            {changePercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-[340px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 24, right: 16, bottom: 4, left: 0 }}
          >
            {/* Subtle horizontal grid only */}
            <CartesianGrid
              horizontal={true}
              vertical={false}
              stroke="#1e293b"
              strokeDasharray="4 4"
            />

            <XAxis
              dataKey="date"
              ticks={monthTicks}
              tick={<MonthTick />}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              domain={[yMin, yMax]}
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              width={52}
            />

            <Tooltip
              content={<CustomTooltip />}
              cursor={{
                stroke: "#334155",
                strokeWidth: 1,
                strokeDasharray: "4 4",
              }}
              isAnimationActive={false}
              allowEscapeViewBox={{ x: false, y: true }}
            />

            {/* Price line */}
            <Line
              type="monotone"
              dataKey="close"
              stroke="#3b82f6"
              strokeWidth={2.5}
              dot={false}
              activeDot={<ActiveDot />}
              animationDuration={800}
            />

            {/* Earnings markers with quarter labels + selection highlight */}
            {earningsPoints.map((ep) => (
              <ReferenceDot
                key={ep.date}
                x={ep.date}
                y={ep.close}
                shape={
                  <EarningsMarker
                    quarter={ep.quarter}
                    isSelected={selectedQuarter === ep.quarter}
                  />
                }
                onClick={() => handleMarkerClick(ep)}
                isFront={true}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer hint */}
      <p className="text-xs text-slate-500 mt-3">
        Hover a marker for quick context. Click to lock that quarter into the
        Deep Dive below.
      </p>
    </div>
  );
}
