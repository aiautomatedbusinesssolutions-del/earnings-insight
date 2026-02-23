// =============================================================================
// Gemini AI client for earnings call analysis
// =============================================================================
// Server-side only — uses GEMINI_API_KEY from environment variables.
// Analyzes earnings data + SEC 8-K filings to produce TruthTranslator entries.
// =============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TruthTranslatorEntry, BrokenPromise } from "@/lib/mockData";

function getApiKey(): string | null {
  const key = process.env.GEMINI_API_KEY;
  const valid = key && key !== "your_key_here" && key.length > 0;
  console.log(`[Gemini] API key check — present: ${!!key}, valid: ${!!valid}, length: ${key?.length ?? 0}`);
  return valid ? key : null;
}

export function isGeminiKeyConfigured(): boolean {
  return getApiKey() !== null;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface BigPictureSummary {
  bigPicture: string;
  brokenPromises: BrokenPromise[];
}

interface QuarterSummaryInput {
  quarter: string;
  epsEstimate: number;
  epsActual: number;
  surprisePercent: number;
  stockReaction: number;
  transparencyScore: number;
}

interface AnalyzeParams {
  ticker: string;
  companyName: string;
  quarter: string;
  earningsDate: string;
  epsEstimate: number;
  epsActual: number;
  surprisePercent: number;
  stockReaction: number;
  filingDescription?: string;
  filingUrl?: string;
}

interface GeminiResponse {
  script: string[];
  reality: string[];
  verdicts: ("delivered" | "partial" | "missed")[];
  analystTake: string;
}

// ---------------------------------------------------------------------------
// Main analysis function
// ---------------------------------------------------------------------------
export async function analyzeEarningsQuarter(
  params: AnalyzeParams
): Promise<TruthTranslatorEntry> {
  const key = getApiKey();
  if (!key) throw new Error("Gemini API key not configured");

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const beat = params.epsActual >= params.epsEstimate;
  const filingContext = params.filingDescription
    ? `\nSEC 8-K Filing context: "${params.filingDescription}"`
    : "";

  const prompt = `You are a mentor talking to a 20-year-old first-time investor. Be warm, direct, and honest. Never talk down to them, but never assume they know Wall Street lingo.

Analyze this earnings quarter for ${params.companyName} (${params.ticker}):

Quarter: ${params.quarter}
Earnings Date: ${params.earningsDate}
EPS Estimate: $${params.epsEstimate.toFixed(2)}
EPS Actual: $${params.epsActual.toFixed(2)}
Surprise: ${params.surprisePercent >= 0 ? "+" : ""}${params.surprisePercent.toFixed(1)}% (${beat ? "BEAT" : "MISS"})
Stock Reaction: ${params.stockReaction >= 0 ? "+" : ""}${params.stockReaction.toFixed(1)}% next day${filingContext}

Return a JSON object with exactly this structure:
{
  "script": [
    "Point 1: What the CEO likely hyped (The Hype) — a bold claim or talking point",
    "Point 2: Another piece of management spin or forward-looking promise",
    "Point 3: A third talking point or guidance claim"
  ],
  "reality": [
    "Point 1: What actually happened (The Truth) — backed by the numbers",
    "Point 2: Another reality check with data",
    "Point 3: THE RED FLAG — the most concerning thing they tried to downplay or hide"
  ],
  "verdicts": ["delivered" or "partial" or "missed", same for point 2, same for point 3],
  "analystTake": "A 3-4 sentence beginner-friendly paragraph. Use 'Probability, Not Certainty' language (likely, potential, historically). Explain what this quarter means for regular investors. Be honest but not alarmist."
}

IMPORTANT RULES:
- "script" must have exactly 3 points (what management WANTS investors to hear)
- "reality" must have exactly 3 points, with the 3rd being the biggest red flag
- "verdicts" must have exactly 3 values, each being "delivered", "partial", or "missed"
- "verdicts" correspond 1:1 with script/reality points
- Use plain English — no financial jargon without explanation
- JARGON BAN: Never use financial jargon (e.g., Year-over-Year, Liquidity, Basis Points, Guidance, Headwinds) without a plain 3-word explanation in parentheses. Example: 'gross margins (profit per dollar)' or 'EPS (earnings per share)'. If a term can't be explained in 3 words, use a simpler word instead.
- Be specific about numbers and percentages when available
- Never promise profit or certainty — use "likely," "potential," "historically"
- The analystTake should feel like a smart friend explaining what happened`;

  console.log(`[Gemini] Sending request for ${params.ticker} ${params.quarter}...`);

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Gemini] API call FAILED: ${msg}`);
    throw new Error(`Gemini API error: ${msg}`);
  }

  const text = result.response.text();
  console.log(`[Gemini] Raw response (first 500 chars): ${text.slice(0, 500)}`);

  let parsed: GeminiResponse;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.warn(`[Gemini] Failed to parse JSON response:`, text.slice(0, 200));
    throw new Error("Gemini returned invalid JSON");
  }

  // Validate structure
  if (
    !Array.isArray(parsed.script) ||
    !Array.isArray(parsed.reality) ||
    !Array.isArray(parsed.verdicts) ||
    typeof parsed.analystTake !== "string" ||
    parsed.script.length !== 3 ||
    parsed.reality.length !== 3 ||
    parsed.verdicts.length !== 3
  ) {
    console.warn(`[Gemini] Response has invalid structure`);
    throw new Error("Gemini returned malformed analysis structure");
  }

  // Validate verdict values
  const validVerdicts = ["delivered", "partial", "missed"];
  const verdicts = parsed.verdicts.map((v) =>
    validVerdicts.includes(v) ? v : "partial"
  ) as ("delivered" | "partial" | "missed")[];

  return {
    quarter: params.quarter,
    date: params.earningsDate,
    script: parsed.script,
    reality: parsed.reality,
    verdicts,
    analystTake: parsed.analystTake,
    filingUrl: params.filingUrl,
  };
}

// ---------------------------------------------------------------------------
// Big Picture summary across all quarters
// ---------------------------------------------------------------------------
interface GeminiBigPictureResponse {
  bigPicture: string;
  brokenPromises: {
    quarter: string;
    promise: string;
    reality: string;
    verdict: "missed" | "partial";
  }[];
}

export async function generateBigPictureSummary(
  ticker: string,
  companyName: string,
  quarters: QuarterSummaryInput[]
): Promise<BigPictureSummary> {
  const key = getApiKey();
  if (!key) throw new Error("Gemini API key not configured");

  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const quarterLines = quarters
    .map((q) => {
      const beat = q.epsActual >= q.epsEstimate;
      return `- ${q.quarter}: EPS est $${q.epsEstimate.toFixed(2)} → actual $${q.epsActual.toFixed(2)} (${beat ? "BEAT" : "MISS"} ${q.surprisePercent >= 0 ? "+" : ""}${q.surprisePercent.toFixed(1)}%), stock ${q.stockReaction >= 0 ? "+" : ""}${q.stockReaction.toFixed(1)}% next day, transparency score ${q.transparencyScore}/100`;
    })
    .join("\n");

  const prompt = `You are a mentor talking to a 20-year-old first-time investor. Be warm, direct, and honest. Never talk down to them, but never assume they know Wall Street lingo.

Based on these ${quarters.length} quarters of earnings data for ${companyName} (${ticker}):

${quarterLines}

Return a JSON object with this exact structure:
{
  "bigPicture": "A 2-3 sentence summary of the overall trend across all quarters. Focus on patterns like improving margins, consistent growth, growing evasiveness, or shifting narratives. Use 'likely,' 'potential,' or 'historically' — never promise profit.",
  "brokenPromises": [
    {
      "quarter": "Q1 2025",
      "promise": "What management likely claimed or implied during this quarter's call",
      "reality": "What the numbers or subsequent quarters actually showed",
      "verdict": "missed" or "partial"
    }
  ]
}

IMPORTANT RULES:
- "bigPicture" must be 2-3 sentences, beginner-friendly, focused on the trend across quarters
- "brokenPromises" should contain 0-3 items — only include clear cases where results contradicted earlier guidance or claims
- Each broken promise "verdict" must be either "missed" (clearly broken) or "partial" (half-kept)
- Use plain English — explain any financial terms
- JARGON BAN: Never use financial jargon (e.g., Year-over-Year, Liquidity, Basis Points, Guidance, Headwinds) without a plain 3-word explanation in parentheses. Example: 'gross margins (profit per dollar)' or 'EPS (earnings per share)'. If a term can't be explained in 3 words, use a simpler word instead.
- Never promise profit or certainty
- If all quarters show consistent beats with no contradictions, "brokenPromises" can be an empty array`;

  console.log(`[Gemini] Sending Big Picture request for ${ticker} (${quarters.length} quarters)...`);

  let result;
  try {
    result = await model.generateContent(prompt);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[Gemini] Big Picture API call FAILED: ${msg}`);
    throw new Error(`Gemini API error: ${msg}`);
  }

  const text = result.response.text();
  console.log(`[Gemini] Big Picture raw response (first 500 chars): ${text.slice(0, 500)}`);

  let parsed: GeminiBigPictureResponse;
  try {
    parsed = JSON.parse(text);
  } catch {
    console.warn(`[Gemini] Failed to parse Big Picture JSON:`, text.slice(0, 200));
    throw new Error("Gemini returned invalid JSON");
  }

  if (typeof parsed.bigPicture !== "string" || !Array.isArray(parsed.brokenPromises)) {
    console.warn(`[Gemini] Big Picture response has invalid structure`);
    throw new Error("Gemini returned malformed Big Picture structure");
  }

  // Validate and sanitize broken promises
  const validVerdicts = ["missed", "partial"];
  const brokenPromises: BrokenPromise[] = parsed.brokenPromises
    .filter(
      (bp) =>
        typeof bp.quarter === "string" &&
        typeof bp.promise === "string" &&
        typeof bp.reality === "string"
    )
    .map((bp) => ({
      quarter: bp.quarter,
      promise: bp.promise,
      reality: bp.reality,
      verdict: validVerdicts.includes(bp.verdict)
        ? (bp.verdict as "missed" | "partial")
        : "partial",
    }));

  return {
    bigPicture: parsed.bigPicture,
    brokenPromises,
  };
}
