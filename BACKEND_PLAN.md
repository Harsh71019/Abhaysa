# LOCAL — Backend Plan (NestJS + MongoDB)

> **Working name: LOCAL** — a Mumbai local train carries you to work; this app carries you to your next job. Rename freely.
>
> This document is a Claude Code implementation spec. Work phase by phase. Do not skip acceptance criteria. Each phase ends with something runnable.

---

## 1. What this backend does

A content pipeline + daily pack generator for a commute learning PWA.

```
Sources (URLs, PDFs, notes)
        │  ingest
        ▼
Extraction (readability / pdf parse)
        │  chunk
        ▼
LLM Card Generation (Claude API → strict JSON cards)
        │  store + embed
        ▼
MongoDB (cards, decks, reviews, packs)
        │  nightly cron
        ▼
Daily Pack (new cards + FSRS-due reviews, sequenced ~40 min)
        │  single JSON bundle
        ▼
PWA downloads pack over WiFi → fully offline on the train
```

Design constraints that drive every decision:

1. **Offline-first client.** The API's most important endpoint returns one self-contained JSON bundle. No chatty APIs.
2. **Single user (you), multi-user later.** Auth is a simple JWT; don't build orgs/teams.
3. **Interview-prep is the product.** Cards are optimized for *recall and articulation*, not reading pleasure.
4. **This repo IS portfolio.** Write it like you'd want a hiring manager at an AI-first company to read it: clean modules, tests on the pipeline, a great README with the architecture diagram.

---

## 2. Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | NestJS 11 (Fastify adapter) | Your target stack; Fastify for perf |
| DB | MongoDB 7 + Mongoose (`@nestjs/mongoose`) | Flexible card schemas; you asked for Mongo |
| Vector search | MongoDB Atlas Vector Search (or `$vectorSearch` on Atlas free tier) | Keeps one database; real RAG line on resume. Self-host fallback: store embeddings in Mongo, brute-force cosine in Node (fine at <50k cards) |
| LLM | Anthropic SDK (`@anthropic-ai/sdk`) | Card generation, quiz generation, pack sequencing |
| Embeddings | Voyage AI or OpenAI `text-embedding-3-small` | Cheap, good enough for dedup + related-cards |
| Scheduling | `@nestjs/schedule` cron | Nightly pack build. (n8n on your Proxmox can trigger the same endpoint if you prefer visual workflows) |
| Spaced repetition | `ts-fsrs` | FSRS beats SM-2; shared package with frontend |
| Extraction | `@mozilla/readability` + `linkedom`, `pdf-parse` | Article + PDF ingestion |
| Validation | `zod` everywhere, incl. LLM output parsing | LLM JSON must be schema-validated, never trusted |
| Queue | Start with none. Add BullMQ + Redis only if ingestion feels slow | YAGNI |
| Deploy | Docker → your Proxmox LXC (CT100), behind NPMplus, reachable via Tailscale | You already run this stack |

---

## 3. Monorepo layout

```
local/
├── apps/
│   ├── api/                  # NestJS (this plan)
│   └── web/                  # Next.js 16 PWA (see FRONTEND_PLAN.md)
├── packages/
│   ├── shared/               # zod schemas, types, FSRS config — SINGLE SOURCE OF TRUTH
│   └── prompts/              # LLM prompt templates, versioned
├── docker-compose.yml        # mongo + api for local dev
├── CLAUDE.md                 # instructions for Claude Code (below)
└── turbo.json                # turborepo, npm workspaces
```

### CLAUDE.md (drop this at repo root)

```markdown
# LOCAL monorepo

- Package manager: pnpm workspaces + turborepo
- apps/api: NestJS 11, Fastify, Mongoose. apps/web: Next.js 16 PWA.
- All request/response types and card schemas live in packages/shared as zod
  schemas. Never define a card shape twice. Infer TS types with z.infer.
- Every LLM call: (1) prompt template from packages/prompts, (2) response
  parsed with zod safeParse, (3) one retry with error feedback on failure,
  (4) then throw. Never JSON.parse LLM output directly.
- Tests: vitest. The card-generation and FSRS scheduling logic MUST have tests.
- Commits: conventional commits. Small PRs per phase.
- Do not add auth complexity: single-user JWT, seeded from env.
```

---

## 4. Data model (Mongoose collections)

