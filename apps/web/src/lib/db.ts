import Dexie, { type Table } from "dexie";
import {
  applyReviewGrade,
  buildAttentionPackBundle,
  type Card,
  type Pack,
  type ReviewGrade,
  type ReviewState,
} from "@local/shared";
import { getCardsByDeck, getDeck } from "@/lib/api";

export interface PendingReviewLog {
  id?: number;
  cardId: string;
  packId: string;
  grade: ReviewGrade;
  tookMs: number;
  at: Date;
  synced: boolean;
}

export interface SessionState {
  /** One row per pack — the session's current position within it. */
  packId: string;
  cardIndex: number;
  revealed: boolean;
  updatedAt: number;
}

/**
 * ReviewState minus `_id` — the client has no server-assigned id until a
 * review syncs (Phase 3); locally, `cardId` is already a unique key.
 */
export type LocalReviewState = Omit<ReviewState, "_id">;

/**
 * Offline-first store per FRONTEND_PLAN.md §5. The session/card-runner UI
 * only ever talks to this module — no fetch calls from session components
 * themselves. Today's daily pack still seeds from the local fixture (no
 * network yet — the real GET /packs/today + POST /reviews/batch sync layer
 * is Phase 3); deck-scoped study sessions (ensureDeckPackLoaded) do fetch
 * once to build a synthetic pack, then hand off to the same offline flow.
 * The reviewLogs table is already shaped as the pending-sync queue Phase 3
 * needs.
 */
class LocalDatabase extends Dexie {
  packs!: Table<Pack, string>;
  cards!: Table<Card, string>;
  reviewStates!: Table<LocalReviewState, string>;
  reviewLogs!: Table<PendingReviewLog, number>;
  sessionState!: Table<SessionState, string>;

  constructor() {
    super("local-db");
    this.version(1).stores({
      packs: "_id, date, leg, [date+leg]",
      cards: "_id, deckId",
      reviewStates: "cardId",
      reviewLogs: "++id, cardId, packId, synced",
      sessionState: "packId",
    });
  }
}

export const db = new LocalDatabase();

/** Loads today's morning pack fixture into Dexie if it isn't there yet. */
export async function ensureTodaysPackLoaded(): Promise<Pack> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = await db.packs.where("[date+leg]").equals([date, "morning"]).first();
  if (existing) {
    return existing;
  }

  const bundle = buildAttentionPackBundle(date);
  const { cards, ...pack } = bundle;
  await db.transaction("rw", db.packs, db.cards, async () => {
    await db.packs.put(pack);
    await db.cards.bulkPut(cards);
  });
  return pack;
}

/**
 * Study CTA on a Library source's Reader screen: builds a synthetic Pack
 * scoped to one deck (no FSRS sequencing — just that deck's cards in order),
 * so the existing card-runner/Dexie machinery works unmodified. The pack id
 * is deterministic per deck so re-entering resumes the same session state.
 */
export async function ensureDeckPackLoaded(deckId: string): Promise<Pack> {
  const packId = `deck-${deckId}`;
  const existing = await db.packs.get(packId);
  if (existing) {
    return existing;
  }

  const [deck, cards] = await Promise.all([getDeck(deckId), getCardsByDeck(deckId)]);
  const pack: Pack = {
    _id: packId,
    date: new Date().toISOString().slice(0, 10),
    leg: "morning",
    cardIds: cards.map((card) => card._id),
    theme: deck.title,
    estMinutes: Math.max(1, Math.round(cards.reduce((sum, card) => sum + card.estSeconds, 0) / 60)),
    status: "ready",
  };
  await db.transaction("rw", db.packs, db.cards, async () => {
    await db.packs.put(pack);
    await db.cards.bulkPut(cards);
  });
  return pack;
}

export async function getPackCards(pack: Pack): Promise<Card[]> {
  const cards = await db.cards.bulkGet(pack.cardIds);
  return cards.filter((card): card is Card => card !== undefined);
}

export async function getSessionState(packId: string): Promise<SessionState | undefined> {
  return db.sessionState.get(packId);
}

export async function saveSessionState(state: SessionState): Promise<void> {
  await db.sessionState.put(state);
}

/**
 * Applies a grade to a card's locally-tracked FSRS state (ts-fsrs runs
 * on-device, per FRONTEND_PLAN.md §5) and queues a pending review log for
 * later sync. Returns the resulting due date, mainly useful for tests.
 */
export async function recordGrade(
  packId: string,
  cardId: string,
  grade: ReviewGrade,
  tookMs: number,
): Promise<LocalReviewState> {
  const now = new Date();
  const existing = await db.reviewStates.get(cardId);
  const nextFields = applyReviewGrade(existing ?? null, grade, now);
  const nextState: LocalReviewState = { cardId, ...nextFields };

  await db.transaction("rw", db.reviewStates, db.reviewLogs, async () => {
    await db.reviewStates.put(nextState);
    await db.reviewLogs.add({ cardId, packId, grade, tookMs, at: now, synced: false });
  });

  return nextState;
}

/** Best-effort — not all browsers grant this, and it's fine either way. */
export function requestPersistentStorage(): void {
  if (typeof navigator !== "undefined" && navigator.storage?.persist) {
    void navigator.storage.persist();
  }
}
