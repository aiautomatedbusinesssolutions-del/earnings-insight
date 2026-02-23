"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

interface TransparencyGaugeProps {
  score: number; // 0–100
  companyName: string;
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "Transparent";
  if (score >= 40) return "Cautious";
  return "Evasive";
}

function getScoreHex(score: number): string {
  if (score >= 70) return "#34d399"; // emerald-400
  if (score >= 40) return "#fbbf24"; // amber-400
  return "#fb7185"; // rose-400
}

function getScoreTailwind(score: number): string {
  if (score >= 70) return "text-emerald-400";
  if (score >= 40) return "text-amber-400";
  return "text-rose-400";
}

function getScoreSubtext(score: number, companyName: string): string {
  if (score >= 70)
    return `${companyName}'s CEO historically under-promises and over-delivers.`;
  if (score >= 40)
    return `${companyName}'s CEO mixes optimism with some vague guidance.`;
  return `${companyName}'s CEO frequently overpromises or avoids direct answers.`;
}

// SVG arc gauge constants
const CX = 140; // center x
const CY = 130; // center y
const RADIUS = 100;
const STROKE_WIDTH = 18;
const ARC_START_ANGLE = Math.PI; // 180° (left)
const ARC_END_ANGLE = 0; // 0° (right)

function polarToCartesian(angle: number): { x: number; y: number } {
  return {
    x: CX + RADIUS * Math.cos(angle),
    y: CY - RADIUS * Math.sin(angle),
  };
}

// Build SVG arc path from startAngle to endAngle (radians, going clockwise from left)
function describeArc(startAngle: number, endAngle: number): string {
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const largeArc = startAngle - endAngle > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

// The full semicircle background track
const TRACK_PATH = describeArc(ARC_START_ANGLE, ARC_END_ANGLE);

// Gradient stop positions on the arc (for the colored background)
const GRADIENT_ID = "gaugeGradient";

export default function TransparencyGauge({
  score,
  companyName,
}: TransparencyGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const label = getScoreLabel(score);
  const color = getScoreHex(score);
  const tailwindColor = getScoreTailwind(score);
  const subtext = getScoreSubtext(score, companyName);

  // Needle angle: score 0 = 180° (left), score 100 = 0° (right)
  const needleAngle = Math.PI - (score / 100) * Math.PI;
  const needleTip = polarToCartesian(needleAngle);

  useEffect(() => {
    setAnimatedScore(0);
    const timeout = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timeout);
  }, [score]);

  // Animated needle angle for framer-motion
  const animatedNeedleAngle = Math.PI - (animatedScore / 100) * Math.PI;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 pb-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="h-5 w-5 text-sky-400" />
        <h2 className="text-lg font-semibold text-slate-100">
          CEO Transparency Gauge
        </h2>
      </div>

      {/* SVG Gauge */}
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 280 160" className="w-full max-w-[320px]">
          <defs>
            <linearGradient id={GRADIENT_ID} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#fb7185" /> {/* rose-400 */}
              <stop offset="45%" stopColor="#fbbf24" /> {/* amber-400 */}
              <stop offset="100%" stopColor="#34d399" /> {/* emerald-400 */}
            </linearGradient>
            {/* Glow filter for the needle tip */}
            <filter id="needleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background track (dim) */}
          <path
            d={TRACK_PATH}
            fill="none"
            stroke="#1e293b"
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
          />

          {/* Colored arc (gradient) */}
          <path
            d={TRACK_PATH}
            fill="none"
            stroke={`url(#${GRADIENT_ID})`}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            opacity={0.3}
          />

          {/* Active arc fill — from left edge to current score */}
          {animatedScore > 0 && (
            <motion.path
              d={describeArc(
                ARC_START_ANGLE,
                Math.max(ARC_END_ANGLE, Math.PI - (animatedScore / 100) * Math.PI)
              )}
              fill="none"
              stroke={`url(#${GRADIENT_ID})`}
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          )}

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((tick) => {
            const angle = Math.PI - (tick / 100) * Math.PI;
            const inner = {
              x: CX + (RADIUS - STROKE_WIDTH / 2 - 4) * Math.cos(angle),
              y: CY - (RADIUS - STROKE_WIDTH / 2 - 4) * Math.sin(angle),
            };
            const outer = {
              x: CX + (RADIUS + STROKE_WIDTH / 2 + 4) * Math.cos(angle),
              y: CY - (RADIUS + STROKE_WIDTH / 2 + 4) * Math.sin(angle),
            };
            return (
              <line
                key={tick}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke="#475569"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Needle */}
          <motion.line
            x1={CX}
            y1={CY}
            x2={needleTip.x}
            y2={needleTip.y}
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
            filter="url(#needleGlow)"
            initial={{
              x2: polarToCartesian(Math.PI).x,
              y2: polarToCartesian(Math.PI).y,
            }}
            animate={{
              x2: needleTip.x,
              y2: needleTip.y,
            }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
          />

          {/* Needle center dot */}
          <circle cx={CX} cy={CY} r={6} fill="#0f172a" stroke="#475569" strokeWidth={2} />
          <circle cx={CX} cy={CY} r={3} fill={color} />

          {/* Labels at edges */}
          <text x={CX - RADIUS - 8} y={CY + 20} textAnchor="middle" className="fill-rose-400 text-[10px]">
            Evasive
          </text>
          <text x={CX} y={CY - RADIUS - STROKE_WIDTH / 2 - 8} textAnchor="middle" className="fill-amber-400 text-[10px]">
            Cautious
          </text>
          <text x={CX + RADIUS + 8} y={CY + 20} textAnchor="middle" className="fill-emerald-400 text-[10px]">
            Transparent
          </text>
        </svg>

        {/* Score display */}
        <div className="flex flex-col items-center -mt-2">
          <div className="flex items-baseline gap-1">
            <motion.span
              className={`text-5xl font-bold ${tailwindColor}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              {score}
            </motion.span>
            <span className="text-lg text-slate-500 font-medium">/100</span>
          </div>
          <motion.span
            className={`text-lg font-semibold ${tailwindColor} mt-1`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
          >
            {label}
          </motion.span>
          <motion.p
            className="text-sm text-slate-400 mt-2 text-center leading-relaxed max-w-[260px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            {subtext}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
