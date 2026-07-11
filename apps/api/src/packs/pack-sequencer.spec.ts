import { describe, expect, it } from "vitest";
import type { Card, CardType } from "@local/shared";
import {
  MAX_CONSECUTIVE_HEAVY,
  MAX_DUE_REVIEWS,
  interleaveCards,
  selectCardsForBudget,
  sequenceEveningPack,
  sequenceMorningPack,
} from "./pack-sequencer";

let cardCounter = 0;

function makeCard(type: CardType, estSeconds = 90): Card {
  cardCounter++;
  return {
    _id: cardCounter.toString().padStart(24, "0"),
    deckId: "000000000000000000000001",
    pillar: "genai",
    type,
    front: `front-${cardCounter}`,
    back: `back-${cardCounter}`,
    difficulty: 1,
    estSeconds,
    tags: [],
    createdAt: new Date("2026-07-10T00:00:00.000Z"),
  };
}

function countMaxConsecutiveHeavy(cards: Card[]): number {
  let max = 0;
  let current = 0;
  for (const card of cards) {
    if (card.type !== "quiz-mcq") {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  return max;
}

describe("selectCardsForBudget", () => {
  it("always includes due reviews, capped at MAX_DUE_REVIEWS", () => {
    const dueReviewCards = Array.from({ length: 12 }, () => makeCard("concept"));
    const result = selectCardsForBudget({ dueReviewCards, newCards: [], estMinutesBudget: 30 });
    expect(result).toHaveLength(MAX_DUE_REVIEWS);
  });

  it("fills remaining budget with new cards and stops at the first overflow", () => {
    const newCards = [makeCard("concept", 600), makeCard("concept", 600), makeCard("concept", 600)];
    // 20 minute budget = 1200s; first two cards (1200s) fit exactly, third would overflow.
    const result = selectCardsForBudget({ dueReviewCards: [], newCards, estMinutesBudget: 20 });
    expect(result).toHaveLength(2);
  });

  it("reduces the new-card budget by time already spent on due reviews", () => {
    const dueReviewCards = [makeCard("concept", 900)]; // 15 min
    const newCards = [makeCard("concept", 900)]; // another 15 min — total would be 30, budget is 20
    const result = selectCardsForBudget({ dueReviewCards, newCards, estMinutesBudget: 20 });
    expect(result).toEqual(dueReviewCards); // no room left for the new card
  });
});

describe("interleaveCards", () => {
  it("never places more than MAX_CONSECUTIVE_HEAVY non-quiz cards in a row when quiz supply is adequate", () => {
    // 13 heavy cards, 7 quiz cards — same ratio as the seeded attention deck.
    const heavy = Array.from({ length: 13 }, () => makeCard("concept"));
    const quiz = Array.from({ length: 7 }, () => makeCard("quiz-mcq"));
    const result = interleaveCards([...heavy, ...quiz]);

    expect(result).toHaveLength(20);
    expect(countMaxConsecutiveHeavy(result)).toBeLessThanOrEqual(MAX_CONSECUTIVE_HEAVY);
  });

  it("preserves relative order within the heavy queue and within the quiz queue", () => {
    const heavy = [makeCard("concept"), makeCard("tradeoff"), makeCard("code-read")];
    const quiz = [makeCard("quiz-mcq"), makeCard("quiz-mcq")];
    const result = interleaveCards([...heavy, ...quiz]);

    const heavyOrder = result.filter((c) => c.type !== "quiz-mcq").map((c) => c._id);
    const quizOrder = result.filter((c) => c.type === "quiz-mcq").map((c) => c._id);
    expect(heavyOrder).toEqual(heavy.map((c) => c._id));
    expect(quizOrder).toEqual(quiz.map((c) => c._id));
  });

  it("appends leftover heavy cards once quiz supply is exhausted, without dropping any", () => {
    const heavy = Array.from({ length: 5 }, () => makeCard("concept"));
    const quiz = [makeCard("quiz-mcq")];
    const result = interleaveCards([...heavy, ...quiz]);
    expect(result).toHaveLength(6);
  });
});

describe("sequenceMorningPack", () => {
  it("includes due reviews and new cards, respecting the interleave rule", () => {
    const dueReviewCards = [makeCard("concept"), makeCard("tradeoff")];
    const newCards = Array.from({ length: 6 }, (_, i) => (i % 2 === 0 ? makeCard("concept") : makeCard("quiz-mcq")));
    const result = sequenceMorningPack({ dueReviewCards, newCards, estMinutesBudget: 40 });

    const resultIds = new Set(result.map((c) => c._id));
    for (const due of dueReviewCards) {
      expect(resultIds.has(due._id)).toBe(true);
    }
    expect(countMaxConsecutiveHeavy(result)).toBeLessThanOrEqual(MAX_CONSECUTIVE_HEAVY);
  });
});

describe("sequenceEveningPack", () => {
  it("contains only quiz-mcq/articulate cards from the morning set, plus due reviews", () => {
    const morningCards = [
      makeCard("concept"),
      makeCard("quiz-mcq"),
      makeCard("articulate"),
      makeCard("code-read"),
    ];
    const dueReviewCards = [makeCard("tradeoff")];
    const result = sequenceEveningPack(morningCards, dueReviewCards);

    const resultIds = result.map((c) => c._id);
    expect(resultIds).toContain(morningCards[1]?._id); // quiz-mcq
    expect(resultIds).toContain(morningCards[2]?._id); // articulate
    expect(resultIds).not.toContain(morningCards[0]?._id); // concept excluded
    expect(resultIds).not.toContain(morningCards[3]?._id); // code-read excluded
    expect(resultIds).toContain(dueReviewCards[0]?._id);
  });
});
