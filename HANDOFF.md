# LOCAL — Handoff

Working name **LOCAL**: a commute-learning PWA (Mumbai local train commute →
interview prep). Full specs in `BACKEND_PLAN.md` and `FRONTEND_PLAN.md` at repo
root — read those first for the complete architecture/design intent. This doc
is the "what's actually been done and what's next" status snapshot.

---

## What's built and verified

**Backend (Phases 0-2 of BACKEND_PLAN.md), all done + tested:**
- NestJS 11 + Fastify, Mongoose, zod-validated env config, strict TypeScript
  everywhere (`tsconfig.base.json` at repo root: `strict`,
  `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`).
- `packages/shared`: zod schemas (single source of truth for types), FSRS
  config + mapper (`applyReviewGrade`, converts ts-fsrs's snake_case/numeric
  shape ↔ our camelCase/string-enum `ReviewState`), the 20-card
  attention-mechanism fixture (`src/fixtures/attention-mechanism.ts`).
- `decks`/`cards` CRUD, `packs` (FSRS-driven sequencer + `GET /packs/today` +
  `POST /packs/generate` + nightly cron at 05:30 IST), `reviews`
  (`POST /reviews/batch`, last-write-wins by timestamp).
- Pack sequencer (`apps/api/src/packs/pack-sequencer.ts`) is pure/unit-tested:
  due reviews always included (capped 8), new cards fill the time budget,
  never >3 non-quiz cards in a row. 8 passing vitest tests.
- Verified live end-to-end (not just typecheck): generated packs, posted
  grades, watched FSRS schedule correctly, confirmed due-review resurfacing
  and evening-pack quiz derivation all work against real data.

**Frontend (Phases 0-2 of FRONTEND_PLAN.md), all done + tested:**
- Next.js 16 App Router, Tailwind v4, day/night theme (zustand + pre-hydration
  script to avoid flash), PWA manifest + icons.
- Indicator home screen (departure-board flip-in animation), full card runner
  (`apps/web/src/components/session/`): concept/pattern/tradeoff/code-read
  (tap-reveal-then-grade), quiz-mcq (instant feedback, auto-grades), articulate
  (60s countdown, self-grade). Dexie (`lib/db.ts`) persists session cursor +
  FSRS state locally — resumes exactly after a reload.
- **Note:** the user has been actively redesigning the UI components directly
  (glassmorphism cards, glow effects, flip animations, circular progress
  rings) — this diverges from FRONTEND_PLAN.md §9's original "no
  shadows/gradients, 10 components you own" brief. Treat the *current* file
  contents as the real design direction, not the plan doc's original
  aesthetic guardrails — don't "fix" it back without being asked.

**Deployed:** pct 102 on the user's home Proxmox server (hostname `apps`),
reached via Tailscale (**not** the LAN IP — no subnet route configured; the
LAN IP is unreachable from outside the home network). Current Tailscale IP:
confirm fresh with `tailscale status`, it can change if the node
re-registers. Redeploy is now git-based: `/opt/apps/local` on the server is a
real git checkout of `github.com/Harsh71019/Abhaysa` (main branch) — pull +
`docker compose -f docker-compose.prod.yml up -d --build`, not rsync.
Web on port 3004, API on 3005, mongo internal-only. Full details in the
`local-app-deployment` memory file (auto-loaded) and `DEPLOYMENT.md` /
`connectingtoproxmox.md` at repo root (those describe a sibling app,
`books-app`, on the same box — same server/pattern, different app).

**Known environment quirk:** this dev Mac has a pre-existing native
Homebrew `mongod` permanently bound to `localhost:27017`, which silently
intercepts Docker's mongo container if it tries to use the same port. Local
dev docker-compose mongo uses **27018** instead
(`MONGODB_URI=mongodb://localhost:27018/local` in `apps/api/.env`). Don't
"fix" this by touching the native mongod — it's unrelated, pre-existing
infrastructure on this machine.

