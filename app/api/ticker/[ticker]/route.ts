import { NextRequest, NextResponse } from "next/server";
import {
  getEarningsSurprises,
  getCompanyProfile,
  isApiKeyConfigured as isFinnhubKeyConfigured,
} from "@/lib/finnhub";
import {
  getPolygonPrices,
  isPolygonKeyConfigured,
} from "@/lib/polygon";
import { getRecentFilings } from "@/lib/edgar";
import { computeStockReaction, deriveTransparencyScore } from "@/lib/earnings-utils";
import type {
  TickerData,
  DailyPrice,
  EarningsEvent,
  TruthTranslatorEntry,
  MasterSummary,
} from "@/lib/mockData";
import { getTickerData as getMockData } from "@/lib/mockData";

// ---------------------------------------------------------------------------
// Helpers: map Finnhub data to our component shapes
// ---------------------------------------------------------------------------

function mapPrices(
  dates: string[],
  closes: number[]
): DailyPrice[] {
  return dates.map((date, i) => ({
    date,
    close: Math.round(closes[i] * 100) / 100,
  }));
}

function deriveOverallTransparency(earnings: EarningsEvent[]): number {
  if (earnings.length === 0) return 50;
  const avg =
    earnings.reduce((sum, e) => sum + e.transparencyScore, 0) /
    earnings.length;
  return Math.round(avg);
}

/**
 * Build placeholder TruthTranslator entries for live tickers.
 * Real AI analysis will come in a future phase.
 */
function buildPlaceholderTruthTranslator(
  earnings: EarningsEvent[]
): TruthTranslatorEntry[] {
  return earnings.map((e) => {
    const beat = e.epsActual >= e.epsEstimate;
    const bigMove = Math.abs(e.stockReaction) > 3;
    return {
      quarter: e.quarter,
      date: e.date,
      script: [
        `Management discussed ${e.quarter} results during the earnings call.`,
        beat
          ? "The company highlighted areas of strength and positive momentum."
          : "The company acknowledged headwinds while emphasizing long-term strategy.",
        "Forward guidance was provided for the upcoming quarter.",
      ],
      reality: [
        beat
          ? `EPS came in at $${e.epsActual.toFixed(2)}, beating the $${e.epsEstimate.toFixed(2)} estimate by ${e.surprisePercent.toFixed(1)}%.`
          : `EPS came in at $${e.epsActual.toFixed(2)}, missing the $${e.epsEstimate.toFixed(2)} estimate by ${Math.abs(e.surprisePercent).toFixed(1)}%.`,
        bigMove
          ? `The stock moved ${e.stockReaction > 0 ? "up" : "down"} ${Math.abs(e.stockReaction).toFixed(1)}% the next day — a significant reaction.`
          : `The stock moved ${e.stockReaction > 0 ? "up" : "down"} ${Math.abs(e.stockReaction).toFixed(1)}% the next day — a muted reaction.`,
        "Full transcript analysis will be available when AI processing is enabled.",
      ],
      verdicts: [
        beat ? "delivered" : "missed",
        bigMove && !beat ? "missed" : beat ? "delivered" : "partial",
        "partial",
      ] as ("delivered" | "partial" | "missed")[],
      analystTake: beat
        ? `${e.quarter} was a solid quarter. The company beat Wall Street's EPS estimate by ${e.surprisePercent.toFixed(1)}%, which suggests management set the bar conservatively. The stock ${e.stockReaction >= 0 ? "reacted positively" : "still dipped afterward, which could mean the beat was already priced in or guidance disappointed"}. Full AI-powered transcript analysis will provide deeper insight into what management said vs. what the numbers actually show.`
        : `${e.quarter} was a rough one. The company missed EPS estimates by ${Math.abs(e.surprisePercent).toFixed(1)}%, and the stock ${e.stockReaction < 0 ? `dropped ${Math.abs(e.stockReaction).toFixed(1)}%` : "held relatively steady"} in response. When a company misses, the key question is always: did they see it coming? Full AI-powered transcript analysis will reveal whether management's tone on the call hinted at trouble or if they tried to paint a rosier picture.`,
    };
  });
}

/**
 * Build a MasterSummary from earnings data.
 */
