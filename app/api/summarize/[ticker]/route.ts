import { NextRequest, NextResponse } from "next/server";
import { getEarningsSurprises, getCompanyProfile } from "@/lib/finnhub";
import { getPolygonPrices } from "@/lib/polygon";
import { generateBigPictureSummary, isGeminiKeyConfigured } from "@/lib/gemini";
import { computeStockReaction, deriveTransparencyScore } from "@/lib/earnings-utils";
import { getCached, setCache } from "@/lib/cache";
import type { DailyPrice, BrokenPromise } from "@/lib/mockData";

// ---------------------------------------------------------------------------
// Route handler — GET /api/summarize/[ticker]
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const upperTicker = ticker.toUpperCase();

  console.log(`[Summary] === START: ${upperTicker} ===`);

  // Step 1: Check Gemini key
  const geminiReady = isGeminiKeyConfigured();
  console.log(`[Summary] Step 1 — Gemini key configured: ${geminiReady}`);
  if (!geminiReady) {
    return NextResponse.json(
      { error: "Gemini API key not configured", errorType: "config" },
      { status: 503 }
    );
  }

  try {
    // Step 2: Fetch earnings + profile + prices in parallel
    console.log(`[Summary] Step 2 — Fetching Finnhub earnings + profile + Polygon prices...`);
    const [surprises, profile, candles] = await Promise.all([
      getEarningsSurprises(upperTicker),
      getCompanyProfile(upperTicker),
      getPolygonPrices(upperTicker).catch((err) => {
        console.warn(`[Summary] Polygon fetch failed:`, err instanceof Error ? err.message : err);
        return null;
      }),
    ]);

    console.log(
      `[Summary] Step 2 results — earnings: ${surprises?.length ?? "null"}, profile: ${profile?.name ?? "null"}, prices: ${candles ? "yes" : "null"}`
    );

    if (!surprises || surprises.length === 0) {
      console.log(`[Summary] STOP — No earnings data`);
      return NextResponse.json(
        { error: `No earnings data found for ${upperTicker}`, errorType: "data" },
        { status: 404 }
      );
    }

    // Step 3: Build price list for stock reaction computation
    const prices: DailyPrice[] = candles
      ? candles.dates.map((date, i) => ({
          date,
          close: Math.round(candles.closes[i] * 100) / 100,
        }))
      : [];

    // Step 4: Map quarters for Gemini
    const sorted = [...surprises].sort((a, b) => a.date.localeCompare(b.date));
    const quarters = sorted.map((s) => ({
      quarter: s.quarter,
      epsEstimate: s.epsEstimate,
      epsActual: s.epsActual,
      surprisePercent: s.surprisePercent,
      stockReaction: prices.length > 0 ? computeStockReaction(s.date, prices) : 0,
      transparencyScore: deriveTransparencyScore(s.surprisePercent),
    }));

    const companyName = profile?.name || upperTicker;

    // Step 5: Check cache before calling Gemini
    const cacheKey = `summary:${upperTicker}`;
    const cached = getCached<{ bigPicture: string; brokenPromises: BrokenPromise[] }>(cacheKey);

    if (cached) {
      console.log(`[Cache] HIT — ${cacheKey}`);
      console.log(`[Summary] === SUCCESS (cached): ${upperTicker} ===`);
      return NextResponse.json(cached);
    }

    console.log(`[Cache] MISS — ${cacheKey}`);
    console.log(
      `[Summary] Step 3 — Calling Gemini Big Picture for ${companyName} (${quarters.length} quarters)...`
    );

    const summary = await generateBigPictureSummary(
      upperTicker,
      companyName,
      quarters
    );

    setCache(cacheKey, summary);
    console.log(`[Summary] === SUCCESS: ${upperTicker} ===`);
    return NextResponse.json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isGeminiError =
      message.includes("Gemini") ||
      message.includes("GoogleGenerativeAI") ||
      message.includes("API key");
    console.error(`[Summary] === FAILED: ${message} ===`);
    return NextResponse.json(
      {
        error: message,
        errorType: isGeminiError ? "gemini" : "unknown",
      },
      { status: 500 }
    );
  }
}