```typescript
// packages/shared/src/schemas.ts — zod first, infer types

Source {
  _id, url?, title, kind: 'article'|'pdf'|'manual'|'youtube-transcript',
  pillar: 'dsa'|'system-design'|'genai'|'behavioral'|'language-internals',
  status: 'queued'|'extracted'|'carded'|'failed',
  rawText?, addedAt
}

Card {
  _id, sourceId?, deckId,
  pillar,                          // same enum as Source
  type: 'concept'                  // front/back explainer
      | 'pattern'                  // DSA: problem → which pattern & why
      | 'quiz-mcq'                 // 4 options, 1 correct, distractor rationale
      | 'articulate'               // "explain X as if in an interview" + model answer
      | 'tradeoff'                 // system design: A vs B, when each wins
      | 'code-read',               // small snippet → "what does this output / what's wrong"
  front: string,                   // markdown
  back: string,                    // markdown, includes WHY not just WHAT
  quiz?: { options: string[], correctIndex: number, explanations: string[] },
  difficulty: 1|2|3,
  estSeconds: number,              // honest reading estimate, target 60–120
  tags: string[],                  // 'sliding-window', 'kafka', 'attention', ...
  embedding?: number[],
  createdAt
}

Deck { _id, title, pillar, description, cardCount, order }

ReviewState {                      // one per card, FSRS state machine
  _id, cardId,
  due: Date, stability, difficulty, elapsedDays, scheduledDays,
  reps, lapses, state: 'new'|'learning'|'review'|'relearning',
  lastReview?
}

Pack {
  _id, date: 'YYYY-MM-DD',
  leg: 'morning'|'evening',        // morning = learn, evening = recall
  cardIds: ObjectId[],             // sequenced
  theme: string,                   // "Attention mechanism, part 2 of 3"
  estMinutes: number,
  status: 'ready'|'consumed'
}

ReviewLog { cardId, packId, grade: 1|2|3|4, tookMs, at }   // 1=again 2=hard 3=good 4=easy
Streak { current, longest, lastActiveDate, cardsTotal, byPillar: {...} }
```

**Indexes:** `ReviewState.due` (the hot query), `Card.deckId`, `Card.tags`, `Pack.date+leg` unique.

---

## 5. NestJS modules

```
src/
├── sources/        # POST /sources (url|pdf upload|raw text), extraction service
├── cards/          # generation service (LLM), CRUD, embedding + dedup
├── decks/
├── packs/          # nightly cron, GET /packs/today?leg=, pack sequencer
├── reviews/        # POST /reviews (batch grades from client), FSRS scheduler
├── stats/          # streaks, pillar coverage, weak-tags report
├── auth/           # single-user JWT (env: AUTH_EMAIL, AUTH_PASSWORD_HASH)
└── llm/            # Anthropic client wrapper: prompt loading, zod parsing, retry, cost logging
```

### Key endpoints (the whole API is small — keep it that way)

```
POST /auth/login                      → { accessToken }
POST /sources                         → queue a URL/PDF/text for ingestion
GET  /sources?status=                 → ingestion dashboard
POST /sources/:id/generate-cards      → run pipeline for one source (manual trigger)
GET  /packs/today?leg=morning         → THE endpoint: full bundle, cards inlined
POST /packs/generate                  → manual regenerate (also hit by cron/n8n)
POST /reviews/batch                   → [{cardId, grade, tookMs, at}] from offline client
GET  /stats/overview                  → streak, due counts, weak tags, pillar coverage
```

`GET /packs/today` returns cards **fully inlined** (no follow-up fetches), gzipped. A 40-minute pack ≈ 20–25 cards ≈ under 200 KB. The client stores it in IndexedDB and never talks to the network again until sync.

---

## 6. The card generation pipeline (the portfolio centerpiece)

### 6.1 Extraction
- Article: fetch → `linkedom` DOM → `Readability` → markdown-ish text.
- PDF: `pdf-parse`, strip headers/footers heuristically.
- Store `rawText` on Source. Fail loudly into `status: 'failed'` with a reason.

### 6.2 Chunk → cards (LLM)
Prompt strategy (in `packages/prompts/card-gen.ts`):

- System prompt establishes the persona: *"You write flashcards for a senior JS/TS engineer preparing for AI-first backend interviews. Cards must survive a noisy Mumbai train: one idea per card, front is a question or prompt, back answers in <120 words and always includes the WHY / the tradeoff / the gotcha. No fluff."*
- Pass the extracted text (chunked to ~6k tokens per call if long).
- Demand **JSON only**, matching the zod `Card` schema, 5–12 cards per chunk.
- For each `concept` card, also ask for one `quiz-mcq` card with **plausible distractors and one-line explanations for why each distractor is wrong** — the distractor explanations are where real learning happens.
- Parse with `safeParse`; on failure, retry once with the zod error message appended. Log token cost per source.

### 6.3 Dedup + linking
Embed `front + back`, cosine-compare against existing cards in the same pillar; if similarity > 0.92, skip and log. This is your legit vector-search story.

