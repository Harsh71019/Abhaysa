import { createEmptyCard, State, type Card as FsrsCard, type Grade } from "ts-fsrs";
import { FSRS, generatorParameters, type FSRSParameters } from "ts-fsrs";
import type { ReviewGrade, ReviewState, ReviewStateState } from "./schemas";

/**
 * Single source of truth for FSRS tuning. Both the API (server-authoritative
 * scheduling on /reviews/batch) and the web client (offline scheduling on the
 * train, synced later) must construct their scheduler from this file so the
 * two never drift.
 */
export const fsrsParameters: FSRSParameters = generatorParameters({
  enable_fuzz: true,
  enable_short_term: true,
});

export function createScheduler(): FSRS {
  return new FSRS(fsrsParameters);
}

/**
 * ts-fsrs uses its own snake_case Card shape with a numeric State enum;
 * ours (ReviewState, in schemas.ts) is camelCase with a string enum for
 * readability in Mongo/JSON. These convert between the two so the mapping
 * lives in exactly one place, shared by server and client.
 */

const STATE_TO_STRING: Record<State, ReviewStateState> = {
  [State.New]: "new",
  [State.Learning]: "learning",
  [State.Review]: "review",
  [State.Relearning]: "relearning",
};

const STRING_TO_STATE: Record<ReviewStateState, State> = {
  new: State.New,
  learning: State.Learning,
  review: State.Review,
  relearning: State.Relearning,
};

export type ReviewStateFields = Omit<ReviewState, "_id" | "cardId">;

/** `null` means the card has never been reviewed — starts from FSRS's empty-card state. */
export function toFsrsCard(reviewState: ReviewStateFields | null, now: Date): FsrsCard {
  if (!reviewState) {
    return createEmptyCard(now);
  }
  return {
    due: reviewState.due,
    stability: reviewState.stability,
    difficulty: reviewState.difficulty,
    elapsed_days: reviewState.elapsedDays,
    scheduled_days: reviewState.scheduledDays,
    reps: reviewState.reps,
    lapses: reviewState.lapses,
    state: STRING_TO_STATE[reviewState.state],
    ...(reviewState.lastReview ? { last_review: reviewState.lastReview } : {}),
  };
}

export function fromFsrsCard(card: FsrsCard): ReviewStateFields {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: STATE_TO_STRING[card.state],
    ...(card.last_review ? { lastReview: card.last_review } : {}),
  };
}

/** Our ReviewGrade (1|2|3|4) has the same runtime values as ts-fsrs's Grade (Again..Easy). */
export function toFsrsGrade(grade: ReviewGrade): Grade {
  return grade as Grade;
}

/**
 * Apply one grade to a card's current review state and return the new state.
 * Pass `null` for a card that's never been reviewed before.
 */
export function applyReviewGrade(
  currentState: ReviewStateFields | null,
  grade: ReviewGrade,
  now: Date,
): ReviewStateFields {
  const scheduler = createScheduler();
  const fsrsCard = toFsrsCard(currentState, now);
  const result = scheduler.next(fsrsCard, now, toFsrsGrade(grade));
  return fromFsrsCard(result.card);
}
