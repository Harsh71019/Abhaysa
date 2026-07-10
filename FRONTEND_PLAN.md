# LOCAL — Frontend Plan (Next.js 16 PWA)

> Claude Code implementation spec for the iPhone-installable PWA. Pairs with BACKEND_PLAN.md. The design direction here is deliberate — follow it exactly; do not substitute generic dashboard aesthetics.

---

## 1. Product frame

One user, one job: **turn a Malad→Vikhroli commute into interview prep.** The app is used standing in a moving Mumbai local, one hand on a pole, one thumb free, patchy network, 40 minutes. Every design and engineering decision below follows from that sentence.

Hard implications:

1. **Offline is the default state, not the fallback.** The app must be 100% functional in a tunnel. Network is a background luxury.
2. **One-thumb, bottom-anchored UI.** Nothing interactive in the top third of the screen. Tap targets ≥ 56px. No precision gestures — the train shakes.
3. **Glanceable in bright sun and dim carriage.** High contrast both themes.
4. **Sessions, not browsing.** The app opens into *today's pack*, not a menu. Zero decisions before the first card.

---

## 2. Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 16, App Router, TypeScript | Turbopack default; async `params`/`cookies()`; `proxy.ts` (the renamed middleware) for auth redirect |
| PWA | `@serwist/next` | Maintained successor to next-pwa; precache app shell, runtime cache fonts |
| Offline data | Dexie (IndexedDB) | Packs, cards, pending review grades |
| State | Zustand (session state) + Dexie live queries | No React Query needed — the API surface is 3 calls |
| Animation | `motion` (Framer Motion) | Card transitions, board flip; respect `prefers-reduced-motion` |
| Spaced repetition | `ts-fsrs` from `packages/shared` | Grades computed on-device, synced later |
| Styling | Tailwind CSS v4 + CSS variables for the token system below | |
| Markdown cards | `react-markdown` + `shiki` for code highlighting | Shiki themes matched to both app themes |
| Fonts | Self-hosted via `next/font/local` | Zero external requests — offline rule |

**Not** using: Redux, tRPC, server components for the session flow (session screens are client components hydrated from IndexedDB — the network may not exist).

---

## 3. Design direction — "Indicator Board"

### Concept
The visual world is the Mumbai local itself: the amber dot-matrix **train indicator boards** and the yellow enamel **platform signage**. Not as decoration — as the app's information system. A daily learning pack *is* a departure: it has a time, a destination, a platform, an on-time status. The metaphor does real work.

### The two themes are the two commutes
- **Day theme — "Platform"**: warm signage-yellow paper, near-black ink. Used for the **morning (learn) leg**.
- **Night theme — "Indicator"**: carriage-dark ink, amber phosphor text. Used for the **evening (recall) leg**.

Theme follows the active pack's leg automatically (overridable in settings). Opening the app in the evening *feels* different from the morning — the product teaches its own rhythm.

### Tokens

```css
/* Ink & paper */
--ink:        #14171A;  /* night background / day text */
--ink-soft:   #23282E;  /* night surface (cards) */
--paper:      #F6E9B8;  /* day background — enamel signage yellow-cream */
--paper-edge: #E8D48F;  /* day borders/dividers */

/* Signals */
--amber:      #FFB300;  /* the indicator phosphor — primary accent, night */
--signal-go:  #2E9E5B;  /* correct answer / streak alive */
--signal-stop:#D64545;  /* wrong answer / lapsed card */

/* Pillar hues (thin left-border on each card, its only decoration) */
--dsa:        #E8833A;  /* Western line brown-orange */
--sysdesign:  #6B5CA5;  /* rake violet */
--genai:      #2E86AB;  /* Harbour line blue */
--jsts:       #C9A227;  /* brass */
--behavioral: #2E9E5B;
```