### 6.4 Pack sequencing (nightly cron, 05:30 IST)
Morning pack (learn):
1. Pull FSRS `due` reviews (cap at 8) — reviews first, always.
2. Fill remaining budget (~30 min) with **new** cards, preferring: (a) continue yesterday's theme until a deck arc completes, (b) rotate pillars across the week — e.g. Mon/Thu DSA, Tue/Fri system design, Wed GenAI, Sat articulate/behavioral.
3. Interleave: never more than 3 heavy cards in a row; place a quiz after every 2–3 concept cards (retrieval practice).
4. LLM writes a 2-line `theme` intro ("Yesterday: self-attention. Today: multi-head + why it's not just 'more attention'.").

Evening pack (recall): quiz + articulate cards generated **from this morning's cards** plus any remaining due reviews. Encode in the morning, retrieve in the evening — this loop is the entire pedagogical advantage of the app.

### 6.5 FSRS
Use `ts-fsrs` with default params. `POST /reviews/batch` applies grades, updates `ReviewState`, recomputes `due`. Client also runs ts-fsrs locally (shared config from `packages/shared`) so evening review works offline; server is source of truth on sync — last-write-wins by `at` timestamp.

---

## 7. Content strategy (what actually gives you an edge)

Most candidates grind LeetCode passively and read system design summaries. Your edge is **articulation + why + recency**. Seed the pipeline with:

**Pillar 1 — DSA patterns (not problems).** Cards ask "what pattern and why," and "state the invariant of this pattern's window/pointer." Sources: NeetCode pattern write-ups, your own Blind 75 notes, Sean Prashad pattern list. Add `code-read` cards from your own past solutions — reading your own code cold is brutal and effective.

**Pillar 2 — System design from real incidents.** Textbook answers are table stakes; production war stories are memorable in interviews. Ingest actual company engineering posts (list below): Hotstar surviving 25M concurrent cricket viewers, Discord's Cassandra→ScyllaDB migration, Razorpay on payment idempotency, Zerodha running lean on boring tech. A `tradeoff` card citing a real company beats a generic "use a message queue" every time.

**Pillar 3 — GenAI/RAG depth.** Attention/transformers (Illustrated Transformer, Karpathy), embeddings & chunking strategies, agent architectures, evals, MCP. You have the IBM cert; these cards convert it from a certificate line into fluent interview conversation.

**Pillar 4 — JS/TS + Node internals.** Event loop phases, streams, worker threads, V8 memory, TS type-system tricks. This is where "5 years of JS" candidates get separated from "5 years of using frameworks."

**Pillar 5 — Articulation/behavioral.** One card per STAR story (Okta migration, microfrontends, Kafka/gRPC work, SAKSHAM). Front: "Tell me about a time you led a migration." Back: your bullet skeleton. These get scheduled by FSRS like everything else — rehearsed stories sound natural precisely because they're rehearsed.

### Engineering blogs to seed ingestion (global)

