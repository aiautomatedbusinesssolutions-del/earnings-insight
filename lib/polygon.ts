// =============================================================================
// Polygon.io API utilities — Price data
// =============================================================================
// Server-side only — never import this file in client components.
// Uses POLYGON_API_KEY from environment variables.
// =============================================================================

const BASE_URL = "https://api.polygon.io";

export interface CandleData {
  dates: string[]; // YYYY-MM-DD
  closes: number[];
}

function getApiKey(): string | null {
  const key = process.env.POLYGON_API_KEY;
  const valid = !!key && key !== "your_key_here";
  console.log(`[Polygon] API Key detected: ${valid} (length: ${key?.length ?? 0})`);
  if (!valid) return null;
  return key;
}

export function isPolygonKeyConfigured(): boolean {
  return getApiKey() !== null;
}

/**
 * Fetch ~1 year of daily candle data for a ticker from Polygon.io.
 */
export async function getPolygonPrices(
  ticker: string
): Promise<CandleData | null> {
  const key = getApiKey();
  if (!key) return null;

  const to = new Date();
  const from = new Date();
  from.setFullYear(from.getFullYear() - 1);

  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];

  const url = `${BASE_URL}/v2/aggs/ticker/${encodeURIComponent(ticker)}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&apiKey=${key}`;

  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[Polygon] Prices ${res.status}: ${text}`);
    throw new Error(`Polygon prices error (${res.status}): ${text || res.statusText}`);
  }

  const data = await res.json();
  console.log(
    `[Polygon] Prices response — status: "${data.status}", count: ${data.resultsCount ?? 0}`
  );

  if (!data.results || data.results.length === 0) return null;

  const dates: string[] = [];
  const closes: number[] = [];

  for (const bar of data.results) {
    if (bar.t == null || bar.c == null) continue;
    const d = new Date(bar.t); // Polygon returns Unix ms timestamps
    dates.push(d.toISOString().split("T")[0]);
    closes.push(bar.c);
  }

  if (dates.length === 0) return null;

  return { dates, closes };
}
