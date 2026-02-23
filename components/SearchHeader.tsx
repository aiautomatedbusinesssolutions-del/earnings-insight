"use client";

import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";
import { getAvailableTickers } from "@/lib/mockData";

interface SearchHeaderProps {
  onSearch: (ticker: string) => void;
  currentTicker: string | null;
}

export default function SearchHeader({
  onSearch,
  currentTicker,
}: SearchHeaderProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const available = getAvailableTickers();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (!ticker) return;

    if (!available.includes(ticker)) {
      setError(
        `"${ticker}" isn't available yet. Try: ${available.join(", ")}`
      );
      return;
    }

    setError(null);
    onSearch(ticker);
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Search any company — e.g., AAPL, TSLA, MSFT"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3.5 pl-12 pr-28 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Search
        </button>
      </form>

      {/* Feedback */}
      {error && (
        <p className="mt-2 text-sm text-rose-400">{error}</p>
      )}
      {!error && currentTicker && (
        <p className="mt-2 text-sm text-slate-400">
          Showing results for{" "}
          <span className="text-slate-100 font-medium">{currentTicker}</span>
        </p>
      )}
    </div>
  );
}
