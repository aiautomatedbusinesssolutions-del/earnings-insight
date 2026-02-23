// =============================================================================
// Finnhub API utilities
// =============================================================================
// Server-side only — never import this file in client components.
// Uses FINNHUB_API_KEY from environment variables.
// =============================================================================

const BASE_URL = "https://finnhub.io/api/v1";

function getApiKey(): string | null {
  const key = process.env.FINNHUB_API_KEY;
  const valid = !!key && key !== "your_key_here";
  console.log(`[Finnhub] API Key detected: ${valid} (length: ${key?.length ?? 0})`);
  if (!valid) return null;
  return key;
}

// ---------------------------------------------------------------------------
// Types matching Finnhub response shapes
// ---------------------------------------------------------------------------
interface FinnhubEarning {
  actual: number;
  estimate: number;
  period: string; // "YYYY-MM-DD"
  quarter: number; // 1–4
  surprise: number;
  surprisePercent: number;
  symbol: string;
  year: number;
}

interface FinnhubProfile {
  country: string;
  currency: string;
  exchange: string;
  finnhubIndustry: string;
  ipo: string;
  logo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
}

// ---------------------------------------------------------------------------
// Exported return types
// ---------------------------------------------------------------------------
export interface EarningsSurprise {
  quarter: string; // "Q1 2025"
  date: string; // YYYY-MM-DD
  epsEstimate: number;
  epsActual: number;
  surprisePercent: number;
  year: number;
  quarterNum: number;
}

export interface CompanyProfile {
  name: string;
  sector: string;
  ticker: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Fetch the last 4 quarters of earnings surprises for a ticker.
 */
export async function getEarningsSurprises(
  ticker: string
): Promise<EarningsSurprise[] | null> {
  const key = getApiKey();
  if (!key) return null;

  const url = `${BASE_URL}/stock/earnings?symbol=${encodeURIComponent(ticker)}&limit=4&token=${key}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[Finnhub] Earnings ${res.status}: ${text}`);
    throw new Error(`Finnhub earnings error (${res.status}): ${text || res.statusText}`);
  }

  const data: FinnhubEarning[] = await res.json();
  console.log(`[Finnhub] Earnings results: ${Array.isArray(data) ? data.length : "not an array"}`);

  if (!Array.isArray(data) || data.length === 0) return null;

  return data.map((e) => ({
    quarter: `Q${e.quarter} ${e.year}`,
    date: e.period,
    epsEstimate: e.estimate,
    epsActual: e.actual,
    surprisePercent: e.surprisePercent,
    year: e.year,
    quarterNum: e.quarter,
  }));
}

/**
 * Fetch company profile (name, sector) for a ticker.
 */
export async function getCompanyProfile(
  ticker: string
): Promise<CompanyProfile | null> {
  const key = getApiKey();
  if (!key) return null;

  const url = `${BASE_URL}/stock/profile2?symbol=${encodeURIComponent(ticker)}&token=${key}`;

  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[Finnhub] Profile ${res.status}: ${text}`);
    throw new Error(`Finnhub profile error (${res.status}): ${text || res.statusText}`);
  }

  const data: FinnhubProfile = await res.json();
  console.log(`[Finnhub] Profile for ${ticker}: name="${data.name || "(empty)"}"`);

  if (!data.name) return null;

  return {
    name: data.name,
    sector: data.finnhubIndustry || "Unknown",
    ticker: data.ticker || ticker.toUpperCase(),
  };
}

/**
 * Check if the Finnhub API key is configured and valid.
 */
export function isApiKeyConfigured(): boolean {
  return getApiKey() !== null;
}
