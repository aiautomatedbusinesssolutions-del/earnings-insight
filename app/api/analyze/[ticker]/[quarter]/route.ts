import { NextRequest, NextResponse } from "next/server";
import { getEarningsSurprises, getCompanyProfile } from "@/lib/finnhub";
import { getRecentFilings, type EdgarFiling } from "@/lib/edgar";
import { analyzeEarningsQuarter, isGeminiKeyConfigured } from "@/lib/gemini";

// ---------------------------------------------------------------------------
// Find the closest 8-K filing to an earnings date (within ±7 days)
// ---------------------------------------------------------------------------
function findClosestFiling(
  earningsDate: string,
  filings: EdgarFiling[]
): EdgarFiling | null {
  const target = new Date(earningsDate + "T00:00:00").getTime();
  const windowMs = 7 * 24 * 60 * 60 * 1000;

  let closest: EdgarFiling | null = null;
  let closestDist = Infinity;

  for (const filing of filings) {
    const filingTime = new Date(filing.date + "T00:00:00").getTime();
    const dist = Math.abs(filingTime - target);
    if (dist <= windowMs && dist < closestDist) {
      closest = filing;
      closestDist = dist;
    }
  }

  return closest;
}

// ---------------------------------------------------------------------------
// Route handler — GET /api/analyze/[ticker]/[quarter]?stockReaction=-2.1
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string; quarter: string }> }
) {
  const { ticker, quarter } = await params;
  const upperTicker = ticker.toUpperCase();
  const decodedQuarter = decodeURIComponent(quarter);

  const stockReactionParam = request.nextUrl.searchParams.get("stockReaction");
  const stockReaction = stockReactionParam
    ? parseFloat(stockReactionParam)
    : 0;

  console.log(
    `[Analyze] === START: ${upperTicker} ${decodedQuarter} (reaction: ${stockReaction}) ===`
  );

  // Step 1: Check Gemini key
  const geminiReady = isGeminiKeyConfigured();
  console.log(`[Analyze] Step 1 — Gemini key configured: ${geminiReady}`);
  if (!geminiReady) {
    return NextResponse.json(
      { error: "Gemini API key not configured", errorType: "config" },
      { status: 503 }
    );
  }

  try {
    // Step 2: Fetch earnings, profile, and filings in parallel
    console.log(`[Analyze] Step 2 — Fetching Finnhub earnings + profile + EDGAR filings...`);
    const [surprises, profile, filings] = await Promise.all([
      getEarningsSurprises(upperTicker),
      getCompanyProfile(upperTicker),
      getRecentFilings(upperTicker, 10).catch((err) => {
        console.warn(`[Analyze] EDGAR fetch failed:`, err instanceof Error ? err.message : err);
        return null;
      }),
    ]);

    console.log(
      `[Analyze] Step 2 results — earnings: ${surprises?.length ?? "null"}, profile: ${profile?.name ?? "null"}, filings: ${filings?.length ?? "null"}`
    );

    if (!surprises || surprises.length === 0) {
      console.log(`[Analyze] STOP — No earnings data`);
      return NextResponse.json(
        { error: `No earnings data found for ${upperTicker}`, errorType: "data" },
        { status: 404 }
      );
    }

    // Step 3: Find the specific quarter
    const earningsData = surprises.find((s) => s.quarter === decodedQuarter);
    console.log(
      `[Analyze] Step 3 — Quarter match: ${earningsData ? `${earningsData.quarter} (${earningsData.date})` : "NOT FOUND"}`
    );
    console.log(
      `[Analyze] Available quarters: ${surprises.map((s) => s.quarter).join(", ")}`
    );

    if (!earningsData) {
      return NextResponse.json(
        { error: `No data for "${decodedQuarter}". Available: ${surprises.map((s) => s.quarter).join(", ")}`, errorType: "data" },
        { status: 404 }
      );
    }

    // Step 4: Find closest 8-K filing
    const closestFiling = filings
      ? findClosestFiling(earningsData.date, filings)
      : null;

    if (closestFiling) {
      console.log(
        `[Analyze] Step 4 — Matched 8-K: ${closestFiling.date} — "${closestFiling.description}"`
      );
    } else {
      console.log(
        `[Analyze] Step 4 — No 8-K matched within ±7 days of ${earningsData.date}` +
          (filings ? ` (checked ${filings.length} filings)` : " (EDGAR returned null)")
      );
    }

    const companyName = profile?.name || upperTicker;

    // Step 5: Call Gemini
    console.log(`[Analyze] Step 5 — Calling Gemini for ${companyName} ${decodedQuarter}...`);
    const entry = await analyzeEarningsQuarter({
      ticker: upperTicker,
      companyName,
      quarter: decodedQuarter,
      earningsDate: earningsData.date,
      epsEstimate: earningsData.epsEstimate,
      epsActual: earningsData.epsActual,
      surprisePercent: earningsData.surprisePercent,
      stockReaction,
      filingDescription: closestFiling?.description,
      filingUrl: closestFiling?.url,
    });

    console.log(`[Analyze] === SUCCESS: ${upperTicker} ${decodedQuarter} ===`);
    return NextResponse.json(entry);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isGeminiError =
      message.includes("Gemini") ||
      message.includes("GoogleGenerativeAI") ||
      message.includes("API key");
    console.error(`[Analyze] === FAILED: ${message} ===`);
    return NextResponse.json(
      {
        error: message,
        errorType: isGeminiError ? "gemini" : "unknown",
      },
      { status: 500 }
    );
  }
}
