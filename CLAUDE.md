# LOCAL monorepo

- Package manager: pnpm workspaces + turborepo.
- apps/api: NestJS 11, Fastify, Mongoose. apps/web: Next.js 16 PWA.
- All request/response types and card schemas live in packages/shared as zod
  schemas. Never define a card shape twice. Infer TS types with z.infer.
- Every LLM call: (1) prompt template from packages/prompts, (2) response
  parsed with zod safeParse, (3) one retry with error feedback on failure,
  (4) then throw. Never JSON.parse LLM output directly.
- TypeScript strict mode everywhere (tsconfig.base.json at repo root: strict,
  noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitOverride).
  Every package/app tsconfig extends it. Do not weaken these flags locally.
- Vector search: self-hosted MongoDB (Proxmox docker-compose), not Atlas.
  `$vectorSearch` is Atlas/Enterprise-only and unavailable here. Dedup uses
  brute-force cosine similarity in Node over stored embeddings — fine at
  <50k cards. Embeddings provider: Voyage AI.
- Tests: vitest. The card-generation and FSRS scheduling logic MUST have tests.
- Commits: conventional commits. Small PRs per phase.
- Do not add auth complexity: single-user JWT, seeded from env.
