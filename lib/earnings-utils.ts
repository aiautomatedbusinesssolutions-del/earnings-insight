import type { DailyPrice } from "@/lib/mockData";
import type { EdgarFiling } from "@/lib/edgar";

// ---------------------------------------------------------------------------
// Shared earnings helpers — extracted from route files to eliminate duplication
// ---------------------------------------------------------------------------

/**
 * Compute the stock price reaction (% change) on or near an earnings date.
 * Finds the closest price before and after the earnings date.
 */
export function computeStockReaction(
  earningsDate: string,
  prices: DailyPrice[]
): number {
  const idx = prices.findIndex((p) => p.date >= earningsDate);
  if (idx <= 0 || idx >= prices.length - 1) return 0;

  const before = prices[idx - 1].close;
  const after = prices[Math.min(idx + 1, prices.length - 1)].close;
  return Math.round(((after - before) / before) * 10000) / 100;
}

/**
 * Derive a transparency score from earnings surprise data.
 * Consistent small beats = high transparency (conservative guidance).
 * Big misses = low transparency.
 */
export function deriveTransparencyScore(surprisePercent: number): number {
  if (surprisePercent >= 5) return 85;
  if (surprisePercent >= 2) return 75;
  if (surprisePercent >= 0) return 65;
  if (surprisePercent >= -2) return 45;
  return 30;
}

/**
 * Find the closest 8-K filing to an earnings date (within +/-7 days).
 */
export function findClosestFiling(
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
