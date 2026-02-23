"use client";

import { useState, type FormEvent } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchHeaderProps {
  onSearch: (ticker: string) => void;
  currentTicker: string | null;
  isLoading?: boolean;
  isDemo?: boolean;
  error?: string | null;
}

export default function SearchHeader({
  onSearch,
  currentTicker,
  isLoading = false,
  isDemo = false,
  error = null,
}: SearchHeaderProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (!ticker || isLoading) return;
    onSearch(ticker);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        {isLoading ? (
          <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-sky-400 animate-spin pointer-events-none" />
        ) : (
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter a ticker symbol — e.g., AAPL, TSLA, MSFT, NVDA"
          disabled={isLoading}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-12 pr-28 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "Search"}
        </button>
      </form>

      {/* Feedback row */}
      <div className="flex items-center gap-3 mt-2 min-h-[20px]">
        {error && (
          <div className="text-sm text-rose-400 whitespace-pre-line">{error}</div>
        )}
        {!error && currentTicker && (
          <p className="text-sm text-slate-400">
            Showing results for{" "}
            <span className="text-slate-100 font-medium">{currentTicker}</span>
          </p>
        )}
        {isDemo && currentTicker && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            DEMO MODE
          </span>
        )}
      </div>
    </div>
  );
}
