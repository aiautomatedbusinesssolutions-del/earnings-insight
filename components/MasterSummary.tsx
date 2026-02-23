"use client";

import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
} from "lucide-react";
import type { MasterSummary as MasterSummaryType } from "@/lib/mockData";

interface MasterSummaryProps {
  summary: MasterSummaryType;
  companyName: string;
}

function getTrendIcon(direction: "up" | "down" | "flat") {
  switch (direction) {
    case "up":
      return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    case "down":
      return <TrendingDown className="h-4 w-4 text-rose-400" />;
    case "flat":
      return <Minus className="h-4 w-4 text-amber-400" />;
  }
}

function getTrendColor(direction: "up" | "down" | "flat"): string {
  switch (direction) {
    case "up":
      return "text-emerald-400";
    case "down":
      return "text-rose-400";
    case "flat":
      return "text-amber-400";
  }
}

function getRevenueTrendLabel(trend: "up" | "down" | "flat"): string {
  if (trend === "up") return "↑ Growing";
  if (trend === "down") return "↓ Declining";
  return "→ Flat";
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

export default function MasterSummary({
  summary,
  companyName,
}: MasterSummaryProps) {
  const totalQuarters = summary.beatCount + summary.missCount;
  const beatRate = summary.beatCount >= summary.missCount;
  const quarters = Array.from(
    { length: totalQuarters },
    (_, i) => i < summary.beatCount
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-sky-400" />
        <h2 className="text-lg font-semibold text-slate-100">
          Yearly Master Summary
        </h2>
      </div>

      {/* Transparency trend badge */}
      <div className="flex items-center gap-2.5 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3">
        {getTrendIcon(summary.transparencyTrendDirection)}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider">
            12-Month Trend
          </p>
          <p
            className={`text-sm font-semibold ${getTrendColor(summary.transparencyTrendDirection)}`}
          >
            {summary.transparencyTrend}
          </p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="divide-y divide-slate-800">
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
            <span
              className={beatRate ? "text-emerald-400" : "text-rose-400"}
            >
              {summary.beatCount}/{totalQuarters}
            </span>
          </span>
        </MetricRow>

        <MetricRow label="Avg. Surprise">
          <span
            className={
              summary.avgSurprise >= 0 ? "text-emerald-400" : "text-rose-400"
            }
          >
            {summary.avgSurprise >= 0 ? "+" : ""}
            {summary.avgSurprise.toFixed(1)}%{" "}
            {summary.avgSurprise >= 0 ? "↑" : "↓"}
          </span>
        </MetricRow>

        <MetricRow label="Revenue Trend">
          <span
            className={getTrendColor(
              summary.revenueTrend === "up"
                ? "up"
                : summary.revenueTrend === "down"
                  ? "down"
                  : "flat"
            )}
          >
            {getRevenueTrendLabel(summary.revenueTrend)}
          </span>
        </MetricRow>

        <MetricRow label="Guidance">
          <span className={getGuidanceColor(summary.guidanceAccuracy)}>
            {summary.guidanceAccuracy}
          </span>
        </MetricRow>
      </div>

      {/* Big picture */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-2">
          The Big Picture
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed">
          {summary.bigPicture}
        </p>
      </div>

      {/* Broken Promise Tracker */}
      {summary.brokenPromises.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Broken Promise Tracker
            </h3>
          </div>
          <div className="space-y-3">
            {summary.brokenPromises.map((bp, i) => (
              <div
                key={i}
                className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {bp.quarter}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                      bp.verdict === "missed"
                        ? "bg-rose-500/10 text-rose-400"
                        : "bg-amber-500/10 text-amber-400"
                    }`}
                  >
                    {bp.verdict === "missed" ? "BROKEN" : "HALF-KEPT"}
                  </span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-2">
                    <span className="shrink-0 text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded mt-0.5">
                      SAID
                    </span>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {bp.promise}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 ${
                        bp.verdict === "missed"
                          ? "text-rose-400 bg-rose-500/10"
                          : "text-amber-400 bg-amber-500/10"
                      }`}
                    >
                      DID
                    </span>
                    <p
                      className={`text-sm leading-relaxed ${
                        bp.verdict === "missed"
                          ? "text-rose-400"
                          : "text-amber-400"
                      }`}
                    >
                      {bp.reality}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source footer */}
      <div className="pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 italic">
          Source: SEC EDGAR Form 8-K &amp; Earnings Transcripts
        </p>
      </div>
    </div>
  );
}
