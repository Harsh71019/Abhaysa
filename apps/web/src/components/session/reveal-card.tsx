"use client";

import { type ReactElement } from "react";
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

interface RevealCardProps {
  card: Card;
  revealed: boolean;
  onReveal: () => void;
  onGrade: (grade: ReviewGrade) => void;
}

export function RevealCard({ card, revealed, onReveal, onGrade }: RevealCardProps): ReactElement {
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
          </div>

          {/* Middle Content */}
          <div className="flex-1 flex flex-col justify-center items-center py-6 text-center">
            <CardMarkdown>{card.front}</CardMarkdown>
          </div>

          {/* Bottom Prompt */}
          <div className="flex flex-col items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-ping" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/40 font-board">
              Tap Card to Reveal
            </span>
          </div>
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
              Recall Rating
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
