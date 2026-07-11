"use client";

import { useState, type ReactElement } from "react";
import { motion } from "motion/react";
import type { Card } from "@local/shared";
import { 
  PILLAR_BORDER_CLASS, 
  PILLAR_GLOW_CLASS, 
  PILLAR_BG_COLOR, 
  PILLAR_TEXT_COLOR, 
  PILLAR_LABELS 
} from "@/lib/pillar-colors";
import { CardMarkdown } from "./card-markdown";

interface QuizCardProps {
  card: Card;
  onAnswered: (isCorrect: boolean) => void;
  onContinue: () => void;
}

export function QuizCard({ card, onAnswered, onContinue }: QuizCardProps): ReactElement {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const quiz = card.quiz;

  if (!quiz) {
    return (
      <div className="rounded-[24px] border border-signal-stop/20 bg-signal-stop/5 p-6 text-center text-sm text-signal-stop font-board">
        Malformed quiz card: missing quiz payload.
      </div>
    );
  }

  const handleSelect = (index: number): void => {
    if (selectedIndex !== null) {
      return;
    }
    setSelectedIndex(index);
    onAnswered(index === quiz.correctIndex);
  };

  return (
    <div
      className={`flex min-h-[480px] flex-col justify-between rounded-[24px] border p-7 glass-card ${PILLAR_BORDER_CLASS[card.pillar]} ${PILLAR_GLOW_CLASS[card.pillar]}`}
    >
      {/* Top Pillar Tag */}
      <div className="flex justify-between items-center pb-2">
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-current/10 ${PILLAR_BG_COLOR[card.pillar]} ${PILLAR_TEXT_COLOR[card.pillar]} font-board`}>
          {PILLAR_LABELS[card.pillar]}
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-foreground/45 font-board">
          Multiple Choice
        </span>
      </div>

      {/* Question section */}
      <div className="flex-1 flex flex-col justify-center gap-6 py-4">
        <div className="text-foreground font-sans">
          <CardMarkdown>{card.front}</CardMarkdown>
        </div>

        {/* Options grid */}
        <div className="flex flex-col gap-2.5">
          {quiz.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const isCorrectOption = index === quiz.correctIndex;
            
            // Modern option button classes
            let optionStyles = "border-border bg-surface/50 hover:bg-surface hover:border-foreground/20 text-foreground/80";
            if (selectedIndex !== null) {
              if (isCorrectOption) {
                optionStyles = "border-signal-go/40 bg-signal-go/5 text-signal-go font-semibold shadow-[0_0_12px_rgba(16,185,129,0.06)]";
              } else if (isSelected) {
                optionStyles = "border-signal-stop/40 bg-signal-stop/5 text-signal-stop font-semibold shadow-[0_0_12px_rgba(239,68,68,0.06)]";
              } else {
                optionStyles = "border-border/30 bg-surface/20 text-foreground/30 opacity-70";
              }
            }

            return (
              <div key={option} className="flex flex-col">
                <button
                  type="button"
                  disabled={selectedIndex !== null}
                  onClick={() => handleSelect(index)}
                  className={`group relative flex min-h-[52px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left font-sans text-[14px] leading-snug transition-all duration-200 active:scale-[0.99] cursor-pointer ${optionStyles}`}
                >
                  <span className="flex-1 pr-3">{option}</span>
                  
                  {/* Status Indicator Icon */}
                  {selectedIndex !== null && (
                    <div className="flex shrink-0 items-center justify-center">
                      {isCorrectOption ? (
                        <svg className="h-4.5 w-4.5 text-signal-go" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : isSelected ? (
                        <svg className="h-4.5 w-4.5 text-signal-stop" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      ) : null}
                    </div>
                  )}
                </button>

                {/* Smooth explanation slide in (native CSS starting-style transition) */}
                <div 
                  className="quiz-explanation" 
                  hidden={selectedIndex === null || !isSelected}
                >
                  <div className="rounded-xl bg-accent-soft border border-accent/15 px-4 py-2.5 text-[12px] text-foreground/75 leading-relaxed font-sans shadow-[inset_0_1px_2px_rgba(0,0,0,0.01)]">
                    <strong className="font-semibold text-accent block mb-0.5">Explanation:</strong>
                    {quiz.explanations[index]}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Continue CTA */}
      <div className="pt-4 border-t border-border min-h-[72px] flex items-center">
        {selectedIndex !== null ? (
          <motion.button
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            type="button"
            onClick={onContinue}
            className="group min-h-[48px] w-full rounded-2xl bg-accent text-white font-board text-xs font-semibold uppercase tracking-[0.1em] shadow-[0_4px_16px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)] transition-all duration-300 transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Continue Challenge</span>
            <svg 
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </motion.button>
        ) : (
          <div className="w-full text-center text-[10px] font-semibold uppercase tracking-widest text-foreground/30 font-board">
            Select an Option to Verify
          </div>
        )}
      </div>
    </div>
  );
}
