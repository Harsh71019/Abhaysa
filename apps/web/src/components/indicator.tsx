"use client";

import { useEffect, useState, type ReactElement } from "react";
import { motion } from "motion/react";
import type { PackBundle } from "@local/shared";

interface IndicatorProps {
  pack: PackBundle;
  onBoardNow: () => void;
}

export function Indicator({ pack, onBoardNow }: IndicatorProps): ReactElement {
  // Safe layout mounting logic
  const [mounted, setMounted] = useState(false);
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, "0");
    const mm = now.getMinutes().toString().padStart(2, "0");
    setFormattedTime(`${hh}:${mm}`);
  }, []);

  const totalCards = pack.cards.length;
  const estTime = pack.estMinutes;
  
  // Fake some progress values for demonstration/dashboard aesthetic
  const completedCards = 0; 
  const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

  // SVG Circular progress configs
  const radius = 45;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completionRate / 100) * circumference;

  return (
    <div className="relative flex w-full max-w-md flex-col items-center">
      {/* ── Floating Background Ambient Glows (Only visible if mounted to prevent mismatch) ── */}
      {mounted && (
        <div className="absolute inset-0 -z-10 overflow-visible pointer-events-none">
          <div className="absolute -top-12 -left-16 h-72 w-72 rounded-full bg-indigo-500/10 blur-[80px] animate-float-1" />
          <div className="absolute -bottom-16 -right-12 h-72 w-72 rounded-full bg-cyan-500/10 blur-[80px] animate-float-2" />
        </div>
      )}

      {/* ── Main Dashboard Container (native CSS starting-style transition) ── */}
      <div className="w-full rounded-[28px] glass-card p-7 flex flex-col gap-6 dashboard-entrance">
        {/* Header Row */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex flex-col">
            <span className="font-board text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
              {pack.leg === "morning" ? "Morning Route" : "Evening Route"}
            </span>
            <h1 className="text-xl font-bold tracking-tight text-foreground font-board mt-0.5">
              Abhyasa
            </h1>
          </div>
          {mounted && (
            <div className="flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-accent border border-accent/10">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <span className="font-mono text-xs font-semibold tracking-wider tabular-nums">
                {formattedTime}
              </span>
            </div>
          )}
        </div>

        {/* Circular Progress & Info Section */}
        <div className="flex items-center gap-6 py-2">
          {/* SVG Progress Circle */}
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <svg className="h-full w-full -rotate-90">
              {/* Background Circle */}
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-border fill-transparent"
                strokeWidth={strokeWidth}
              />
              {/* Progress Circle */}
              <motion.circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-accent fill-transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-bold font-board tracking-tighter text-foreground tabular-nums">
                {completionRate}%
              </span>
              <span className="text-[9px] font-medium uppercase tracking-wider text-foreground/40 font-board">
                done
              </span>
            </div>
          </div>

          {/* Stats Text */}
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-foreground font-board leading-tight">
              {pack.theme}
            </h2>
            <p className="text-xs text-foreground/60 leading-relaxed font-sans">
              Dive into your daily prep pack. You have <strong className="font-semibold text-foreground">{totalCards} cards</strong> scheduled.
            </p>
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1 text-[11px] font-medium text-foreground/50 font-board">
                <svg className="h-3.5 w-3.5 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{totalCards} Cards</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-foreground/50 font-board">
                <svg className="h-3.5 w-3.5 stroke-current fill-none" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span>{estTime} Min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Streak Badge Section */}
        <div className="flex items-center justify-between rounded-2xl bg-surface/50 border border-border p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber/10 text-amber animate-pulse">
              {/* Flame SVG Icon */}
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground font-board">
                14 Day Streak
              </span>
              <span className="text-[10px] text-foreground/50 font-sans">
                On-time train records
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-signal-go bg-signal-go/10 px-2.5 py-1 rounded-full border border-signal-go/10 font-board">
            On Time
          </span>
        </div>

        {/* Start Button */}
        <button
          type="button"
          onClick={onBoardNow}
          className="relative group overflow-hidden min-h-[56px] w-full rounded-2xl bg-accent text-white font-board text-sm font-semibold uppercase tracking-[0.1em] shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_24px_rgba(99,102,241,0.4)] transition-all duration-300 transform active:scale-[0.98] hover:translate-y-[-1px] cursor-pointer flex items-center justify-center gap-2"
        >
          {/* Hover Glow Layer */}
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span>Start Commute Prep</span>
          <svg 
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
