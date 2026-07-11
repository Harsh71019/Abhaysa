"use client";

import { useEffect, useState, type ReactElement } from "react";
import { motion } from "motion/react";
import type { Card, ReviewGrade } from "@local/shared";
import { 
  PILLAR_BORDER_CLASS, 
  PILLAR_GLOW_CLASS, 
  PILLAR_BG_COLOR, 
  PILLAR_TEXT_COLOR, 
  PILLAR_LABELS 
} from "@/lib/pillar-colors";
import { CardMarkdown } from "./card-markdown";
import { GradeBar } from "./grade-bar";

const COUNTDOWN_SECONDS = 60;

interface ArticulateCardProps {
  card: Card;
  revealed: boolean;
  onReveal: () => void;
  onGrade: (grade: ReviewGrade) => void;
}

export function ArticulateCard({ card, revealed, onReveal, onGrade }: ArticulateCardProps): ReactElement {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);

  useEffect(() => {
    if (revealed) {
      return;
    }
    setSecondsLeft(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((seconds) => (seconds > 0 ? seconds - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [revealed, card._id]);

  const minutes = Math.floor(secondsLeft / 60);
  const secondsStr = (secondsLeft % 60).toString().padStart(2, "0");

  // Circular timer config
  const radius = 32;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = secondsLeft / COUNTDOWN_SECONDS;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Time warning states (pulse red below 15s)
  const isWarning = secondsLeft <= 15;
  const timerColorClass = isWarning ? "stroke-signal-stop" : "stroke-accent";
  const timerTextClass = isWarning ? "text-signal-stop animate-pulse" : "text-foreground";

  return (
    <div className="perspective-1000 w-full min-h-[480px] relative">
      <motion.div
        className="preserve-3d w-full h-full min-h-[480px] relative"
        animate={{ rotateY: revealed ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
      >
        {/* ── FRONT FACE ── */}
        <div
          role="button"
          tabIndex={0}
          onClick={onReveal}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onReveal();
            }
          }}
          className={`backface-hidden absolute inset-0 w-full h-full flex flex-col justify-between rounded-[24px] border p-7 glass-card cursor-pointer select-none active:scale-[0.99] transition-transform ${PILLAR_BORDER_CLASS[card.pillar]} ${PILLAR_GLOW_CLASS[card.pillar]}`}
        >
          {/* Top Pillar Tag */}
          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-current/10 ${PILLAR_BG_COLOR[card.pillar]} ${PILLAR_TEXT_COLOR[card.pillar]} font-board`}>
              {PILLAR_LABELS[card.pillar]}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/45 font-board">
              Articulate Challenge
            </span>
          </div>

          {/* Middle Content */}
          <div className="flex-1 flex flex-col justify-center items-center py-5 text-center gap-6">
            <CardMarkdown>{card.front}</CardMarkdown>

            {/* Circular Timer Ring */}
            <div className="relative flex h-20 w-20 items-center justify-center">
              <svg className="h-full w-full -rotate-90">
                {/* Background Circle */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className="stroke-border fill-transparent"
                  strokeWidth={strokeWidth}
                />
                {/* Active Progress Circle */}
                <circle
                  cx="40"
                  cy="40"
                  r={radius}
                  className={`fill-transparent transition-all duration-1000 ${timerColorClass}`}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Central text clock */}
              <div className={`absolute flex flex-col items-center ${timerTextClass}`}>
                <span className="font-mono text-sm font-bold tracking-wider tabular-nums leading-none">
                  {minutes}:{secondsStr}
                </span>
                <span className="text-[7px] font-bold uppercase tracking-widest text-foreground/30 font-board mt-0.5">
                  secs left
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Action Prompt */}
          <button
            type="button"
            className="group min-h-[48px] w-full rounded-2xl bg-accent text-white font-board text-xs font-semibold uppercase tracking-[0.1em] shadow-[0_4px_16px_rgba(99,102,241,0.2)] group-hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)] transition-all duration-300 pointer-events-none flex items-center justify-center gap-2"
          >
            <span>Reveal Model Answer</span>
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
        </div>

        {/* ── BACK FACE ── */}
        <div
          className={`backface-hidden absolute inset-0 w-full h-full flex flex-col justify-between rounded-[24px] border p-7 glass-card rotate-y-180 ${PILLAR_BORDER_CLASS[card.pillar]} ${PILLAR_GLOW_CLASS[card.pillar]}`}
        >
          {/* Top Pillar Tag */}
          <div className="flex justify-between items-center">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-current/10 ${PILLAR_BG_COLOR[card.pillar]} ${PILLAR_TEXT_COLOR[card.pillar]} font-board`}>
              {PILLAR_LABELS[card.pillar]}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/45 font-board">
              Evaluation
            </span>
          </div>

          {/* Middle Scrollable Content */}
          <div className="flex-1 flex flex-col relative max-h-[320px] min-h-0">
            <div className="scroller-container flex-1 flex flex-col scrollbar-thin py-2">
              <div className="scroll-indicator-top" />
              
              <div className="px-1 flex-1">
                {/* Soft Original Question */}
                <div className="text-[14px] opacity-40 font-sans line-clamp-2 leading-relaxed">
                  {card.front}
                </div>
                
                {/* Border Divider */}
                <div className="border-t border-border my-4" />
                
                {/* Model Answer */}
                <div className="text-foreground leading-relaxed">
                  <CardMarkdown>{card.back}</CardMarkdown>
                </div>
              </div>
              
              <div className="scroll-indicator-bottom" />
            </div>
          </div>

          {/* Bottom Grading Bar */}
          <div className="pt-4 border-t border-border">
            <GradeBar onGrade={onGrade} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
