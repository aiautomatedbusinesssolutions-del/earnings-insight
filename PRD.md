# PRD: Earnings Insight

## 1. Project Overview

**Earnings Insight** is a beginner-friendly visual dashboard that bridges the gap between financial earnings data and stock price action. It is part of a suite of 30 standalone finance tools designed to make Wall Street accessible to everyday investors.

The core idea is simple: when a company reports earnings, the stock price often moves in ways that confuse beginners. Earnings Insight explains *why* by translating corporate jargon into plain language, visualizing the gap between expectations and reality, and scoring how transparent a CEO is being on earnings calls.

**Tech Stack:** Next.js + Tailwind CSS + TypeScript, Lucide-React icons, Recharts for data visualization.

**Design System:** Deep Dark Mode (`bg-slate-950`), Traffic Light color palette, Inter font, mobile-first layout. Full guidelines in `CLAUDE.md`.

---

## 2. The Problem

### The Expectation Gap

Beginners constantly ask: *"The company beat earnings — why did the stock drop?"*

This is the **Expectation Gap** — the disconnect between raw financial results and the market's *expectations* for those results. A company can report record revenue and still see its stock fall 10% because analysts expected even more, or because management gave weak guidance for next quarter.

### Corporate Jargon

Earnings calls are filled with phrases like "sequential headwinds," "margin compression," and "synergy realization." These terms are designed for institutional investors and analysts, not for someone trying to understand if their investment is on the right track.

### The Result

Beginners are left with two bad options:
1. **Ignore earnings entirely** and miss critical information about the companies they own.
2. **React emotionally** to price swings they don't understand, often buying high and selling low.

Earnings Insight solves both by making earnings data visual, intuitive, and honest.

---

## 3. The Solution

A single-page visual dashboard with four key components:

1. **CEO Transparency Gauge** — The "Aha! Moment." Within 3 seconds of loading, a user sees a visual meter scoring how evasive or transparent a CEO has been across recent earnings calls. This is the emotional anchor of the app.

2. **Interactive Price Timeline** — A Recharts line chart showing stock price history with **'E' markers** on earnings dates. Clicking a marker reveals a scorecard comparing what analysts expected vs. what the company actually delivered.

3. **AI Truth-Translator** — A plain-language comparison of what the CEO *said* (The Script) vs. what actually *happened* (The Reality). No jargon, no spin — just the facts, explained like a friend would.

4. **Yearly Master Summary** — A high-level overview condensing the last 4 quarters into a single, digestible card with trend indicators.

All AI-generated content includes the disclaimer: *"Data sourced from SEC filings. Analysis powered by AI."*

---

## 4. Core Features

### 4.1 Ticker Search

A persistent search bar at the top of the page, consistent with the suite-wide design pattern.

| Detail | Specification |
|---|---|
| Placement | Top of page, always visible |
| Behavior | Autocomplete with company name + ticker symbol |
| Style | `bg-slate-900`, `border border-slate-800`, `text-slate-100` |
| Icon | Lucide `Search` icon in `text-slate-400` |
| Empty State | Prompt text: *"Search any company — e.g., AAPL, TSLA, MSFT"* |

On submit, the dashboard populates with data for the selected ticker.

---

### 4.2 The Transparency Gauge (Aha! Moment)

The signature visual of Earnings Insight. A semicircular gauge that scores CEO transparency on a scale from **Evasive** to **Transparent**.

| Detail | Specification |
|---|---|
| Type | Semicircular meter / arc gauge |
| Scale | 0 (Evasive) to 100 (Transparent) |
| Color Mapping | 0–39: `text-rose-400` (Evasive), 40–69: `text-amber-400` (Cautious), 70–100: `text-emerald-400` (Transparent) |
| Label | Dynamic label below gauge: "Evasive," "Cautious," or "Transparent" |
| Subtext | Brief one-liner explaining the score, e.g., *"This CEO historically under-promises and over-delivers."* |
| Data Source | Derived from earnings surprise history and guidance accuracy |
| Card Style | `bg-slate-900`, `border border-slate-800` |

**Score Logic (Mock Phase):**
- Compare actual EPS vs. estimated EPS across last 4 quarters.
- Consistent beats with conservative guidance = high transparency score.
- Frequent misses or wildly optimistic guidance = low transparency score.

---

### 4.3 Interactive Earnings Timeline

A Recharts `LineChart` showing historical stock price with earnings events overlaid.

| Detail | Specification |
|---|---|
| Chart Type | `LineChart` (Recharts) |
| X-Axis | Date range (default: 1 year) |
| Y-Axis | Stock price ($) |
| Line Color | `text-sky-400` / `stroke: #38bdf8` |
| Background | `bg-slate-900` card with `border border-slate-800` |
| Earnings Markers | Custom `'E'` dots on the chart at each earnings date |

**'E' Marker Interaction:**

On hover or click, each marker expands a **scorecard tooltip** showing:

| Field | Description | Color Logic |
|---|---|---|
| Quarter | e.g., "Q3 2025" | `text-slate-100` |
| EPS Estimate | What analysts expected | `text-slate-400` |
| EPS Actual | What the company reported | Beat: `text-emerald-400`, Miss: `text-rose-400` |
| Surprise % | Percentage difference | Beat: `text-emerald-400` with `↑`, Miss: `text-rose-400` with `↓` |
| Stock Reaction | Price change in the session after earnings | Positive: `text-emerald-400`, Negative: `text-rose-400` |

