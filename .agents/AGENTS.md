# Abhyasa (LOCAL) Workspace Rules & Instructions

This repository is a monorepo for **Abhyasa** (working name **LOCAL**), an offline-first learning and interview-prep PWA designed to be used during a Mumbai local train commute.

---

## 1. Project Overview & Architecture

### Stack
- **Monorepo Manager**: `pnpm workspaces` + `turborepo`
- **Frontend (`apps/web`)**: Next.js 16 (App Router), Tailwind CSS v4, PWA support via `@serwist/next`, Dexie (IndexedDB) for offline data, Zustand for session state, and `motion` (Framer Motion) for animations.
- **Backend (`apps/api`)**: NestJS 11 (Fastify adapter), MongoDB 7 + Mongoose (`@nestjs/mongoose`).
- **Shared (`packages/shared`)**: Single source of truth containing Zod schemas, TypeScript types, and FSRS (Free Spaced Repetition Scheduler) configurations.
- **Prompts (`packages/prompts`)**: Central repository for versioned LLM prompt templates.
- **Vector Search**: Self-hosted MongoDB running via Docker Compose on Proxmox (CT100) — not MongoDB Atlas. Dedup uses brute-force cosine similarity in Node over stored Voyage AI embeddings.

---

## 2. Coding & TypeScript Rules

- **Strict TypeScript**: TypeScript strict mode is enforced everywhere via `tsconfig.base.json` at the repo root:
  - `strict: true`
  - `noUncheckedIndexedAccess: true`
  - `exactOptionalPropertyTypes: true`
  - `noImplicitOverride: true`
  Do not weaken these flags locally in any package/app.
- **DRY Schemas**: All request/response types and card structures must live in `packages/shared/src/schemas.ts` as Zod schemas. TypeScript types must be inferred using `z.infer`. Never define a card shape twice.
- **LLM Safe Calling**:
  1. Retrieve prompt templates from `packages/prompts`.
  2. Parse responses strictly with Zod `safeParse`.
  3. Implement exactly one retry with error feedback on failure, then throw.
  4. Never use `JSON.parse()` directly on LLM output.
- **Spaced Repetition**: Use `ts-fsrs` from `packages/shared` to calculate spaced repetition grades on the client, and sync them back to the server later.
- **Authentication**: Simple single-user JWT seeded from environment variables. Do not introduce multi-user or organizational complexity.

---

## 3. Design System & Aesthetics ("Indicator Board")

The visual style is inspired by Mumbai local train **indicator boards** (amber dot-matrix) and **platform signage** (yellow enamel).

- **Theme Modes**:
  - **Day Theme ("Platform")**: Warm yellow-cream paper (`#F6E9B8`), near-black ink (`#14171A`). Used for the morning (learn) leg.
  - **Night Theme ("Indicator")**: Carriage-dark ink (`#14171A`), amber phosphor text (`#FFB300`). Used for the evening (recall) leg.
- **Layout & Usability**:
  - **One-Thumb UX**: All interactive elements must be in the bottom third of the screen.
  - **Large Tap Targets**: Interactive targets must be $\ge 56\text{px}$ to accommodate train vibrations.
  - No precision swipe gestures or complex interactions.
- **Typography**:
  - **Board/Display**: *Archivo Variable* (SemiExpanded, 600-700, ALL-CAPS, +6% tracking, tabular numerals).
  - **Reading**: *Literata Variable* (17-18px, 1.6 line-height, max 34ch, serif) for card reading content.
  - **Code**: *JetBrains Mono* (14px) styled with Shiki highlighting.

---

## 4. Workflow & Verification Rules

- **Local LAN Services**: Ollama is hosted on a separate Gaming PC on the local area network (LAN).
- **Testing**: Using `vitest` for tests. The card-generation and FSRS scheduling logic **must** have tests. Use `pnpm test` to verify.
- **Commits**: Follow conventional commit guidelines. Keep PRs small, isolated, and structured per phase.
