# Project Context: 30 Standalone Finance Tools
I am building 30 standalone finance tools for beginners. These will eventually be merged into one hub. Follow these strict guidelines for consistency.

## 1. Tech Stack
- Framework: Next.js + Tailwind CSS + TypeScript
- Icons: Lucide-React
- Charts: Recharts

## 2. Design & Theme
- **Background:** Always use `bg-slate-950` (Deep Dark Mode).
- **Cards:** Use `bg-slate-900` with `border border-slate-800`.
- **Typography:** Standard sans-serif (Inter). Headings: `text-slate-100`, Subtext: `text-slate-400`.
- **Traffic Light Palette:**
  - Success/Buy: `text-emerald-400` / `bg-emerald-500/10`
  - Warning/Wait: `text-amber-400` / `bg-amber-500/10`
  - Danger/Sell: `text-rose-400` / `bg-rose-500/10`
  - Neutral/Info: `text-sky-400` / `bg-sky-500/10`

## 3. Tone & Language (Beginner-First)
- **The "Friend" Test:** No jargon. Explain concepts like a friend would.
- **Probability, Not Certainty:** Use "Likely," "Potential," or "Historically." Never promise profit.
- **Transparency:** AI-generated summaries must include: *"Data sourced from SEC filings. Analysis powered by AI."*

## 4. Components & UI
- **Responsiveness:** Mobile-first, large touch targets.
- **Search:** Consistent ticker search bar at the top.
- **Trend Indicators:** Use `↑` and `↓` arrows with the Traffic Light palette for comparisons.
- **Text Handling:** Long text must use a scrollable container: `max-h-[400px] overflow-y-auto`.

## 5. The "Aha!" Moment
- Every app must have one clear visual (meter, light, or gauge) providing an answer within 3 seconds.
- **For Earnings Insight:** Use a "CEO Transparency Gauge" (Evasive vs. Transparent).
