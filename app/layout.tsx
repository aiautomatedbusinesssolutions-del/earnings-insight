import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Earnings Insight — Understand What Moves the Stock",
  description:
    "A beginner-friendly dashboard that bridges the gap between financial earnings data and stock price action.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100 antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