### Typography (three roles, all self-hosted)
- **Board/display: Archivo Variable**, SemiExpanded, 600–700, ALL-CAPS with +6% tracking, **tabular numerals**. Used only for the Indicator board, timers, counts, streaks. This face *is* the signage voice.
- **Reading: Literata Variable** (opsz axis on). Card fronts/backs are set in a face literally designed for long-form screen reading — 17–18px, 1.6 line-height, max 34ch. A serif reading surface inside a transit-industrial shell is the pairing that makes this app not look like every Tailwind project.
- **Code: JetBrains Mono**, 14px, shiki-highlighted.

### Signature element: The Indicator
The home screen is dominated by a departure board rendered as the day's pack:

```
┌─────────────────────────────────────┐
│  0 7 : 4 0   F A S T                │   ← Archivo SemiExpanded, board flip-in
│  TO: NEXT ROLE                      │
│  ─────────────────────────────────  │
│  ATTENTION MECHANISM · PT 2/3       │
│  22 CARDS · 34 MIN · 6 DUE          │
│  STATUS: ON TIME                    │   ← "DELAYED" if yesterday skipped
│                                     │
│         [ BOARD NOW → ]             │   ← the only CTA, bottom thumb zone
└─────────────────────────────────────┘
```

- On load, rows flip in top-to-bottom over ~600ms (staggered clip-path or split-flap style; a single orchestrated moment — no other page transitions animate).
- Streak is expressed in-world: `STATUS: ON TIME · 14 DAYS RUNNING`. Miss a day → `DELAYED`, and the amber row renders in `--signal-stop`. Guilt, but in the metaphor's voice.
- `prefers-reduced-motion`: rows fade, no flip.

### Everything else is quiet
Cards are plain surfaces: 16px radius, 1px border, pillar-colored 3px left edge, generous padding, no shadows, no gradients, no icons except where meaning requires one (Lucide, 1.5px stroke). The Indicator is the one loud thing; the reading experience is a calm book page. Chanel rule applied in advance.

---

## 4. Screens & flows

```
/                    → Today (The Indicator + BOARD NOW)
/session             → Card runner (the core loop, fully offline)
/session/summary     → End-of-ride: grades recap, streak update, "alight here"
/stats               → Streak, pillar coverage bars, weak-tags list, review forecast
/library             → Decks & upcoming themes; add a source URL (POSTs to backend)
/settings            → Theme override, pack size, Tailscale API base URL, sync log
/install             → iOS Add-to-Home-Screen walkthrough (see §6)
```

### The card runner (where 95% of time is spent)
- One card fills the viewport. Content top, controls bottom.
- **Concept/pattern cards:** tap anywhere (or swipe up) to reveal the back. Then the FSRS grade bar appears, bottom-anchored, 4 buttons: `AGAIN · HARD · GOOD · EASY` — full-width row, 56px tall, thumb-reachable. **Grading is taps, never swipes** — four-way swipe grading fails on a shaking train.
- **Quiz cards:** 4 stacked option buttons; on tap, instant color feedback (`--signal-go`/`--signal-stop`) + the distractor explanation slides up. Wrong answer auto-schedules the card `AGAIN`.
- **Articulate cards:** front is the interview question + a 60s optional countdown (Archivo tabular numerals); you answer *in your head or muttering like a proper train weirdo*, tap to reveal the model answer skeleton, self-grade.
- Progress: a thin amber line across the top edge — station-to-station, each card a stop. No "3/22" counters screaming at you.
- Session state persists to IndexedDB after **every** interaction. Kill the app mid-tunnel, reopen, same card.

### Session summary
"You alighted at VIKHROLI." Cards seen, accuracy, streak status, and one line the backend precomputed: *"Weak today: Kafka ordering. It returns tomorrow."* Sync happens here if network exists; otherwise a quiet `WILL SYNC` chip.

---

## 5. Offline architecture

```
Serwist precache: app shell, fonts, icons        (install time)
Dexie tables:     packs, cards, reviewLogs(pending), meta

Morning on WiFi (or Tailscale):
  GET /packs/today?leg=morning  → write pack+cards to Dexie → badge "READY"
On the train:
  everything reads/writes Dexie only; ts-fsrs runs locally
Back on network (visibilitychange / online event / app foreground):
  POST /reviews/batch (pending logs) → clear queue
  prefetch evening pack if after 14:00 IST
```

