import { beforeEach, describe, expect, it } from "vitest";
import { db, ensureTodaysPackLoaded, getPackCards, getSessionState, recordGrade, saveSessionState } from "./db";

beforeEach(async () => {
  await Promise.all([
    db.packs.clear(),
    db.cards.clear(),
    db.reviewStates.clear(),
    db.reviewLogs.clear(),
    db.sessionState.clear(),
  ]);
});

describe("ensureTodaysPackLoaded", () => {
  it("loads the fixture pack + all 20 cards into Dexie", async () => {
    const pack = await ensureTodaysPackLoaded();
    expect(pack.cardIds).toHaveLength(20);

    const cards = await getPackCards(pack);
    expect(cards).toHaveLength(20);
  });

  it("is idempotent — a second call doesn't duplicate the pack", async () => {
    await ensureTodaysPackLoaded();
    await ensureTodaysPackLoaded();
    const count = await db.packs.count();
    expect(count).toBe(1);
  });
});

describe("recordGrade", () => {
  it("moves a card out of the 'new' state and queues a pending review log", async () => {
    const pack = await ensureTodaysPackLoaded();
    const cardId = pack.cardIds[0];
    if (!cardId) throw new Error("expected a card id");

    const result = await recordGrade(pack._id, cardId, 3, 8000);
    expect(result.state).not.toBe("new");
    expect(result.reps).toBe(1);

    const pending = await db.reviewLogs.where({ cardId }).toArray();
    expect(pending).toHaveLength(1);
    expect(pending[0]?.synced).toBe(false);
    expect(pending[0]?.grade).toBe(3);
  });

  it("carries FSRS state forward across two grades on the same card", async () => {
    const pack = await ensureTodaysPackLoaded();
    const cardId = pack.cardIds[1];
    if (!cardId) throw new Error("expected a card id");

    await recordGrade(pack._id, cardId, 3, 5000);
    const second = await recordGrade(pack._id, cardId, 3, 5000);
    expect(second.reps).toBe(2);
  });
});

describe("session state", () => {
  it("round-trips cursor position through Dexie", async () => {
    const pack = await ensureTodaysPackLoaded();
    await saveSessionState({ packId: pack._id, cardIndex: 5, revealed: true, updatedAt: Date.now() });
    const state = await getSessionState(pack._id);
    expect(state?.cardIndex).toBe(5);
    expect(state?.revealed).toBe(true);
  });
});
