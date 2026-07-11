"use client";

import { useEffect, useState, type ReactElement } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import type { Card, Pack, ReviewGrade } from "@local/shared";
import { getSessionState, recordGrade, saveSessionState } from "@/lib/db";
import { ArticulateCard } from "./articulate-card";
import { ProgressLine } from "./progress-line";
import { QuizCard } from "./quiz-card";
import { RevealCard } from "./reveal-card";

interface CardRunnerProps {
  pack: Pack;
  cards: Card[];
}

export function CardRunner({ pack, cards }: CardRunnerProps): ReactElement {
  const router = useRouter();
  const [cardIndex, setCardIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [cardStartedAt, setCardStartedAt] = useState(() => Date.now());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getSessionState(pack._id).then((state) => {
      if (cancelled) {
        return;
      }
      if (state) {
        setCardIndex(state.cardIndex);
        setRevealed(state.revealed);
      }
      setCardStartedAt(Date.now());
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [pack._id]);

  const persist = (nextIndex: number, nextRevealed: boolean): void => {
    void saveSessionState({
      packId: pack._id,
      cardIndex: nextIndex,
      revealed: nextRevealed,
      updatedAt: Date.now(),
    });
  };

  const advance = (): void => {
    const nextIndex = cardIndex + 1;
    setCardIndex(nextIndex);
    setRevealed(false);
    setCardStartedAt(Date.now());
    persist(nextIndex, false);
  };

  const handleReveal = (): void => {
    setRevealed(true);
    persist(cardIndex, true);
  };

  const handleGrade = (grade: ReviewGrade): void => {
    const card = cards[cardIndex];
    if (!card) {
      return;
    }
    const tookMs = Date.now() - cardStartedAt;
    void recordGrade(pack._id, card._id, grade, tookMs).then(() => advance());
  };

  const handleQuizAnswered = (isCorrect: boolean): void => {
    const card = cards[cardIndex];
    if (!card) {
      return;
    }
    const tookMs = Date.now() - cardStartedAt;
    void recordGrade(pack._id, card._id, isCorrect ? 3 : 1, tookMs);
  };

  if (!hydrated) {
    return (
      <div className="relative flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  // Session complete view
  if (cardIndex >= cards.length) {
    return (
      <div className="relative flex w-full max-w-md flex-col items-center">
        {/* Ambient Glows */}
        <div className="absolute inset-0 -z-10 overflow-visible pointer-events-none">
          <div className="absolute -top-10 -left-10 h-64 w-64 rounded-full bg-indigo-500/10 blur-[70px] animate-float-1" />
          <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-[70px] animate-float-2" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full rounded-[28px] glass-card p-8 flex flex-col items-center text-center gap-6"
        >
          {/* Confetti-style animation indicator */}
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-signal-go/10 text-signal-go border border-signal-go/20">
            <svg className="h-10 w-10 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground font-board">
              Session Complete!
            </h1>
            <p className="text-sm text-foreground/60 leading-relaxed font-sans px-4">
              You reviewed <strong className="font-semibold text-foreground">{cards.length} cards</strong> successfully. Great work keeping your prep streak alive!
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="min-h-[56px] w-full rounded-2xl bg-accent text-white font-board text-sm font-semibold uppercase tracking-[0.1em] shadow-[0_4px_16px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_20px_rgba(99,102,241,0.35)] transition-all duration-300 transform active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
          >
            Return to Dashboard
          </button>
        </motion.div>
      </div>
    );
  }

  const card = cards[cardIndex];
  if (!card) {
    return (
      <div className="relative flex min-h-[80vh] w-full max-w-md items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative flex w-full max-w-md flex-col gap-5">
      {/* Ambient Glows */}
      <div className="absolute inset-0 -z-10 overflow-visible pointer-events-none">
        <div className="absolute -top-16 -left-16 h-72 w-72 rounded-full bg-indigo-500/10 blur-[85px] animate-float-1" />
        <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-cyan-500/10 blur-[85px] animate-float-2" />
      </div>

      {/* Top Header Row with Back Button and Counters */}
      <div className="flex items-center justify-between px-1">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface hover:bg-surface/90 border border-border text-foreground/75 hover:text-foreground transition-all active:scale-95 cursor-pointer"
          title="Back to Dashboard"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        <div className="flex items-center gap-2">
          <span className="font-board text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
            Card {cardIndex + 1} of {cards.length}
          </span>
        </div>
      </div>

      {/* Sleek Glowing Progress Bar */}
      <ProgressLine current={cardIndex} total={cards.length} />

      {/* Card Rendering Container with AnimatePresence Slider */}
      <div className="relative w-full min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={cardIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="w-full h-full"
          >
            {card.type === "quiz-mcq" ? (
              <QuizCard card={card} onAnswered={handleQuizAnswered} onContinue={advance} />
            ) : card.type === "articulate" ? (
              <ArticulateCard card={card} revealed={revealed} onReveal={handleReveal} onGrade={handleGrade} />
            ) : (
              <RevealCard card={card} revealed={revealed} onReveal={handleReveal} onGrade={handleGrade} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
