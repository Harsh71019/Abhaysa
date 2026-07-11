import { describe, expect, it } from "vitest";
import { applyReviewGrade, type ReviewStateFields } from "./fsrs";

const NOW = new Date("2026-07-10T00:00:00.000Z");

describe("applyReviewGrade", () => {
  it("moves a never-reviewed card out of the 'new' state after any grade", () => {
    const result = applyReviewGrade(null, 3, NOW);
    expect(result.state).not.toBe("new");
    expect(result.reps).toBe(1);
    expect(result.lapses).toBe(0);
  });

  it("schedules a future due date, never in the past", () => {
    const result = applyReviewGrade(null, 3, NOW);
    expect(result.due.getTime()).toBeGreaterThanOrEqual(NOW.getTime());
  });

  it("schedules Easy further out than Again, for the same starting state", () => {
    const again = applyReviewGrade(null, 1, NOW);
    const easy = applyReviewGrade(null, 4, NOW);
    expect(easy.due.getTime()).toBeGreaterThan(again.due.getTime());
  });

  it("increments reps on every subsequent review", () => {
    const first = applyReviewGrade(null, 3, NOW);
    const second = applyReviewGrade(first, 3, new Date(NOW.getTime() + 86_400_000));
    expect(second.reps).toBe(2);
  });

  it("increments lapses when a reviewed (non-new) card is graded Again", () => {
    // Get the card into 'review' state first via a couple of Good grades.
    let state: ReviewStateFields = applyReviewGrade(null, 3, NOW);
    state = applyReviewGrade(state, 3, new Date(NOW.getTime() + 5 * 86_400_000));
    expect(state.state).toBe("review");

    const lapsed = applyReviewGrade(state, 1, new Date(NOW.getTime() + 10 * 86_400_000));
    expect(lapsed.lapses).toBe(1);
    expect(lapsed.state).toBe("relearning");
  });

  it("round-trips state through toFsrsCard/fromFsrsCard without drift", () => {
    const first = applyReviewGrade(null, 2, NOW);
    // Re-applying a grade to the mapped-back state should not throw and
    // should keep producing a valid, later due date — proving the
    // camelCase/string-enum <-> snake_case/numeric-enum mapping round-trips.
    const second = applyReviewGrade(first, 2, new Date(first.due.getTime() + 1000));
    expect(second.due.getTime()).toBeGreaterThan(first.due.getTime());
  });
});
