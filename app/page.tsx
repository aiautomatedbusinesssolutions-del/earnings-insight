"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { track } from "@vercel/analytics";
import SearchHeader from "@/components/SearchHeader";
import TransparencyGauge from "@/components/TransparencyGauge";
import TruthTranslator from "@/components/TruthTranslator";
import MasterSummary from "@/components/MasterSummary";
import EducationStation from "@/components/EducationStation";
import type { TickerData, TruthTranslatorEntry, BrokenPromise } from "@/lib/mockData";

// Dynamic import for Recharts-dependent component — prevents SSR webpack errors
const PriceTimeline = dynamic(() => import("@/components/PriceTimeline"), {
  ssr: false,
  loading: () => (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-5 rounded bg-slate-800 animate-pulse" />
        <div className="h-5 w-32 rounded bg-slate-800 animate-pulse" />
      </div>
      <div className="flex-1 min-h-[340px] flex items-center justify-center">
        <div className="text-slate-500 text-sm">Loading chart...</div>
      </div>
    </div>
  ),
});

export default function Home() {
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<Record<string, TruthTranslatorEntry>>({});
  const [analysisErrors, setAnalysisErrors] = useState<Record<string, string>>({});
  const [analyzingQuarters, setAnalyzingQuarters] = useState<Set<string>>(new Set());
  const [aiSummary, setAiSummary] = useState<{ bigPicture: string; brokenPromises: BrokenPromise[] } | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const fetchedRef = useRef<Set<string>>(new Set());
  const aiAnalysisRef = useRef<Record<string, TruthTranslatorEntry>>({});
  const summaryFetchedRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    aiAnalysisRef.current = aiAnalysis;
  }, [aiAnalysis]);

  const fetchAnalysis = useCallback(async (quarter: string) => {
    if (!tickerData || isDemo) return;
    // Skip if already cached or in-flight (use ref to avoid stale closure)
    if (aiAnalysisRef.current[quarter] || fetchedRef.current.has(quarter)) return;
    fetchedRef.current.add(quarter);

    const earningsEntry = tickerData.earnings.find((e) => e.quarter === quarter);
    if (!earningsEntry) return;

    console.log(`[UI] Starting AI analysis for ${quarter}...`);
    setAnalyzingQuarters((prev) => new Set(prev).add(quarter));

    try {
      const res = await fetch(
        `/api/analyze/${encodeURIComponent(tickerData.ticker)}/${encodeURIComponent(quarter)}?stockReaction=${earningsEntry.stockReaction}`
      );

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.errorType === "config"
          ? "AI API key not configured"
          : data.errorType === "gemini"
            ? "The AI is taking a coffee break — try again in 30 seconds."
            : data.errorType === "data"
              ? "Earnings data not found for this quarter"
              : data.error || `Analysis failed (${res.status})`;
        console.warn(`[UI] Analysis failed for ${quarter}: ${errorMsg}`);
        setAnalysisErrors((prev) => ({ ...prev, [quarter]: errorMsg }));
        // Remove from fetchedRef so user can retry
        fetchedRef.current.delete(quarter);
        return;
      }

      console.log(`[UI] AI analysis complete for ${quarter}`);
      setAiAnalysis((prev) => ({ ...prev, [quarter]: data as TruthTranslatorEntry }));
      // Clear any previous error for this quarter
      setAnalysisErrors((prev) => {
        const next = { ...prev };
        delete next[quarter];
        return next;
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      console.warn(`[UI] Network error analyzing ${quarter}:`, msg);
      setAnalysisErrors((prev) => ({ ...prev, [quarter]: `Network error: ${msg}` }));
      fetchedRef.current.delete(quarter);
    } finally {
      setAnalyzingQuarters((prev) => {
        const next = new Set(prev);
        next.delete(quarter);
        return next;
      });
    }
  }, [tickerData, isDemo]);

  // Auto-trigger analysis when selected quarter changes
  useEffect(() => {
    if (!tickerData || isDemo) return;
    const quarter = selectedQuarter ?? tickerData.earnings[tickerData.earnings.length - 1]?.quarter;
    if (quarter) fetchAnalysis(quarter);
  }, [selectedQuarter, tickerData, isDemo, fetchAnalysis]);

  // Fetch Big Picture summary once when live tickerData arrives
  const fetchSummary = useCallback(async () => {
    if (!tickerData || isDemo || summaryFetchedRef.current) return;
    summaryFetchedRef.current = true;

    console.log(`[UI] Starting Big Picture summary for ${tickerData.ticker}...`);
    setSummaryLoading(true);
    setSummaryError(null);

    try {
      const res = await fetch(`/api/summarize/${encodeURIComponent(tickerData.ticker)}`);
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.errorType === "config"
          ? "AI API key not configured"
          : data.errorType === "gemini"
            ? "The AI is taking a coffee break — try again in 30 seconds."
            : data.errorType === "data"
              ? "Earnings data not found"
              : data.error || `Summary failed (${res.status})`;
        console.warn(`[UI] Summary failed: ${errorMsg}`);
        setSummaryError(errorMsg);
        summaryFetchedRef.current = false;
        return;
      }

      console.log(`[UI] Big Picture summary complete for ${tickerData.ticker}`);
      setAiSummary(data as { bigPicture: string; brokenPromises: BrokenPromise[] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      console.warn(`[UI] Summary network error:`, msg);
      setSummaryError(`Network error: ${msg}`);
      summaryFetchedRef.current = false;
    } finally {
      setSummaryLoading(false);
    }
  }, [tickerData, isDemo]);

  // Auto-trigger summary fetch when live data arrives
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Merge AI analysis over placeholder entries
  const mergedEntries = useMemo(() => {
    if (!tickerData) return [];
    return tickerData.truthTranslator.map((entry) =>
      aiAnalysis[entry.quarter] ?? entry
    );
  }, [tickerData, aiAnalysis]);

  // Merge AI summary over placeholder masterSummary
  const mergedSummary = useMemo(() => {
    if (!tickerData) return undefined;
    if (!aiSummary) return tickerData.masterSummary;
    return {
      ...tickerData.masterSummary,
      bigPicture: aiSummary.bigPicture,
      brokenPromises: aiSummary.brokenPromises,
    };
  }, [tickerData, aiSummary]);

  // Currently analyzing quarter for spinner + current error
  const activeQuarterKey = useMemo(() => {
    return selectedQuarter ?? tickerData?.earnings[tickerData.earnings.length - 1]?.quarter ?? null;
  }, [selectedQuarter, tickerData]);

  const currentAnalyzingQuarter = useMemo(() => {
    return activeQuarterKey && analyzingQuarters.has(activeQuarterKey) ? activeQuarterKey : null;
  }, [activeQuarterKey, analyzingQuarters]);

  const currentAnalysisError = useMemo(() => {
    return activeQuarterKey ? analysisErrors[activeQuarterKey] ?? null : null;
  }, [activeQuarterKey, analysisErrors]);

  async function handleSearch(ticker: string) {
    setIsLoading(true);
    setSearchError(null);
    setSelectedQuarter(null);
    setAiAnalysis({});
    setAnalysisErrors({});
    setAnalyzingQuarters(new Set());
    setAiSummary(null);
    setSummaryLoading(false);
    setSummaryError(null);
    fetchedRef.current = new Set();
    aiAnalysisRef.current = {};
    summaryFetchedRef.current = false;

    try {
      const res = await fetch(`/api/ticker/${encodeURIComponent(ticker)}`);
      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.hint
          ? `${data.error}\n${data.hint}`
          : data.error || `No data found for "${ticker}". Try another ticker.`;
        setSearchError(errorMsg);
        // If the response included demo data despite the error status
        if (data.prices) {
          setTickerData(data as TickerData);
          setIsDemo(data.isDemo ?? true);
        }
        return;
      }

      setTickerData(data as TickerData);
      setIsDemo(data.isDemo ?? false);
      track("Ticker Search", { ticker: data.ticker, isDemo: data.isDemo ?? false });
    } catch {
      setSearchError(
        "Network error. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  const handleEarningsSelect = useCallback((quarter: string | null) => {
    setSelectedQuarter(quarter);
  }, []);

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
            isLoading={isLoading}
            isDemo={isDemo}
            error={searchError}
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
              {/* Row 1: Timeline (2/3) + Gauge (1/3) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <PriceTimeline
                    prices={tickerData.prices}
                    earnings={tickerData.earnings}
                    selectedQuarter={selectedQuarter}
                    onEarningsSelect={handleEarningsSelect}
                  />
                </div>
                <div className="lg:col-span-1">
                  <TransparencyGauge
                    score={tickerData.overallTransparencyScore}
                    companyName={tickerData.companyName}
                  />
                </div>
              </div>

              {/* Row 2: Truth-Translator (2/3) + Master Summary (1/3) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <TruthTranslator
                    entries={mergedEntries}
                    selectedQuarter={selectedQuarter}
                    onSelectQuarter={(q) => setSelectedQuarter(q)}
                    analyzingQuarter={currentAnalyzingQuarter}
                    analysisError={currentAnalysisError}
                    onRetryAnalysis={activeQuarterKey ? () => fetchAnalysis(activeQuarterKey) : undefined}
                  />
                </div>
                <div className="lg:col-span-1">
                  <MasterSummary
                    summary={mergedSummary!}
                    companyName={tickerData.companyName}
                    isLoading={summaryLoading}
                    error={summaryError}
                    onRetry={fetchSummary}
                  />
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

        {/* Education Station — always visible at the bottom */}
        <div className="mt-12">
          <EducationStation />
        </div>
      </div>
    </main>
  );
}