function buildMasterSummary(
  earnings: EarningsEvent[],
  companyName: string
): MasterSummary {
  const beatCount = earnings.filter(
    (e) => e.epsActual >= e.epsEstimate
  ).length;
  const missCount = earnings.length - beatCount;
  const avgSurprise =
    earnings.length > 0
      ? earnings.reduce((s, e) => s + e.surprisePercent, 0) / earnings.length
      : 0;

  // Determine transparency trend from score progression
  const scores = earnings.map((e) => e.transparencyScore);
  const firstHalf =
    scores.slice(0, Math.ceil(scores.length / 2)).reduce((a, b) => a + b, 0) /
    Math.ceil(scores.length / 2);
  const secondHalf =
    scores
      .slice(Math.ceil(scores.length / 2))
      .reduce((a, b) => a + b, 0) /
    Math.floor(scores.length / 2);

  let transparencyTrend: string;
  let transparencyTrendDirection: "up" | "down" | "flat";
  if (secondHalf > firstHalf + 5) {
    transparencyTrend = "Improving Transparency";
    transparencyTrendDirection = "up";
  } else if (secondHalf < firstHalf - 5) {
    transparencyTrend = "Growing Evasiveness";
    transparencyTrendDirection = "down";
  } else {
    transparencyTrend = "Holding Steady";
    transparencyTrendDirection = "flat";
  }

  // Revenue trend from earnings data (simplified — from EPS trajectory)
  const epsValues = earnings.map((e) => e.epsActual);
  const revenueTrend: "up" | "down" | "flat" =
    epsValues.length >= 2
      ? epsValues[epsValues.length - 1] > epsValues[0]
        ? "up"
        : epsValues[epsValues.length - 1] < epsValues[0]
          ? "down"
          : "flat"
      : "flat";

  const guidanceAccuracy: "Conservative" | "Accurate" | "Optimistic" =
    avgSurprise > 2
      ? "Conservative"
      : avgSurprise >= -1
        ? "Accurate"
        : "Optimistic";

  return {
    bigPicture: `Over the last ${earnings.length} quarters, ${companyName} beat earnings estimates ${beatCount} time${beatCount !== 1 ? "s" : ""} and missed ${missCount} time${missCount !== 1 ? "s" : ""}. The average surprise was ${avgSurprise >= 0 ? "+" : ""}${avgSurprise.toFixed(1)}%. ${beatCount > missCount ? "This suggests the company tends to set conservative expectations, which is generally a positive signal for transparency." : "The mix of beats and misses suggests investors should pay close attention to management commentary for signs of evolving guidance accuracy."} Full AI-powered analysis of earnings call transcripts will be available in a future update.`,
    transparencyTrend,
    transparencyTrendDirection,
    brokenPromises: [],
    beatCount,
    missCount,
    avgSurprise: Math.round(avgSurprise * 100) / 100,
    revenueTrend,
    guidanceAccuracy,
  };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const upperTicker = ticker.toUpperCase();

  // If either API key isn't configured, return mock data with demo flag
  if (!isFinnhubKeyConfigured() || !isPolygonKeyConfigured()) {
    console.log(`[API] Keys — Finnhub: ${isFinnhubKeyConfigured()}, Polygon: ${isPolygonKeyConfigured()}`);
    const mock = getMockData(upperTicker);
    if (mock) {
      return NextResponse.json({ ...mock, isDemo: true });
    }
    return NextResponse.json(
      { error: "API keys not configured and no mock data available", isDemo: true },
      { status: 503 }
    );
  }

  try {
    console.log(`[API] Fetching live data for ${upperTicker}...`);

    // Fetch all data in parallel — Polygon for prices, Finnhub for earnings/profile
    const [candles, surprises, profile, filings] = await Promise.all([
      getPolygonPrices(upperTicker),
      getEarningsSurprises(upperTicker),
      getCompanyProfile(upperTicker),
      getRecentFilings(upperTicker).catch(() => null), // EDGAR is optional
    ]);

    console.log(`[API] Results — candles: ${!!candles}, surprises: ${surprises?.length ?? "null"}, profile: ${!!profile}`);

    // If Finnhub returned nothing useful, fall back to mock
    if (!candles || !surprises || surprises.length === 0) {
      console.log(`[API] Insufficient data for ${upperTicker}, checking mock...`);
      const mock = getMockData(upperTicker);
      if (mock) {
        return NextResponse.json({ ...mock, isDemo: true });
      }
      return NextResponse.json(
        { error: `No earnings data found for "${upperTicker}". Make sure you're using a stock ticker symbol (e.g., NVDA not Nvidia).` },
        { status: 404 }
      );
    }

    // Map price candles
    const prices = mapPrices(candles.dates, candles.closes);

    // Map earnings surprises to our EarningsEvent shape
    const earnings: EarningsEvent[] = surprises
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => ({
        quarter: s.quarter,
        date: s.date,
        epsEstimate: s.epsEstimate,
        epsActual: s.epsActual,
        surprisePercent: s.surprisePercent,
        revenueEstimate: 0, // Finnhub free tier doesn't include revenue estimates
        revenueActual: 0,
        stockReaction: computeStockReaction(s.date, prices),
        transparencyScore: deriveTransparencyScore(s.surprisePercent),
      }));

    const companyName = profile?.name || upperTicker;
    const sector = profile?.sector || "Unknown";

    const tickerData: TickerData & { isDemo: boolean; filings?: unknown } = {
      ticker: upperTicker,
      companyName,
      sector,
      overallTransparencyScore: deriveOverallTransparency(earnings),
      prices,
      earnings,
      truthTranslator: buildPlaceholderTruthTranslator(earnings),
      masterSummary: buildMasterSummary(earnings, companyName),
      yearlySummary: {
        beatCount: earnings.filter((e) => e.epsActual >= e.epsEstimate).length,
        missCount: earnings.filter((e) => e.epsActual < e.epsEstimate).length,
        avgSurprise:
          Math.round(
            (earnings.reduce((s, e) => s + e.surprisePercent, 0) /
              earnings.length) *
              100
          ) / 100,
        revenueTrend: "flat" as const,
        guidanceAccuracy: "Accurate" as const,
        overallSentiment: `${companyName} reported ${earnings.length} quarters of earnings data.`,
      },
      isDemo: false,
      filings: filings || undefined,
    };

    return NextResponse.json(tickerData);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[API] Error for ${upperTicker}: ${message}`);

    // Surface the real error — don't silently fall back to mock
    return NextResponse.json(
      {
        error: `API error: ${message}`,
        hint: "Check your FINNHUB_API_KEY and POLYGON_API_KEY in .env.local.",
      },
      { status: 502 }
    );
  }
}
