"use client";

import { BarChart3 } from "lucide-react";

interface SummaryCardProps {
  beatCount: number;
  missCount: number;
  avgSurprise: number;
  revenueTrend: "up" | "down" | "flat";
  guidanceAccuracy: "Conservative" | "Accurate" | "Optimistic";
  overallSentiment: string;
}

function getTrendArrow(trend: "up" | "down" | "flat"): string {
  if (trend === "up") return "↑";
  if (trend === "down") return "↓";
  return "→";
}

function getTrendColor(trend: "up" | "down" | "flat"): string {
  if (trend === "up") return "text-emerald-400";
  if (trend === "down") return "text-rose-400";
  return "text-amber-400";
}

function getTrendLabel(trend: "up" | "down" | "flat"): string {
  if (trend === "up") return "Growing";
  if (trend === "down") return "Declining";
  return "Flat";
}

function getGuidanceColor(
  accuracy: "Conservative" | "Accurate" | "Optimistic"
): string {
  if (accuracy === "Conservative") return "text-emerald-400";
  if (accuracy === "Accurate") return "text-sky-400";
  return "text-rose-400";
}

function MetricRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between items-center py-2.5">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

export default function SummaryCard({
  beatCount,
  missCount,
  avgSurprise,
  revenueTrend,
  guidanceAccuracy,
  overallSentiment,
}: SummaryCardProps) {
  const totalQuarters = beatCount + missCount;
  const beatRate = beatCount >= missCount;

  // Visual: small dots for beat/miss track record
  const quarters = Array.from({ length: totalQuarters }, (_, i) => i < beatCount);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-sky-400" />
        <h2 className="text-lg font-semibold text-slate-100">
          Yearly Summary
        </h2>
      </div>

      <div className="divide-y divide-slate-800">
        {/* Beat record with visual dots */}
        <MetricRow label="Track Record">
          <span className="flex items-center gap-2">
            <span className="flex gap-1">
              {quarters.map((beat, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${
                    beat ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
              ))}
            </span>
            <span className={beatRate ? "text-emerald-400" : "text-rose-400"}>
              {beatCount}/{totalQuarters}
            </span>
          </span>
        </MetricRow>

        {/* Average surprise */}
        <MetricRow label="Avg. Surprise">
          <span
            className={
              avgSurprise >= 0 ? "text-emerald-400" : "text-rose-400"
            }
          >
            {avgSurprise >= 0 ? "+" : ""}
            {avgSurprise.toFixed(1)}%{" "}
            {avgSurprise >= 0 ? "↑" : "↓"}
          </span>
        </MetricRow>

        {/* Revenue trend */}
        <MetricRow label="Revenue Trend">
          <span className={getTrendColor(revenueTrend)}>
            {getTrendArrow(revenueTrend)} {getTrendLabel(revenueTrend)}
          </span>
        </MetricRow>

        {/* Guidance accuracy */}
        <MetricRow label="Guidance">
          <span className={getGuidanceColor(guidanceAccuracy)}>
            {guidanceAccuracy}
          </span>
        </MetricRow>
      </div>

      {/* Divider + sentiment */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <p className="text-sm text-slate-300 leading-relaxed">
          {overallSentiment}
        </p>
      </div>
    </div>
  );
}
