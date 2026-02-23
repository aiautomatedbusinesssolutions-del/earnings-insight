// =============================================================================
// Mock Data for Earnings Insight — AAPL (Apple Inc.)
// =============================================================================
// Realistic placeholder data for mock-first development.
// Covers: 1 year of daily prices, 4 quarterly earnings, Truth-Translator content,
// and Master Summary with Broken Promise Tracker.
// =============================================================================

export interface DailyPrice {
  date: string; // YYYY-MM-DD
  close: number;
}

export interface EarningsEvent {
  quarter: string; // e.g. "Q1 2025"
  date: string; // YYYY-MM-DD (earnings report date)
  epsEstimate: number;
  epsActual: number;
  surprisePercent: number;
  revenueEstimate: number; // in billions
  revenueActual: number; // in billions
  stockReaction: number; // % change in next session
  transparencyScore: number; // 0–100
}

export interface TruthTranslatorEntry {
  quarter: string;
  date: string; // YYYY-MM-DD
  script: string[]; // CEO promises / talking points
  reality: string[]; // What actually happened
  verdicts: ("delivered" | "partial" | "missed")[]; // 1:1 with script/reality
  analystTake: string; // Friendly long-form explanation for beginners
}

export interface BrokenPromise {
  quarter: string;
  promise: string;
  reality: string;
  verdict: "missed" | "partial";
}

export interface MasterSummary {
  bigPicture: string; // Long-form 12-month synthesis (friendly analyst tone)
  transparencyTrend: string; // e.g. "Growing Evasiveness" or "Consistently Transparent"
  transparencyTrendDirection: "up" | "down" | "flat";
  brokenPromises: BrokenPromise[];
  beatCount: number;
  missCount: number;
  avgSurprise: number;
  revenueTrend: "up" | "down" | "flat";
  guidanceAccuracy: "Conservative" | "Accurate" | "Optimistic";
}

export interface TickerData {
  ticker: string;
  companyName: string;
  sector: string;
  overallTransparencyScore: number; // 0–100 aggregate
  prices: DailyPrice[];
  earnings: EarningsEvent[];
  truthTranslator: TruthTranslatorEntry[];
  masterSummary: MasterSummary;
  // Keep legacy shape for backwards compat
  yearlySummary: {
    beatCount: number;
    missCount: number;
    avgSurprise: number;
    revenueTrend: "up" | "down" | "flat";
    guidanceAccuracy: "Conservative" | "Accurate" | "Optimistic";
    overallSentiment: string;
  };
}

// ---------------------------------------------------------------------------
// Helper: generate 1 year of daily prices with realistic movement
// ---------------------------------------------------------------------------
function generateDailyPrices(
  startDate: string,
  startPrice: number,
  days: number,
  earningsDates: { date: string; reaction: number }[]
): DailyPrice[] {
  const prices: DailyPrice[] = [];
  let price = startPrice;
  const start = new Date(startDate);

  const earningsMap = new Map(earningsDates.map((e) => [e.date, e.reaction]));

  for (let i = 0; i < days; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);

    // Skip weekends
    const day = current.getDay();
    if (day === 0 || day === 6) continue;

    const dateStr = current.toISOString().split("T")[0];

    // Apply earnings reaction if this is an earnings date
    const earningsReaction = earningsMap.get(dateStr);
    if (earningsReaction !== undefined) {
      price = price * (1 + earningsReaction / 100);
    } else {
      // Normal daily movement: slight upward bias with volatility
      const dailyChange = (Math.random() - 0.48) * 2.5;
      price = price * (1 + dailyChange / 100);
    }

    prices.push({
      date: dateStr,
      close: Math.round(price * 100) / 100,
    });
  }

  return prices;
}

// ---------------------------------------------------------------------------
// AAPL Mock Data
// ---------------------------------------------------------------------------
const aaplEarnings: EarningsEvent[] = [
  {
    quarter: "Q1 2025",
    date: "2025-01-30",
    epsEstimate: 2.35,
    epsActual: 2.4,
    surprisePercent: 2.1,
    revenueEstimate: 124.1,
    revenueActual: 124.3,
    stockReaction: 1.8,
    transparencyScore: 78,
  },
  {
    quarter: "Q2 2025",
    date: "2025-05-01",
    epsEstimate: 1.61,
    epsActual: 1.65,
    surprisePercent: 2.5,
    revenueEstimate: 94.5,
    revenueActual: 95.4,
    stockReaction: 3.2,
    transparencyScore: 82,
  },
  {
    quarter: "Q3 2025",
    date: "2025-07-31",
    epsEstimate: 1.35,
    epsActual: 1.4,
    surprisePercent: 3.7,
    revenueEstimate: 85.2,
    revenueActual: 85.8,
    stockReaction: -2.1,
    transparencyScore: 65,
  },
  {
    quarter: "Q4 2025",
    date: "2025-10-30",
    epsEstimate: 1.88,
    epsActual: 1.82,
    surprisePercent: -3.2,
    revenueEstimate: 89.3,
    revenueActual: 87.1,
    stockReaction: -5.4,
    transparencyScore: 42,
  },
];

