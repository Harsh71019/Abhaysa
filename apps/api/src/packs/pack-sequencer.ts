import type { Card } from "@local/shared";

export const MAX_DUE_REVIEWS = 8;
export const MAX_CONSECUTIVE_HEAVY = 3;

function isHeavy(card: Card): boolean {
  return card.type !== "quiz-mcq";
}

export interface SelectForBudgetInput {
  /** Due reviews, already sorted by due date ascending. */
  dueReviewCards: Card[];
  /** Candidate new cards, in preferred order (e.g. deck order). */
  newCards: Card[];
  estMinutesBudget: number;
}

/**
 * Step 1-2 of BACKEND_PLAN.md §6.4: due reviews are always included (capped),
 * then new cards fill the remaining time budget in order, stopping at the
 * first card that would overflow it (simple prefix fill, not bin-packing).
 */
export function selectCardsForBudget(input: SelectForBudgetInput): Card[] {
  const dueReviews = input.dueReviewCards.slice(0, MAX_DUE_REVIEWS);
  const reviewSeconds = dueReviews.reduce((sum, card) => sum + card.estSeconds, 0);
  const budgetSeconds = Math.max(input.estMinutesBudget * 60 - reviewSeconds, 0);

  const selectedNew: Card[] = [];
  let usedSeconds = 0;
  for (const card of input.newCards) {
    if (usedSeconds + card.estSeconds > budgetSeconds) {
      break;
    }
    selectedNew.push(card);
    usedSeconds += card.estSeconds;
  }

  return [...dueReviews, ...selectedNew];
}

/**
 * Step 3 of BACKEND_PLAN.md §6.4: never more than MAX_CONSECUTIVE_HEAVY
 * non-quiz cards in a row. Splits into a heavy queue and a quiz queue (each
 * preserving its original relative order), then round-robins up to
 * MAX_CONSECUTIVE_HEAVY heavy cards followed by one quiz card.
 *
 * This guarantees the invariant as long as quiz supply is adequate relative
 * to heavy supply (at least one quiz per MAX_CONSECUTIVE_HEAVY heavy cards) —
 * true by construction of the card-generation pipeline (BACKEND_PLAN.md §6.2:
 * one quiz-mcq generated per concept card). If quiz supply runs out first,
 * remaining heavy cards are appended back-to-back rather than dropped.
 */
export function interleaveCards(cards: Card[]): Card[] {
  const heavyQueue = cards.filter(isHeavy);
  const quizQueue = cards.filter((card) => !isHeavy(card));

  const result: Card[] = [];
  let heavyIndex = 0;
  let quizIndex = 0;

  while (heavyIndex < heavyQueue.length || quizIndex < quizQueue.length) {
    for (let i = 0; i < MAX_CONSECUTIVE_HEAVY && heavyIndex < heavyQueue.length; i++) {
      const card = heavyQueue[heavyIndex];
      if (card) {
        result.push(card);
      }
      heavyIndex++;
    }
    if (quizIndex < quizQueue.length) {
      const card = quizQueue[quizIndex];
      if (card) {
        result.push(card);
      }
      quizIndex++;
    }
  }

  return result;
}

export function sequenceMorningPack(input: SelectForBudgetInput): Card[] {
  return interleaveCards(selectCardsForBudget(input));
}

/**
 * Evening pack per BACKEND_PLAN.md §6.4: quiz + articulate cards from this
 * morning's set, plus any remaining due reviews — no LLM generation in
 * Phase 2, just re-surfacing cards that already exist.
 */
export function sequenceEveningPack(morningCards: Card[], dueReviewCards: Card[]): Card[] {
  const recallCards = morningCards.filter(
    (card) => card.type === "quiz-mcq" || card.type === "articulate",
  );
  const dueReviews = dueReviewCards.slice(0, MAX_DUE_REVIEWS);
  return interleaveCards([...dueReviews, ...recallCards]);
}
