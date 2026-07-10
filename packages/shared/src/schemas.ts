import { z } from "zod";

// ── Shared primitives ───────────────────────────────────────────────────────

/** MongoDB ObjectId, always serialized as a string across the wire. */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "invalid ObjectId");

export const pillarSchema = z.enum([
  "dsa",
  "system-design",
  "genai",
  "behavioral",
  "language-internals",
]);
export type Pillar = z.infer<typeof pillarSchema>;

// ── Source ──────────────────────────────────────────────────────────────────

export const sourceKindSchema = z.enum(["article", "pdf", "manual", "youtube-transcript"]);
export type SourceKind = z.infer<typeof sourceKindSchema>;

export const sourceStatusSchema = z.enum(["queued", "extracted", "carded", "failed"]);
export type SourceStatus = z.infer<typeof sourceStatusSchema>;

export const sourceSchema = z.object({
  _id: objectIdSchema,
  url: z.string().url().optional(),
  title: z.string().min(1),
  kind: sourceKindSchema,
  pillar: pillarSchema,
  status: sourceStatusSchema,
  rawText: z.string().optional(),
  failureReason: z.string().optional(),
  addedAt: z.coerce.date(),
});
export type Source = z.infer<typeof sourceSchema>;

export const createSourceSchema = sourceSchema.pick({
  url: true,
  title: true,
  kind: true,
  pillar: true,
});
export type CreateSourceInput = z.infer<typeof createSourceSchema>;

// ── Card ────────────────────────────────────────────────────────────────────

export const cardTypeSchema = z.enum([
  "concept",
  "pattern",
  "quiz-mcq",
  "articulate",
  "tradeoff",
  "code-read",
]);
export type CardType = z.infer<typeof cardTypeSchema>;

export const cardQuizSchema = z.object({
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanations: z.array(z.string().min(1)).length(4),
});
export type CardQuiz = z.infer<typeof cardQuizSchema>;

export const cardDifficultySchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type CardDifficulty = z.infer<typeof cardDifficultySchema>;

export const cardSchema = z.object({
  _id: objectIdSchema,
  sourceId: objectIdSchema.optional(),
  deckId: objectIdSchema,
  pillar: pillarSchema,
  type: cardTypeSchema,
  front: z.string().min(1),
  back: z.string().min(1),
  quiz: cardQuizSchema.optional(),
  difficulty: cardDifficultySchema,
  estSeconds: z.number().int().positive(),
  tags: z.array(z.string().min(1)),
  embedding: z.array(z.number()).optional(),
  createdAt: z.coerce.date(),
});
export type Card = z.infer<typeof cardSchema>;

/** Shape the LLM must return for one generated card, before _id/deckId/createdAt are assigned. */
export const generatedCardSchema = cardSchema.omit({
  _id: true,
  deckId: true,
  sourceId: true,
  embedding: true,
  createdAt: true,
});
export type GeneratedCard = z.infer<typeof generatedCardSchema>;

/** POST /cards body — a manually- or LLM-authored card plus which deck it belongs to. */
export const createCardSchema = generatedCardSchema.extend({
  deckId: objectIdSchema,
});
export type CreateCardInput = z.infer<typeof createCardSchema>;

// ── Deck ────────────────────────────────────────────────────────────────────

export const deckSchema = z.object({
  _id: objectIdSchema,
  title: z.string().min(1),
  pillar: pillarSchema,
  description: z.string(),
  cardCount: z.number().int().nonnegative(),
  order: z.number().int(),
});
export type Deck = z.infer<typeof deckSchema>;

// ── ReviewState (FSRS) ──────────────────────────────────────────────────────

export const reviewStateStateSchema = z.enum(["new", "learning", "review", "relearning"]);
export type ReviewStateState = z.infer<typeof reviewStateStateSchema>;

export const reviewStateSchema = z.object({
  _id: objectIdSchema,
  cardId: objectIdSchema,
  due: z.coerce.date(),
  stability: z.number().nonnegative(),
  difficulty: z.number().nonnegative(),
  elapsedDays: z.number().nonnegative(),
  scheduledDays: z.number().nonnegative(),
  reps: z.number().int().nonnegative(),
  lapses: z.number().int().nonnegative(),
  state: reviewStateStateSchema,
  lastReview: z.coerce.date().optional(),
});
export type ReviewState = z.infer<typeof reviewStateSchema>;

// ── Pack ────────────────────────────────────────────────────────────────────

export const packLegSchema = z.enum(["morning", "evening"]);
export type PackLeg = z.infer<typeof packLegSchema>;

export const packStatusSchema = z.enum(["ready", "consumed"]);
export type PackStatus = z.infer<typeof packStatusSchema>;

/** YYYY-MM-DD */
export const packDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const packSchema = z.object({
  _id: objectIdSchema,
  date: packDateSchema,
  leg: packLegSchema,
  cardIds: z.array(objectIdSchema),
  theme: z.string(),
  estMinutes: z.number().positive(),
  status: packStatusSchema,
});
export type Pack = z.infer<typeof packSchema>;

/** GET /packs/today response: the pack plus its cards fully inlined — no follow-up fetches. */
export const packBundleSchema = packSchema.extend({
  cards: z.array(cardSchema),
});
export type PackBundle = z.infer<typeof packBundleSchema>;

// ── Reviews ─────────────────────────────────────────────────────────────────

export const reviewGradeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);
export type ReviewGrade = z.infer<typeof reviewGradeSchema>;

export const reviewLogSchema = z.object({
  cardId: objectIdSchema,
  packId: objectIdSchema,
  grade: reviewGradeSchema,
  tookMs: z.number().int().nonnegative(),
  at: z.coerce.date(),
});
export type ReviewLog = z.infer<typeof reviewLogSchema>;

export const reviewBatchSchema = z.array(reviewLogSchema).min(1);
export type ReviewBatch = z.infer<typeof reviewBatchSchema>;

// ── Streak ──────────────────────────────────────────────────────────────────

export const streakSchema = z.object({
  current: z.number().int().nonnegative(),
  longest: z.number().int().nonnegative(),
  lastActiveDate: packDateSchema.optional(),
  cardsTotal: z.number().int().nonnegative(),
  // keyed by Pillar; z.record uses a string key here so a partially-populated
  // map (not every pillar has cards yet) type-checks without extra ceremony.
  byPillar: z.record(z.string(), z.number().int().nonnegative()),
});
export type Streak = z.infer<typeof streakSchema>;

// ── Stats ───────────────────────────────────────────────────────────────────

export const statsOverviewSchema = z.object({
  streak: streakSchema,
  dueCount: z.number().int().nonnegative(),
  weakTags: z.array(z.object({ tag: z.string(), lapseRate: z.number().min(0).max(1) })),
  pillarCoverage: z.record(z.string(), z.number().int().nonnegative()),
});
export type StatsOverview = z.infer<typeof statsOverviewSchema>;

// ── Auth ────────────────────────────────────────────────────────────────────

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const loginResponseSchema = z.object({
  accessToken: z.string(),
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;