const aaplTruthTranslator: TruthTranslatorEntry[] = [
  {
    quarter: "Q1 2025",
    date: "2025-01-30",
    script: [
      "Services revenue continues to hit all-time highs, showing the strength of our ecosystem.",
      "We're seeing strong demand for iPhone 16 across all markets.",
      "Our AI integration with Apple Intelligence will be a growth driver for years to come.",
    ],
    reality: [
      "Services revenue grew 14% — a genuine all-time high, backed by 1B+ paid subscriptions.",
      "iPhone revenue was roughly flat year-over-year. 'Strong demand' masked slowing upgrades in China.",
      "Apple Intelligence launched to mixed reviews. Siri improvements were delayed to a later update.",
    ],
    verdicts: ["delivered", "partial", "partial"],
    analystTake:
      "Here's the deal with Q1: Apple's services business is genuinely crushing it — subscriptions, App Store revenue, iCloud, all hitting records. That part is real. But when Tim Cook says 'strong demand' for iPhone, take it with a grain of salt. Revenue was basically flat, which means people aren't upgrading as fast as before, especially in China. And the AI story? It's more of a promise than a reality right now. They launched Apple Intelligence, but even Apple fans said it felt half-baked. Overall, this was a decent quarter wrapped in slightly rosy language.",
  },
  {
    quarter: "Q2 2025",
    date: "2025-05-01",
    script: [
      "Greater China is recovering and we're optimistic about our trajectory there.",
      "iPad and Mac saw strong double-digit growth thanks to the M4 chip lineup.",
      "We expect continued momentum across all product categories.",
    ],
    reality: [
      "China revenue grew 3% — technically 'recovering' but far behind India's 20%+ growth rate.",
      "iPad revenue surged 21% and Mac grew 16%. The M4 refresh genuinely drove upgrades.",
      "Wearables revenue declined for the 3rd straight quarter, contradicting 'all categories' momentum.",
    ],
    verdicts: ["partial", "delivered", "missed"],
    analystTake:
      "Q2 was a mixed bag that Apple tried to paint as all green. The honest highlight? iPad and Mac were legitimately great — the M4 chip refresh gave people a real reason to upgrade, and the numbers prove it. But here's where the spin comes in: calling China 'recovering' when it only grew 3% is generous at best. India is where the real growth is happening. And the biggest red flag? When they said 'all product categories' are doing well, Wearables had actually declined for the third quarter in a row. That's not momentum — that's a trend in the wrong direction. The CEO knows Wall Street doesn't always check the fine print.",
  },
  {
    quarter: "Q3 2025",
    date: "2025-07-31",
    script: [
      "We're investing heavily in AI infrastructure and expect it to differentiate us this holiday season.",
      "Our gross margin expansion reflects operational efficiency and premium positioning.",
      "Developer adoption of Apple Intelligence APIs is exceeding our expectations.",
    ],
    reality: [
      "AI infrastructure spend increased 40%, but no concrete product launches were announced for holiday.",
      "Gross margins did expand to 46.3% — a legitimate multi-year high.",
      "Only 12% of top App Store apps had integrated Apple Intelligence APIs at the time of the call.",
    ],
    verdicts: ["partial", "delivered", "missed"],
    analystTake:
      "This is where things started getting a bit slippery. Apple is absolutely spending big on AI — that 40% increase is real money. But saying it'll 'differentiate them by the holidays' without announcing a single specific product? That's a hope, not a plan. The margin story is legitimately impressive though — 46.3% gross margins means Apple is making more profit on every dollar of revenue than almost any time in history. The developer adoption claim is the one that raised eyebrows: 'exceeding expectations' sounds amazing until you learn only 12% of top apps actually used the tools. Either their expectations were very low, or this was some creative storytelling.",
  },
  {
    quarter: "Q4 2025",
    date: "2025-10-30",
    script: [
      "iPhone 16 cycle is performing in line with our expectations.",
      "We see significant long-term opportunity in Vision Pro and spatial computing.",
      "Our capital return program remains the largest in corporate history.",
    ],
    reality: [
      "iPhone revenue missed estimates by $1.8B. 'In line with expectations' hid a meaningful shortfall vs. Wall Street's numbers.",
      "Vision Pro sales were cut by 50% per supply chain reports. Most retail demos were discontinued.",
      "The buyback program is real — $25B returned in Q4. This claim was fully accurate.",
    ],
    verdicts: ["missed", "missed", "delivered"],
    analystTake:
      "Q4 is where the trust took a real hit. When the CEO says iPhone is 'in line with expectations,' whose expectations? Not Wall Street's — they missed by almost $2 billion. That phrase is a classic move: set your own bar low enough and you can always clear it. The Vision Pro comment might be the most disconnected from reality. Saying you see 'significant long-term opportunity' while your supply chain is literally cutting orders in half and stores are removing demo units? That's not optimism, that's denial. The one genuine moment was the buyback — $25 billion returned to shareholders is a fact, not spin. But one honest statement out of three doesn't make for a transparent earnings call.",
  },
];