Rules for Claude Code:
- **No fetch calls from session screens.** The session flow imports only from `lib/db.ts`.
- Sync is a single idempotent function `syncNow()` invoked from event listeners + a manual button in settings. Review logs carry client timestamps; server is last-write-wins.
- Storage: call `navigator.storage.persist()` on first run; keep total pack storage < 50 MB (prune packs older than 14 days).

---

## 6. iOS PWA deep-dive (the part everyone gets wrong)

What iOS gives an installed PWA, and how we use it:

1. **Install path:** Safari → Share → **Add to Home Screen**. There is **no `beforeinstallprompt` on iOS** — build the `/install` walkthrough screen with the actual share-sheet icons, shown on first visit when `!window.matchMedia('(display-mode: standalone)').matches`.
2. **Manifest:** `display: "standalone"`, `id`, `start_url: "/?src=pwa"`, both theme colors via `"theme_color"` + `<meta name="theme-color" media="(prefers-color-scheme: …)">`. Maskable icon (512, `purpose: "maskable"`).
3. **Icons/splash:** iOS ignores most manifest icons — ship `apple-touch-icon` (180×180) and generate `apple-touch-startup-image` links per device with `pwa-asset-generator` (splash = the Indicator board frame, so launch feels instant).
4. **Standalone chrome:** `viewport-fit=cover`; pad with `env(safe-area-inset-top/bottom)`; status bar via `apple-mobile-web-app-status-bar-style: black-translucent` in night theme.
5. **Viewport height:** use `100dvh`, never `100vh`. Prevent rubber-band scroll on the card runner with `overscroll-behavior: none`.
6. **No Background Sync API on iOS.** All sync is foreground: `visibilitychange`, `online`, and app-open. Design accepts this (§5).
7. **Push notifications** work on iOS 16.4+ **only for installed PWAs**: one daily push, "PACK READY · 07:40 FAST", via web-push from the backend cron. Ship this in Phase 4, not day one.
8. **Storage eviction:** Safari can evict site data after 7 days of non-use for *browser tabs*; home-screen installed apps are treated more durably, and `storage.persist()` + daily use makes this a non-issue — but never store the *only* copy of anything on device: review logs are queued for server sync.
9. **No `navigator.vibrate` on iOS** — don't build haptic feedback around it; use motion + color as feedback.
10. **Test in the real environment:** airplane mode, standing, one thumb. That's the acceptance test for every screen.

---

## 7. Design & engineering blogs — the taste diet

Read these to build the app *and* to become the engineer whose frontend taste shows up in interviews.

### Product/UI craft
- Linear — linear.app (study the app itself + their "how we build" posts; the quality bar)
- Stripe — stripe.com/blog/engineering + their docs (docs as product design)
- Vercel Design / Geist — vercel.com/design (design-system thinking)
- Rauno Freiberg — rauno.me (interaction craft; his "Invisible details of interaction design" is required)
- Emil Kowalski — emilkowal.ski (animation taste; built sonner/vaul)
- Josh W. Comeau — joshwcomeau.com (CSS/interaction deep dives)
- Brian Lovin — brianlovin.com (app dissections)
- Refactoring UI (Wathan/Schoger) — the book; read once, apply forever
- Nielsen Norman Group — nngroup.com (evidence over vibes)
- Mobbin — mobbin.com (real app pattern reference when designing a screen)

### Indian design & product
- CRED Design — long-form case studies from design.cred.club / their Medium; India's most opinionated consumer design org
- Obvious — obvious.in/blog (Bangalore studio behind major Indian fintech apps; strong on design systems + accessibility for Indian users)
- Zerodha / Kailash Nadh — nadh.in (essays on radical simplicity — a design philosophy disguised as engineering posts)
- Groww Engineering & Design — medium.com/groww-engineering (fintech UX for Bharat-scale users)
- Postman Design — postman.com/company/blog (design systems at an Indian-founded devtool)

