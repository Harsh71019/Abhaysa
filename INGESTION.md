# INGESTION — adding sources to LOCAL

Reference for whoever (or whatever) is registering new `Source` documents:
an AI agent scripting bulk ingestion, a one-off curl command, or a human
using the `/library/add` form. This describes the `POST /sources` contract
in enough detail to drive it without reading the NestJS source.

Schema source of truth: `packages/shared/src/schemas.ts`
(`sourceSchema`, `createSourceSchema`). Implementation:
`apps/api/src/sources/`.

---

## 1. What happens when you POST a source

`POST /sources` is synchronous — the request doesn't return until extraction
either succeeds or fails. There is no queue/worker yet (Phase 3.5 scope).

1. A `Source` document is created with `status: "queued"`.
2. Extraction runs immediately:
   - `kind: "manual"` → the `rawText` you sent is used as-is (no fetch).
   - `kind: "article"` → the server fetches `url`, runs
     `@mozilla/readability` over the HTML, and uses the extracted article
     text.
3. On success: `status` becomes `"extracted"`, `rawText` is set, and a new
   `Deck` is auto-created and linked via `deckId` on the Source (1 Source =
   1 Deck — see HANDOFF.md). The deck starts with 0 cards; card generation
   from `rawText` is a separate, not-yet-built step (BACKEND_PLAN.md
   §6.2–6.3).
4. On failure (bad URL, non-200 response, readability finds no article
   content): `status` becomes `"failed"` and `failureReason` holds a short
   message. This is a normal `201`/`200` response, not an HTTP error — check
   `status` in the response body, don't rely on the HTTP status code alone.

Only `kind: "article"` and `kind: "manual"` can be created right now.
`"pdf"` and `"youtube-transcript"` exist in the schema for later but
`POST /sources` will reject them with a 400 (zod refine).

---

## 2. Endpoints

Base URL: `http://localhost:3011` in local dev (see
`local-dev-mongo-port-conflict` note — port 3001 is usually taken by
unrelated infra on the dev Mac, so the API falls back to 3011; confirm with
`curl localhost:3011/health` before assuming). In prod, the Tailscale host
on port 3005.

No auth guard is wired up on `/sources` yet (single-user JWT exists for
future use but isn't enforced here) — don't rely on that remaining true;
check `apps/api/src/sources/sources.controller.ts` before scripting against
a non-local deployment.

### `POST /sources`

**Paste-text / manual mode** (STAR stories, hand-written notes — this is
also how Pillar 5 behavioral cards get seeded):

```bash
curl -X POST http://localhost:3011/sources \
  -H "Content-Type: application/json" \
  -d '{
    "title": "STAR: migrating billing off the legacy monolith",
    "kind": "manual",
    "pillar": "behavioral",
    "rawText": "Situation: ... Task: ... Action: ... Result: ..."
  }'
```

**Link / article mode** (fetch + readability extraction):

```bash
curl -X POST http://localhost:3011/sources \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Illustrated Transformer",
    "kind": "article",
    "pillar": "genai",
    "url": "https://jalammar.github.io/illustrated-transformer/"
  }'
```

Field rules (`createSourceSchema`):

| field     | required when          | notes                                      |
|-----------|-------------------------|---------------------------------------------|
| `title`   | always                  | non-empty string                             |
| `kind`    | always                  | `"article"` \| `"manual"` only               |
| `pillar`  | always                  | `dsa` \| `system-design` \| `genai` \| `behavioral` \| `language-internals` |
| `url`     | `kind: "article"`       | must be a valid URL, the article's own permalink — not a blog homepage |
| `rawText` | `kind: "manual"`        | non-empty string, used verbatim              |

Response is a `Source` object (see `sourceSchema`): `_id`, `title`, `kind`,
`pillar`, `status`, plus whichever of `url` / `rawText` / `failureReason` /
`deckId` apply.

Validation errors come back as `400` with zod's `flatten()` shape:
`{ formErrors: [], fieldErrors: { rawText: ["rawText is required for kind 'manual'"] } }`.

### `GET /sources?status=` 

Lists sources, newest first. `status` query param is optional
(`queued` | `extracted` | `carded` | `failed`).

### `GET /sources/:id`

Single source, includes `rawText` if extracted.

---

## 3. Bulk-seeding from the curated blog list

BACKEND_PLAN.md §7 has a curated list of ~40 engineering blogs across five
pillars. That list is blog **homepages** — for ingestion you need individual
**post URLs** (readability needs an actual article page, not an index).
When bulk-seeding:

1. Pick specific posts from each blog (don't just POST the homepage).
2. Map each to the closest pillar:

   | Source category (BACKEND_PLAN §7)              | `pillar`          |
   |--------------------------------------------------|--------------------|
   | Company engineering blogs, ByteByteGo, High Scalability, AWS Architecture, Martin Fowler, Indian eng blogs (Zerodha/Razorpay/Swiggy/etc.) | `system-design`   |
   | Anthropic/HuggingFace/Pinecone/LangChain/Lilian Weng/Jay Alammar/Eugene Yan/Chip Huyen/Raschka/Simon Willison/Karpathy | `genai`           |
   | NeetCode/Blind 75/Sean Prashad pattern write-ups  | `dsa`             |
   | Node/JS/V8/TS internals pieces                    | `language-internals` |
   | Your own STAR stories (always `kind: "manual"`)   | `behavioral`      |

3. POST sequentially, not in parallel — each request does a live fetch
   against a third party; a burst of concurrent requests against ~40
   different domains is fine, but retries/backoff aren't implemented, so
   don't hammer a single slow domain in a loop.
4. After each POST, check `status` in the response. If `"failed"`, log
   `failureReason` and move on — common causes are anti-bot pages (Medium,
   some Substack), paywalls, or JS-rendered content readability can't see
   (no headless browser here, just `fetch` + `linkedom`).
5. This registers `Source` + auto-creates the linked `Deck`. It does **not**
   generate cards — that's the deliberately-deferred next phase
   (BACKEND_PLAN.md §6.2–6.3, Claude-based generation from `rawText`).

### Minimal bulk-seed script shape

```ts
const sources: { title: string; url: string; pillar: string }[] = [
  { title: "...", url: "https://...", pillar: "system-design" },
  // ...
];

for (const s of sources) {
  const res = await fetch("http://localhost:3011/sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: s.title, kind: "article", pillar: s.pillar, url: s.url }),
  });
  const body = await res.json();
  console.log(body.status === "extracted" ? "OK  " : "FAIL", s.title, body.failureReason ?? "");
}
```

This matches the "Planned simplification (Phase 3)" bulk-seed approach
noted in project memory — a real script (`apps/api/src/seed/` or a
one-off) can replace the loop above when Phase 3 lands; until then this
snippet is enough for an AI agent to drive ad hoc.

---

## 4. What this does *not* do yet

- No card generation from `rawText` (next phase, not this one).
- No dedup — POSTing the same URL twice creates two Sources and two Decks.
- No PDF upload, no YouTube transcript ingestion.
- No background queue — a slow/hanging fetch blocks that one request until
  it times out; there's no per-request timeout set explicitly today, so a
  truly hung server on the other end will hang the request.
