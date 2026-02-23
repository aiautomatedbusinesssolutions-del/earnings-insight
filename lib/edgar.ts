// =============================================================================
// SEC EDGAR API utilities
// =============================================================================
// Fetches 8-K filing links from the SEC EDGAR full-text search API.
// Server-side only — no API key required (EDGAR is public).
// =============================================================================

const EDGAR_SEARCH_URL = "https://efts.sec.gov/LATEST/search-index";
const EDGAR_FILINGS_URL = "https://data.sec.gov/submissions";

// SEC requires a User-Agent header identifying the requester (Fair Access Policy)
const FALLBACK_USER_AGENT = "EarningsInsight/1.0 (not-configured)";

function getUserAgent(): string {
  const ua = process.env.SEC_USER_AGENT;
  if (!ua || ua.includes("REPLACE_WITH_YOUR_EMAIL")) {
    console.warn(
      "[EDGAR] WARNING: SEC_USER_AGENT is not configured. " +
        "Set it in .env.local with your real email to comply with SEC Fair Access Policy. " +
        "Example: SEC_USER_AGENT=EarningsInsight/1.0 (you@example.com)"
    );
    return FALLBACK_USER_AGENT;
  }
  return ua;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface EdgarFiling {
  date: string; // YYYY-MM-DD
  form: string; // e.g. "8-K"
  description: string;
  url: string; // Link to the filing on SEC.gov
  accessionNumber: string;
}

interface EdgarSubmissionsResponse {
  cik: string;
  entityType: string;
  name: string;
  tickers: string[];
  filings: {
    recent: {
      accessionNumber: string[];
      filingDate: string[];
      form: string[];
      primaryDocument: string[];
      primaryDocDescription: string[];
    };
  };
}

// ---------------------------------------------------------------------------
// CIK lookup: ticker -> CIK number (SEC's internal ID)
// ---------------------------------------------------------------------------
async function getCik(ticker: string): Promise<string | null> {
  const url = `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=&CIK=${encodeURIComponent(ticker)}&type=8-K&dateb=&owner=include&count=1&search_text=&action=getcompany&output=atom`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": getUserAgent() },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;

    const text = await res.text();
    // Extract CIK from the atom feed
    const cikMatch = text.match(/CIK=(\d+)/);
    return cikMatch ? cikMatch[1] : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Exported API functions
// ---------------------------------------------------------------------------

/**
 * Fetch recent 8-K filings (earnings-related) for a ticker from SEC EDGAR.
 * Returns the latest filings with direct links.
 */
export async function getRecentFilings(
  ticker: string,
  limit: number = 4
): Promise<EdgarFiling[] | null> {
  try {
    // Try the company tickers JSON lookup first
    const tickerLookupRes = await fetch(
      "https://www.sec.gov/files/company_tickers.json",
      {
        headers: { "User-Agent": getUserAgent() },
        next: { revalidate: 86400 },
      }
    );

    if (!tickerLookupRes.ok) return null;

    const tickerData: Record<
      string,
      { cik_str: number; ticker: string; title: string }
    > = await tickerLookupRes.json();

    // Find the CIK for this ticker
    const upperTicker = ticker.toUpperCase();
    let cik: string | null = null;

    for (const entry of Object.values(tickerData)) {
      if (entry.ticker === upperTicker) {
        cik = String(entry.cik_str).padStart(10, "0");
        break;
      }
    }

    if (!cik) {
      // Fallback to search-based CIK lookup
      cik = await getCik(ticker);
      if (cik) cik = cik.padStart(10, "0");
    }

    if (!cik) return null;

    // Fetch submissions for this CIK
    const submissionsUrl = `${EDGAR_FILINGS_URL}/CIK${cik}.json`;
    const subRes = await fetch(submissionsUrl, {
      headers: { "User-Agent": getUserAgent() },
      next: { revalidate: 3600 },
    });

    if (!subRes.ok) return null;

    const submissions: EdgarSubmissionsResponse = await subRes.json();
    const recent = submissions.filings?.recent;
    if (!recent) return null;

    // Filter for 8-K filings (earnings announcements)
    const filings: EdgarFiling[] = [];
    for (let i = 0; i < recent.form.length && filings.length < limit; i++) {
      if (recent.form[i] === "8-K") {
        const accession = recent.accessionNumber[i].replace(/-/g, "");
        filings.push({
          date: recent.filingDate[i],
          form: recent.form[i],
          description:
            recent.primaryDocDescription[i] || "Form 8-K Filing",
          url: `https://www.sec.gov/Archives/edgar/data/${cik.replace(/^0+/, "")}/${accession}/${recent.primaryDocument[i]}`,
          accessionNumber: recent.accessionNumber[i],
        });
      }
    }

    return filings.length > 0 ? filings : null;
  } catch {
    return null;
  }
}