- Netflix TechBlog — netflixtechblog.com (chaos engineering, streaming scale)
- Stripe Engineering — stripe.com/blog/engineering (API design gold standard)
- Uber Engineering — uber.com/blog/engineering
- Meta Engineering — engineering.fb.com
- Cloudflare Blog — blog.cloudflare.com (networking depth, incident writeups)
- Discord Engineering — discord.com/category/engineering (DB migrations at scale)
- Slack Engineering — slack.engineering
- Airbnb Engineering — medium.com/airbnb-engineering
- Shopify Engineering — shopify.engineering (Black Friday scale, Rails→modular)
- Figma Engineering — figma.com/blog/engineering (multiplayer, CRDTs, WASM)
- Dropbox Tech — dropbox.tech
- GitHub Engineering — github.blog/engineering
- LinkedIn Engineering — linkedin.com/blog/engineering (Kafka's birthplace)
- ByteByteGo — blog.bytebytego.com (system design distilled; great card fodder)
- High Scalability — highscalability.com (classic architecture case studies)
- AWS Architecture Blog — aws.amazon.com/blogs/architecture
- Martin Fowler — martinfowler.com (patterns, refactoring)

### AI/LLM-specific

- Anthropic Engineering — anthropic.com/engineering (agents, context engineering)
- Hugging Face Blog — huggingface.co/blog
- Pinecone Learning Center — pinecone.io/learn (best free RAG curriculum anywhere)
- LangChain Blog — blog.langchain.dev
- Lilian Weng — lilianweng.github.io (the agent/LLM survey posts)
- Jay Alammar — jalammar.github.io (Illustrated Transformer — card goldmine)
- Eugene Yan — eugeneyan.com (applied ML systems)
- Chip Huyen — huyenchip.com (ML systems design)
- Sebastian Raschka — magazine.sebastianraschka.com (LLM internals)
- Simon Willison — simonwillison.net (LLM practitioner pulse)
- Karpathy — karpathy.ai + YouTube "Zero to Hero" (transcripts ingest well)

### Indian engineering blogs (interviewers here reference these)

- Zerodha Tech — zerodha.tech (Kailash Nadh; radical simplicity, boring-tech-at-scale — contrarian and brilliant)
- Razorpay Engineering — engineering.razorpay.com (payments, idempotency, ledgers)
- Swiggy Bytes — bytes.swiggy.com (logistics ML, real-time dispatch)
- Zomato/Blinkit Engineering — blog.zomato.com/category/technology (10-min delivery architecture)
- Hotstar/JioCinema tech talks — search "Scaling Hotstar" (Gaurav Kamboj's talks; 25M+ concurrency — India's most famous scale story)
- Flipkart Tech — blog.flipkart.tech (Big Billion Days scale)
- PhonePe Tech — tech.phonepe.com (UPI-scale transactions)
- Dream11 Engineering — medium.com/dream11-tech-blog (spiky concurrency, match-start thundering herd)
- Meesho Tech — medium.com/meesho-tech
- CRED Tech — engineering.cred.club
- Postman Engineering — blog.postman.com/engineering (Indian-founded, API-first)
- Hasura Blog — hasura.io/blog (Indian-founded, GraphQL engines)
- InfoQ + The GeekNarrator podcast (Kaivalya Apte) — Indian-hosted deep dives; transcripts are ingestible

---

## 8. Build phases for Claude Code

### Phase 0 — Skeleton (1 evening)
Scaffold monorepo, NestJS app with Fastify, Mongo via docker-compose, health endpoint, `packages/shared` with zod schemas above, CLAUDE.md.
**Accept:** `pnpm dev` boots api+mongo; `GET /health` → 200; schemas compile and are imported by api.

### Phase 1 — Cards & decks CRUD + seed (1 evening)
Mongoose models, decks/cards modules, a seed script that loads 20 handwritten cards on the attention mechanism (write these with Claude in chat, commit as JSON fixture).
**Accept:** seeded cards queryable; zod validates on write.

### Phase 2 — Packs + FSRS (the core, 2–3 evenings)
ReviewState, ts-fsrs scheduler, pack sequencer service, `GET /packs/today`, `POST /reviews/batch`, nightly cron. **Test the sequencer and FSRS transitions with vitest — this is the logic that must not be wrong.**
**Accept:** generate morning pack from seed deck; post grades; evening pack contains morning's quiz cards; tomorrow's pack contains due reviews.

### Phase 3 — LLM pipeline (2–3 evenings)
llm module (prompt loading, zod-parse-retry, cost log), sources module, extraction, card generation, quiz generation, embedding dedup.
**Accept:** `POST /sources` with the Illustrated Transformer URL → 15+ valid cards land in a deck; posting the same URL again produces ~0 new cards (dedup works); failed parse retries once then fails loudly.

### Phase 4 — Stats + auth + deploy (1–2 evenings)
Streaks, weak-tags report (tags with lapse rate > 30%), JWT auth, Dockerfile, deploy to Proxmox CT100 behind NPMplus + Tailscale, cron verified in IST.
**Accept:** you can hit the API from your iPhone over Tailscale; pack regenerates at 05:30 IST.

### Phase 5 — Polish for portfolio (ongoing)
README with the pipeline diagram, a `docs/decisions/` folder with 4–5 short ADRs (why Mongo, why FSRS over SM-2, why inline bundles, why no queue yet), GlitchTip error reporting (you self-host it), token-cost dashboard endpoint.

### Prompts to hand Claude Code (one per phase)

```
Phase 2 example:
"Read CLAUDE.md and packages/shared/src/schemas.ts. Implement the packs and
reviews modules per BACKEND_PLAN.md section 5–6. Use ts-fsrs with default
parameters from packages/shared/fsrs.ts. The sequencer must: reviews first
(cap 8), then new cards to fill estMinutes<=35, max 3 concept cards
consecutively, quiz card after every 2-3 concept cards. Write vitest tests
for: FSRS state transitions for grades 1-4, sequencer interleaving rules,
and the morning->evening quiz derivation. Do not touch the llm module."
```

---

## 9. Guardrails (things Claude Code should NOT do)

- No microservices, no Kubernetes, no Redis until a measured need. One API, one Mongo.
- No admin UI — Bruno/Insomnia collection committed to `/tools` is the admin UI.
- No multi-tenancy abstractions. `userId` fields exist but everything assumes one user.
- Never let LLM output touch the DB without zod validation.
- Cost ceiling: log tokens per source; card generation for one article should stay under ~₹10. If it doesn't, chunking is wrong.