---

### 4.4 AI Truth-Translator

A side-by-side (or stacked on mobile) comparison card translating CEO rhetoric into reality.

| Detail | Specification |
|---|---|
| Layout | Two columns: "The Script" vs. "The Reality" |
| Mobile | Stacked vertically |
| Card Style | `bg-slate-900`, `border border-slate-800` |
| Scrollable | `max-h-[400px] overflow-y-auto` for long content |
| Disclaimer | *"Data sourced from SEC filings. Analysis powered by AI."* |

**Content Structure (per quarter):**

**The Script (What the CEO Said):**
- Bullet points of key promises, guidance, and tone from the earnings call transcript.
- Written in plain language. No direct quotes of jargon without explanation.

**The Reality (What Actually Happened):**
- Bullet points comparing each promise to actual results.
- Each bullet uses Traffic Light colors:
  - Delivered: `text-emerald-400`
  - Partially delivered: `text-amber-400`
  - Missed: `text-rose-400`

---

### 4.5 Yearly Master Summary

A single card providing a bird's-eye view of the company's last 4 quarters.

| Detail | Specification |
|---|---|
| Layout | Compact card with key metrics |
| Card Style | `bg-slate-900`, `border border-slate-800` |
| Timeframe | Last 4 quarters |

**Displayed Metrics:**

| Metric | Format |
|---|---|
| Earnings Track Record | e.g., "Beat 3 of 4 quarters" with `text-emerald-400` or `text-rose-400` |
| Average Surprise | e.g., "+4.2% avg" with `↑` arrow |
| Revenue Trend | `↑` or `↓` with Traffic Light color |
| Guidance Accuracy | "Conservative," "Accurate," or "Optimistic" with color coding |
| Overall Sentiment | One-sentence plain-language summary |

---

## 5. Technical Strategy

### Development Philosophy: Mock-First

All features are built and polished using realistic mock data before integrating live APIs. This ensures the UI, interactions, and user experience are fully validated before external dependencies are introduced.

**Phase 1 — Mock Data:**
- Hard-coded JSON files with realistic earnings data for 3–5 popular tickers (AAPL, TSLA, MSFT, AMZN, GOOGL).
- Mock transparency scores, timeline data, and AI summaries.
- Full UI build, interactions, and responsive design.

**Phase 2 — Live API Integration:**

| Data Need | Source | Details |
|---|---|---|
| Earnings Dates | Finnhub `/stock/earnings` | Historical and upcoming earnings dates |
| EPS Estimates & Actuals | Finnhub `/stock/earnings` | Analyst consensus vs. reported EPS |
| Earnings Surprises | Finnhub `/stock/earnings` | Surprise percentage calculation |
| Stock Price History | Finnhub `/stock/candle` | OHLCV data for the price timeline |
| Earnings Call Transcripts | SEC EDGAR API | Full-text transcripts for AI analysis |
| AI Summary Generation | LLM Integration (TBD) | Truth-Translator and sentiment scoring |

**Phase 3 — AI Layer:**
- Integrate an LLM to generate the Truth-Translator summaries from SEC EDGAR transcripts.
- Derive transparency scores from a combination of earnings surprise data and transcript sentiment analysis.

---

## 6. User Flow

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   1. SEARCH TICKER                                  │
│   User types a company name or ticker symbol        │
│   into the search bar at the top of the page.       │
│                                                     │
│                      ↓                              │
│                                                     │
│   2. VIEW TRANSPARENCY GAUGE (Aha! Moment)          │
│   Within 3 seconds, the CEO Transparency Gauge      │
│   loads — an instant, visual answer:                │
│   "Is this CEO straight with investors?"            │
│                                                     │
│                      ↓                              │
│                                                     │
│   3. EXPLORE EARNINGS HISTORY ON CHART              │
│   User scrolls to the interactive price timeline.   │
│   They click 'E' markers to see scorecards:         │
│   "Did the company beat or miss expectations?"      │
│                                                     │
│                      ↓                              │
│                                                     │
│   4. READ AI SUMMARY                                │
│   User reads the Truth-Translator to understand     │
│   what the CEO promised vs. what happened.          │
│   They review the Yearly Master Summary for         │
│   the big picture across 4 quarters.                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Interaction Details:**

| Step | Trigger | Result |
|---|---|---|
| Search | User submits ticker | Dashboard populates with all components |
| Gauge | Page load | Transparency score animates into position |
| Timeline | Click 'E' marker | Scorecard tooltip appears with beat/miss data |
| Truth-Translator | Scroll or tab | Side-by-side comparison loads for selected quarter |
| Master Summary | Always visible | Static card summarizing 4-quarter trend |

---

## 7. Success Criteria

- A beginner can understand whether a company beat or missed earnings within **3 seconds** of searching.
- The Transparency Gauge provides an immediate emotional anchor — no reading required.
- The Truth-Translator eliminates the need to read an actual earnings transcript.
- The app works flawlessly on mobile devices with large, tappable elements.
- All AI-generated content is clearly disclosed with the standard disclaimer.
