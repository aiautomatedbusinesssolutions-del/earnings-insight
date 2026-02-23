"use client";

import { useState } from "react";
import { GraduationCap, ChevronDown, BookOpen, Search, FileText } from "lucide-react";

function AccordionItem({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-slate-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-800/40 transition-colors"
      >
        {icon}
        <span className="text-sm font-medium text-slate-200 flex-1">
          {title}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1 text-sm text-slate-400 leading-relaxed">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EducationStation() {
  return (
    <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <GraduationCap className="h-5 w-5 text-sky-400" />
        <h2 className="text-lg font-semibold text-slate-100">
          Education Station
        </h2>
      </div>

      {/* Featured card — The Expectation Gap */}
      <div className="bg-slate-950/60 border border-amber-500/20 rounded-xl p-5 md:p-6 space-y-4">
        <h3 className="text-base font-semibold text-amber-400">
          The Expectation Gap: Why &ldquo;Good&rdquo; Isn&rsquo;t Always Enough
        </h3>

        <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
          <p>
            Imagine a student who gets 100% on every test. One day they score 92% —
            still a great grade, right? But their parents are{" "}
            <span className="text-amber-400 font-medium">disappointed</span>,
            because they expected perfection.
          </p>
          <p>
            Stocks work the same way. Before earnings day, Wall Street analysts
            make predictions (called &ldquo;estimates&rdquo;) for how much money
            a company will make. If a company earns $1.50 per share but analysts
            expected $1.60, the stock can{" "}
            <span className="text-rose-400 font-medium">drop</span> — even though
            $1.50 is a good number on its own.
          </p>
          <p>
            That gap between what was <em>expected</em> and what actually
            happened is the{" "}
            <span className="text-sky-400 font-medium">
              Expectation Gap
            </span>
            . It&rsquo;s the single biggest reason stocks jump or crash after
            earnings — and it&rsquo;s what the &ldquo;Surprise %&rdquo; number
            in this app measures.
          </p>
        </div>
      </div>

      {/* Earnings 101 Accordion */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
          Earnings 101
        </h3>

        <div className="space-y-2">
          <AccordionItem
            icon={<BookOpen className="h-4 w-4 text-sky-400 shrink-0" />}
            title='What is an Earnings Report? (The "Corporate Report Card")'
          >
            <p>
              Every 3 months, public companies have to show their homework.
              They release an &ldquo;earnings report&rdquo; — basically a
              report card showing how much money they made, how much they spent,
              and whether business is getting better or worse.
            </p>
            <p className="mt-2">
              Investors watch these closely because the numbers reveal the{" "}
              <em>real</em> story behind the headlines. Did the company actually
              grow, or are they just spinning a good narrative?
            </p>
          </AccordionItem>

          <AccordionItem
            icon={<Search className="h-4 w-4 text-sky-400 shrink-0" />}
            title="Decoding the Translator: How Our AI Reads Between the Lines"
          >
            <p>
              When a company reports earnings, the CEO gets on a call with
              analysts and talks about how great everything is going. Our AI
              scans the official SEC 8-K filing — the legally-required document
              companies file with the government — and compares what executives{" "}
              <em>said</em> to what the <em>numbers</em> show.
            </p>
            <p className="mt-2">
              Think of it like a fact-checker for corporate promises. If the CEO
              says &ldquo;growth is accelerating&rdquo; but revenue is actually
              slowing down, the AI flags that mismatch so you can see it clearly.
            </p>
          </AccordionItem>

          <AccordionItem
            icon={<FileText className="h-4 w-4 text-sky-400 shrink-0" />}
            title="Jargon Cheat Sheet"
          >
            <div className="space-y-3">
              <div>
                <span className="text-sky-400 font-medium">Revenue</span>
                <span className="text-slate-500 mx-1.5">—</span>
                The total money a company brings in from selling its products or services
                (before paying any bills).
              </div>
              <div>
                <span className="text-sky-400 font-medium">Net Income</span>
                <span className="text-slate-500 mx-1.5">—</span>
                The money left over after paying <em>all</em> the bills — rent,
                salaries, taxes, everything. This is the real profit.
              </div>
              <div>
                <span className="text-sky-400 font-medium">EPS (Earnings Per Share)</span>
                <span className="text-slate-500 mx-1.5">—</span>
                Net income divided by the number of shares. It tells you how much
                profit the company made <em>for each share you own</em>.
              </div>
            </div>
          </AccordionItem>
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-slate-600 italic">
        Education content is for learning purposes only — not financial advice.
      </p>
    </section>
  );
}
