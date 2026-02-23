// =============================================================================
// Gemini AI client for earnings call analysis
// =============================================================================
// Server-side only — uses GEMINI_API_KEY from environment variables.
// Analyzes earnings data + SEC 8-K filings to produce TruthTranslator entries.
// =============================================================================

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { TruthTranslatorEntry } from "@/lib/mockData";

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

  const prompt = `You are a friendly financial analyst explaining earnings results to beginners. No jargon — talk like a smart friend would.

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