### Frontend engineering depth (interview-relevant)
- web.dev + Chrome Developers — performance, PWA canon
- Jake Archibald — jakearchibald.com (service workers, event loop — his talks are card goldmines)
- Addy Osmani — addyosmani.com (perf patterns)
- Dan Abramov — overreacted.io (React mental models)
- Nolan Lawson — nolanlawson.com (IndexedDB/perf in the real world)
- TkDodo — tkdodo.eu (React patterns, query thinking)
- Vercel Engineering — vercel.com/blog/category/engineering (Next.js internals)

Feed the best of these into the backend ingestion pipeline — your taste diet and your card supply are the same list.

---

## 8. Build phases for Claude Code

### Phase 0 — Shell + tokens (1 evening)
Next.js 16 app in `apps/web`, Tailwind v4 wired to the CSS variables in §3, fonts self-hosted, both themes switchable, base layout with safe-area padding.
**Accept:** Lighthouse PWA installability passes except SW; themes toggle; fonts load with zero network requests after first load.

### Phase 1 — The Indicator + mock pack (1–2 evenings)
Home screen with the departure board (flip-in animation, reduced-motion fallback), reading a **local JSON fixture pack** (copy the 20-card seed from the backend repo). No network at all yet.
**Accept:** the board renders real pack data; BOARD NOW navigates to an empty session route; it already looks like nothing else.

### Phase 2 — Card runner (the core, 2–3 evenings)
All five card types, reveal interaction, FSRS grade bar wired to `ts-fsrs` locally, quiz feedback states, progress line, Dexie persistence of session position + grades.
**Accept:** full 20-card session in airplane mode; force-quit mid-session resumes exactly; grades produce correct FSRS next-due values (assert in vitest against shared fixtures).

### Phase 3 — Real sync + PWA (2 evenings)
Serwist service worker, manifest + iOS meta/splash assets, Dexie sync layer (`GET /packs/today`, `POST /reviews/batch` over Tailscale), `/install` walkthrough, session summary screen.
**Accept:** installed from Safari to home screen on your iPhone 16 Plus; morning pack downloads on WiFi; entire session works in airplane mode; grades appear in Mongo after reconnecting.

### Phase 4 — Stats + push + polish (2 evenings)
Stats screen (streak, pillar bars, review forecast), web-push "pack ready" notification, shiki code themes, prune old packs, error reporting to your GlitchTip.
**Accept:** push arrives at 07:15 IST on the installed app; stats match server `/stats/overview`.

### Prompt to hand Claude Code (Phase 2 example)

```
"Read FRONTEND_PLAN.md sections 3–5 and packages/shared. Build the /session
card runner: five card types rendered from the Dexie 'packs' table, tap-to-
reveal, bottom-anchored 56px FSRS grade bar (taps only, no swipe grading),
quiz option feedback using --signal-go/--signal-stop with distractor
explanation slide-up, thin amber top progress line. Persist session cursor
and grades to Dexie after every interaction. No fetch calls anywhere in
/session. Respect prefers-reduced-motion. Add vitest tests for the FSRS
grading integration using fixtures from packages/shared."
```

---

## 9. Quality bar & guardrails

- **Performance budget:** first load JS < 150 kB gzipped for the session route; LCP < 1.5s on a mid 4G throttle; the app is competing with Instagram's open-speed — that's the real rival.
- **A11y floor:** visible focus rings, 4.5:1 contrast in both themes (test amber-on-ink!), all controls labeled, reduced-motion respected.
- Claude Code must **not**: add component libraries (no shadcn here — the design system is 10 components, own them), add gradients/glassmorphism/shadows, put interactive controls in the top third of the screen, or introduce network calls into session screens.
- Every screen ships with its airplane-mode behavior defined. "What does this do offline?" is part of the definition of done.
