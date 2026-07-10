"use client";

import { useEffect, useState, type ReactElement } from "react";
import { motion, type Variants } from "motion/react";
import type { PackBundle } from "@local/shared";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface IndicatorProps {
  pack: PackBundle;
  onBoardNow: () => void;
}

function formatNowLabel(leg: PackBundle["leg"]): string {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm} ${leg === "morning" ? "LEARN" : "RECALL"}`;
}

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const rowVariantsMotion: Variants = {
  hidden: { opacity: 0, scaleY: 0 },
  visible: {
    opacity: 1,
    scaleY: 1,
    transition: { duration: 0.18, ease: "easeOut" },
  },
};

const rowVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
};

export function Indicator({ pack, onBoardNow }: IndicatorProps): ReactElement {
  const reducedMotion = useReducedMotion();
  const rowVariants = reducedMotion ? rowVariantsReduced : rowVariantsMotion;
  const dueCount = 0; // FSRS/reviews land in Phase 2 — no due reviews to report yet.
  const status: "ON TIME" | "DELAYED" = "ON TIME";

  // Rendered only after mount so server/client markup can't mismatch on the clock.
  const [nowLabel, setNowLabel] = useState("--:-- ----");
  useEffect(() => {
    setNowLabel(formatNowLabel(pack.leg));
  }, [pack.leg]);

  return (
    <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-3"
      >
        <motion.div
          variants={rowVariants}
          style={{ transformOrigin: "top" }}
          className="font-board text-2xl uppercase tracking-[0.06em] tabular-nums text-accent"
        >
          {nowLabel}
        </motion.div>

        <motion.div
          variants={rowVariants}
          style={{ transformOrigin: "top" }}
          className="font-board text-sm uppercase tracking-[0.06em] text-foreground/70"
        >
          To: Next Role
        </motion.div>

        <motion.div
          variants={rowVariants}
          style={{ transformOrigin: "top" }}
          className="border-t border-border"
        />

        <motion.div
          variants={rowVariants}
          style={{ transformOrigin: "top" }}
          className="font-board text-base uppercase tracking-[0.06em]"
        >
          {pack.theme}
        </motion.div>

        <motion.div
          variants={rowVariants}
          style={{ transformOrigin: "top" }}
          className="font-board text-sm uppercase tracking-[0.06em] tabular-nums text-foreground/70"
        >
          {pack.cards.length} Cards &middot; {pack.estMinutes} Min &middot; {dueCount} Due
        </motion.div>

        <motion.div
          variants={rowVariants}
          style={{ transformOrigin: "top" }}
          className={
            status === "ON TIME"
              ? "font-board text-sm uppercase tracking-[0.06em] text-signal-go"
              : "font-board text-sm uppercase tracking-[0.06em] text-signal-stop"
          }
        >
          Status: {status}
        </motion.div>
      </motion.div>

      <button
        type="button"
        onClick={onBoardNow}
        className="mt-6 min-h-14 w-full rounded-xl border border-border bg-background font-board text-sm uppercase tracking-[0.06em] text-foreground"
      >
        Board Now &rarr;
      </button>
    </div>
  );
}
