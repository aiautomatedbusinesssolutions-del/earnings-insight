"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquareWarning, ChevronRight } from "lucide-react";
import type { TruthTranslatorEntry } from "@/lib/mockData";

interface TruthTranslatorProps {
  entries: TruthTranslatorEntry[];
  selectedQuarter: string | null;
  onSelectQuarter: (quarter: string) => void;
}

function getVerdictColor(verdict: "delivered" | "partial" | "missed"): string {
  switch (verdict) {
    case "delivered":
      return "text-emerald-400";
    case "partial":
      return "text-amber-400";
    case "missed":
      return "text-rose-400";
  }
}

function getVerdictBg(verdict: "delivered" | "partial" | "missed"): string {
  switch (verdict) {
    case "delivered":
      return "bg-emerald-500/10";
    case "partial":
      return "bg-amber-500/10";
    case "missed":
      return "bg-rose-500/10";
  }
}

function getVerdictLabel(verdict: "delivered" | "partial" | "missed"): string {
  switch (verdict) {
    case "delivered":
      return "Delivered";
    case "partial":
      return "Partially";
    case "missed":
      return "Missed";
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function TruthTranslator({
  entries,
  selectedQuarter,
  onSelectQuarter,
}: TruthTranslatorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Default to most recent quarter if none selected
  const activeQuarter =
    selectedQuarter ?? entries[entries.length - 1]?.quarter ?? null;
  const activeEntry = entries.find((e) => e.quarter === activeQuarter) ?? null;

  // Scroll to top when quarter changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeQuarter]);

  if (!activeEntry) return null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <MessageSquareWarning className="h-5 w-5 text-sky-400" />
        <h2 className="text-lg font-semibold text-slate-100">
          AI Truth-Translator
        </h2>
      </div>
      <p className="text-sm text-slate-400 mb-5">
        What the CEO said vs. what actually happened — decoded for real people.
      </p>

      {/* Quarter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {entries.map((entry) => {
          const isActive = entry.quarter === activeQuarter;
          return (
            <button
              key={entry.quarter}
              onClick={() => onSelectQuarter(entry.quarter)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                  : "bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-800 hover:text-slate-300"
              }`}
            >
              {entry.quarter}
            </button>
          );
        })}
      </div>

      {/* Content — scrollable */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeQuarter}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.25 }}
          ref={scrollRef}
          className="max-h-[480px] overflow-y-auto space-y-6 pr-1"
        >
          {/* Date subheader */}
          <p className="text-xs text-slate-500">
            Earnings call: {formatDate(activeEntry.date)}
          </p>

          {/* Script vs Reality — two columns on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* The Script */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-sky-400" />
                <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">
                  The Script
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                What the company wants you to hear
              </p>
              <ul className="space-y-3">
                {activeEntry.script.map((point, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-300 leading-relaxed pl-4 border-l-2 border-slate-700"
                  >
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* The Reality */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
                  The Reality
                </h3>
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                What the AI decoded from the Q&amp;A
              </p>
              <ul className="space-y-3">
                {activeEntry.reality.map((point, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    {/* Verdict badge */}
                    <span
                      className={`shrink-0 mt-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded ${getVerdictBg(activeEntry.verdicts[i])} ${getVerdictColor(activeEntry.verdicts[i])}`}
                    >
                      {getVerdictLabel(activeEntry.verdicts[i])}
                    </span>
                    <span
                      className={`text-sm leading-relaxed ${getVerdictColor(activeEntry.verdicts[i])}`}
                    >
                      {point}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Analyst Take — friendly breakdown */}
          <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ChevronRight className="h-4 w-4 text-sky-400" />
              <h4 className="text-sm font-semibold text-slate-100">
                Plain-English Breakdown
              </h4>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {activeEntry.analystTake}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Transparency footer */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 italic">
          Data sourced from SEC filings. Analysis powered by AI.
        </p>
      </div>
    </div>
  );
}
