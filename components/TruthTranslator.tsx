"use client";

import type { TruthTranslatorEntry } from "@/lib/mockData";

interface TruthTranslatorProps {
  entries: TruthTranslatorEntry[];
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

export default function TruthTranslator({ entries }: TruthTranslatorProps) {
  // TODO: Implement quarter selector tabs
  // TODO: Implement side-by-side layout (stacked on mobile)

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-1">
        AI Truth-Translator
      </h2>
      <p className="text-sm text-slate-400 mb-4">
        What the CEO said vs. what actually happened.
      </p>

      {/* Content placeholder with scrollable container */}
      <div className="max-h-[400px] overflow-y-auto space-y-6">
        {entries.map((entry) => (
          <div key={entry.quarter} className="space-y-3">
            <h3 className="text-md font-medium text-slate-100">
              {entry.quarter}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* The Script */}
              <div>
                <h4 className="text-sm font-semibold text-sky-400 mb-2">
                  The Script
                </h4>
                <ul className="space-y-2">
                  {entry.script.map((point, i) => (
                    <li key={i} className="text-sm text-slate-300">
                      &bull; {point}
                    </li>
                  ))}
                </ul>
              </div>
              {/* The Reality */}
              <div>
                <h4 className="text-sm font-semibold text-slate-100 mb-2">
                  The Reality
                </h4>
                <ul className="space-y-2">
                  {entry.reality.map((point, i) => (
                    <li
                      key={i}
                      className={`text-sm ${getVerdictColor(entry.verdicts[i])}`}
                    >
                      &bull; {point}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 mt-4 italic">
        Data sourced from SEC filings. Analysis powered by AI.
      </p>
    </div>
  );
}
