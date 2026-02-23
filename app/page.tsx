"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SearchHeader from "@/components/SearchHeader";
import TransparencyGauge from "@/components/TransparencyGauge";
import PriceTimeline from "@/components/PriceTimeline";
import TruthTranslator from "@/components/TruthTranslator";
import SummaryCard from "@/components/SummaryCard";
import { getTickerData, type TickerData } from "@/lib/mockData";

export default function Home() {
  const [tickerData, setTickerData] = useState<TickerData | null>(null);

  function handleSearch(ticker: string) {
    const data = getTickerData(ticker);
    if (data) {
      setTickerData(data);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 lg:px-12">
        {/* App header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100 tracking-tight">
            Earnings Insight
          </h1>
          <p className="text-slate-400 text-sm md:text-base mt-1">
            Understand what moves the stock after earnings — no jargon, just
            clarity.
          </p>
        </div>

        {/* Search bar */}
        <div className="mb-8">
          <SearchHeader
            onSearch={handleSearch}
            currentTicker={tickerData?.ticker ?? null}
          />
        </div>

        {/* Dashboard */}
        <AnimatePresence mode="wait">
          {tickerData ? (
            <motion.div
              key={tickerData.ticker}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="space-y-6"
            >
              {/* Primary row: Timeline (2/3) + Gauge (1/3) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column — 66% — Price Timeline */}
                <div className="lg:col-span-2">
                  <PriceTimeline
                    prices={tickerData.prices}
                    earnings={tickerData.earnings}
                  />
                </div>

                {/* Right column — 33% — Gauge (Aha! Moment) is prominent */}
                <div className="lg:col-span-1">
                  <TransparencyGauge
                    score={tickerData.overallTransparencyScore}
                    companyName={tickerData.companyName}
                  />
                </div>
              </div>

              {/* Secondary row: Summary + Truth-Translator */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column — Truth-Translator (wider) */}
                <div className="lg:col-span-2">
                  <TruthTranslator entries={tickerData.truthTranslator} />
                </div>

                {/* Right column — Yearly Summary */}
                <div className="lg:col-span-1">
                  <SummaryCard {...tickerData.yearlySummary} />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6">
                <svg
                  className="w-8 h-8 text-slate-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                  />
                </svg>
              </div>
              <p className="text-slate-400 text-lg font-medium">
                Search for a company to get started
              </p>
              <p className="text-slate-600 text-sm mt-2">
                Try{" "}
                <button
                  onClick={() => handleSearch("AAPL")}
                  className="text-sky-400 hover:text-sky-300 font-medium transition-colors"
                >
                  AAPL
                </button>{" "}
                to see Apple&apos;s earnings breakdown
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