const aaplMasterSummary: MasterSummary = {
  bigPicture:
    "Apple had a solid first three quarters of 2025 — consistently beating estimates on the back of its services powerhouse and the M4 chip refresh. But the story shifted hard in Q4. The iPhone 16 cycle didn't deliver like Wall Street expected, China growth stayed sluggish, and Vision Pro went from 'the future' to a question mark. Meanwhile, the CEO's language got noticeably vaguer as the year went on. Early-year calls were specific and backed by data. By Q4, it was 'in line with expectations' and 'long-term opportunity' — the kind of phrases companies use when they don't want to talk about the present. The services business is the rock here: growing, profitable, and honestly communicated. Everything else? Read between the lines.",
  transparencyTrend: "Growing Evasiveness",
  transparencyTrendDirection: "down",
  brokenPromises: [
    {
      quarter: "Q3 2025",
      promise:
        "Tim Cook said AI would 'differentiate Apple by the holiday season' and that developer adoption was 'exceeding expectations.'",
      reality:
        "No major AI product shipped for the holidays. Only 12% of top apps adopted Apple Intelligence APIs. The holiday quarter (Q4) ended with an iPhone revenue miss.",
      verdict: "missed",
    },
    {
      quarter: "Q1 2025",
      promise:
        "Apple claimed 'strong demand for iPhone 16 across all markets' during the Q1 call.",
      reality:
        "iPhone revenue was flat year-over-year in Q1 and progressively worsened through the year, culminating in a $1.8B miss in Q4.",
      verdict: "partial",
    },
  ],
  beatCount: 3,
  missCount: 1,
  avgSurprise: 1.28,
  revenueTrend: "up",
  guidanceAccuracy: "Conservative",
};

const aaplPrices = generateDailyPrices("2025-01-02", 243.5, 365, [
  { date: "2025-01-30", reaction: 1.8 },
  { date: "2025-05-01", reaction: 3.2 },
  { date: "2025-07-31", reaction: -2.1 },
  { date: "2025-10-30", reaction: -5.4 },
]);

export const AAPL_DATA: TickerData = {
  ticker: "AAPL",
  companyName: "Apple Inc.",
  sector: "Technology",
  overallTransparencyScore: 67,
  prices: aaplPrices,
  earnings: aaplEarnings,
  truthTranslator: aaplTruthTranslator,
  masterSummary: aaplMasterSummary,
  yearlySummary: {
    beatCount: 3,
    missCount: 1,
    avgSurprise: 1.28,
    revenueTrend: "up",
    guidanceAccuracy: "Conservative",
    overallSentiment:
      "Apple beat expectations in 3 of 4 quarters this year. The Q4 miss broke a long streak and raised questions about iPhone demand, but the services business remains a reliable growth engine.",
  },
};

// ---------------------------------------------------------------------------
// Ticker lookup map (expandable for future tickers)
// ---------------------------------------------------------------------------
export const MOCK_TICKERS: Record<string, TickerData> = {
  AAPL: AAPL_DATA,
};

export function getTickerData(ticker: string): TickerData | undefined {
  return MOCK_TICKERS[ticker.toUpperCase()];
}

export function getAvailableTickers(): string[] {
  return Object.keys(MOCK_TICKERS);
}