**⚠️ Uncommitted work:** all of Phase 2 (packs/reviews backend, card runner
frontend, plus the user's own UI redesign) is **not yet committed to git** —
only the Phase 0+1 initial commit exists on `main`. Check `git status` before
doing anything git-related; there's a real diff sitting in the working tree
that hasn't been reviewed/committed yet.

---

## Where the product direction just shifted (not yet built)

Mid-conversation, the product shape evolved from "cards only" to a
**read-then-drill loop**, agreed with the user:

1. **Library screen** (`/library`) — lists everything ingested, whatever its
   origin. One list, not two — "articles" and "concepts" are the same thing
   under the hood.
2. **1 Source = 1 Deck.** Every ingested item (a URL, a pasted note, eventually
   a PDF) becomes exactly one `Source` *and* exactly one `Deck` of cards. This
   is a schema/architecture decision not yet implemented — currently `Source`
   and `Deck` are only loosely related.
3. **Ingest, don't link out.** Articles get extracted (readability for URLs)
   and stored (`Source.rawText`), not just bookmarked — needed for offline
   reading *and* because Claude needs the raw text anyway to generate cards
   from it later. Noted to the user: this means caching full third-party
   article text for personal single-user offline reading (Pocket/Instapaper
   pattern) — fine for this use case, just never becomes multi-user
   redistribution.
4. **Add-Source form, two input modes:**
   - **Link** — URL + pillar → fetch + extract (`status`: `queued` →
     `extracted`/`failed`).
   - **Paste text** — title + pillar + textarea → becomes `rawText` directly,
     no fetch, `status` is `extracted` immediately. This is how Pillar 5
     (behavioral/STAR-story cards) work too — they were never going to be
     "articles," just `kind: 'manual'` sources.
5. **Reader screen** (`/library/[id]`) — renders the extracted text, with a
   "Study these N cards" CTA once cards exist for it.
6. **Stats page** — pulled forward from BACKEND_PLAN Phase 4: streak, pillar
   coverage, and specifically the **weak-tags report** (tags with >30% lapse
   rate) — the piece that actually tells you what to re-read, not just
   activity tracking.

**Deliberately deferred:** Claude-based card generation from extracted text.
The very next slice agreed with the user is to get **extraction working
without Claude first** (`Source` schema + extraction service + `GET`/`POST
/sources` + Library/Reader UI), so reading-a-source-end-to-end works before
wiring up LLM card generation as the following step.

---

## Immediate next step

Start here, in order:
1. `Source` Mongoose schema in `apps/api/src/sources/` (matches
   `sourceSchema` in `packages/shared/src/schemas.ts`) + decide/implement the
   1:1 Source↔Deck link (e.g. `Deck.sourceId` back-reference, or auto-create
   a Deck when a Source's status becomes `extracted`).
2. Extraction service: `@mozilla/readability` + `linkedom` for URLs
   (`kind: 'article'`), direct passthrough for pasted text
   (`kind: 'manual'`) — no `pdf-parse`/PDF upload yet unless asked.
3. `GET /sources`, `GET /sources/:id` (includes `rawText`), `POST /sources`
   (zod-validated via `createSourceSchema`, already in shared schemas) —
   no Claude/LLM calls in this pass.
4. Frontend: `/library` (list, kind badge: 🔗 link / ✍️ note / 📄 pdf),
   Add-Source form (Link vs. Paste-text toggle), `/library/[id]` reader
   (render `rawText` as markdown, Literata reading typography already built
   via `CardMarkdown`/`font-reading`), "Study" CTA → `/session` scoped to
   that source's deck (card runner currently hardcodes the one seed deck —
   needs a `deckId` param).

After that: wire Claude-based card generation onto extracted `rawText`
(BACKEND_PLAN.md §6.2-6.3 — prompt template, zod `safeParse` + one retry,
embedding dedup via Voyage, brute-force cosine since deploy target is
self-hosted Mongo, not Atlas).

---

## Useful commands

```bash
# Local dev
docker compose up -d mongo                      # port 27018, not 27017
pnpm --filter @local/api dev                     # api on :3001 (or :3011 if
                                                  # something else already
                                                  # owns :3001 on this Mac)
pnpm --filter @local/web dev                      # web on :3000
pnpm typecheck && pnpm test                       # strict TS + vitest, all packages

# Seed the attention-mechanism deck (idempotent)
MONGODB_URI="mongodb://localhost:27018/local" pnpm --filter @local/api seed:attention-deck

# Redeploy (git-based now)
ssh root@<tailscale-ip-for-apps> "cd /opt/apps/local && git pull && docker compose -f docker-compose.prod.yml up -d --build"
```
