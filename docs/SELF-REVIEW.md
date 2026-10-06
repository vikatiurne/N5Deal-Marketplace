# Self-review — N5Deal Marketplace test assignment

Final deliverable for `docs/tasks/10-TESTS-DOCS-DEPLOY.md`. Everything below was
executed on this machine, not asserted from memory; commands are reproducible.

---

## 1. Test run summary

```
$ npm test

 Test Files  7 passed (7)
      Tests  191 passed (191)
   Duration  1.2s
```

| File                                     | Tests | What it covers                                                                                                                        |
| ---------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/db/repositories/assets.test.ts` | 47    | filters, sort, pagination + `total`, ownership, inbox counters, inquiries, suspended-seller visibility against a real SQLite database |
| `src/lib/validation/assets.test.ts`      | 38    | catalogue query-string contract (CSV lists, repeated params, ranges)                                                                  |
| `src/lib/validation/seller.test.ts`      | 28    | asset form, status actions, buyer search, seller message, mark-as-read                                                                |
| `src/lib/validation/buyer.test.ts`       | 23    | buyer profile, budgets, inquiry message                                                                                               |
| `src/lib/validation/manager.test.ts`     | 21    | moderation filters, audit action mapping, manager immutability                                                                        |
| `src/lib/ai/smartSearch.test.ts`         | 17    | `parseQuery` with a mocked `LlmClient`: code fences, garbage, timeouts                                                                |
| `src/lib/validation/auth.test.ts`        | 17    | login and registration, no self-registered `MANAGER`                                                                                  |

Quality gates, all green:

| Gate             | Command                | Result                                 |
| ---------------- | ---------------------- | -------------------------------------- |
| Tests            | `npm test`             | 191/191, 7 files                       |
| Types            | `npx tsc --noEmit`     | no errors                              |
| Lint             | `npm run lint`         | no errors or warnings                  |
| Formatting       | `npm run format:check` | all files match                        |
| Production build | `npm run build`        | compiled, 21/21 static pages generated |

Tests never touch developer data: `test/globalSetup.ts` points `DATABASE_URL` at
`prisma/test.db` and resets only that file (`fileParallelism: false`, the files
share one schema).

**Fresh-clone verification** (per DoD: "Fresh clone + README commands → working
app"). Run in `/tmp/n5clone` with the README quick start, no edits:

```bash
cp .env.example .env
echo "AUTH_SECRET=\"$(openssl rand -base64 32)\"" >> .env
npm ci                      # exit 0
npx prisma migrate dev      # 3 migrations applied
npm run db:seed             # Seed complete: 9 users, 3 audit logs, 5 profiles, 24 assets, 10 inquiries
npm test                    # 191/191
npm run dev
```

Observed on the running server: `/assets` → 200, 20 published listings in the
header (12 per page; the 1 draft, 1 paused and 2 suspended-seller rows are
hidden), `/manager` as a guest → 307 to `/login`, `POST /api/smart-search` with a bad body
→ 400, with `{"query":"cheap emi"}` → 200 + degraded keyword fallback,
`GET /api/smart-search` → 405, malformed query `?priceMin=abc` → 200 with default
filters (never crashes).

## 2. Live URL

**https://minimarketplace-six.vercel.app** — Vercel (project `minimarketplace`),
database on Neon Postgres, seeded with the same 9 users / 24 assets / 10
inquiries as local.

How it runs on Postgres while the repo stays on SQLite (the constraint from
`00-CONTEXT.md`):

- `vercel.json` `buildCommand` rewrites `provider = "sqlite"` →
  `"postgresql"` **inside the build container only**, then
  `prisma generate && next build`. The committed schema, migrations and local
  scripts are untouched; `npm run dev` / `npm run build` stay on SQLite.
- Env on Vercel (`vercel env add … production`): `DATABASE_URL` (pooled),
  `DIRECT_URL`, `AUTH_SECRET`.
- Schema was applied to Neon with `prisma db execute` from a
  `prisma migrate diff` baseline (identical to the earlier verified one), then
  seeded once from this machine under a temporary provider swap that restored
  itself — `npm test` ran green immediately after.
- No `OPENAI_API_KEY` on purpose: smart search runs in its documented keyword
  fallback.

Verified against the live URL with curl: guest → `/buyer` 307 to `/login`;
buyer login → `/buyer` 200, `/buyer/inquiries` 200, wrong role → own home;
manager → `/manager` 200, `/manager/users` 200; `seller3` login refused with
`code=account_suspended`; `/assets` renders **20 published assets** from Neon;
`POST /api/smart-search` → 400 on bad body, 200 degraded, GET → 405.

Live testing caught one real bug the local environment could not: `getToken` in
`src/middleware.ts` was called without `secureCookie`, so on HTTPS it looked for
`authjs.session-token` while Auth.js had issued `__Secure-authjs.session-token`
(the decryption salt follows the cookie name) — every authenticated page read as
anonymous. Fixed in the same deployment; the reason is in the commit message.

## 3. Self-review against the original task

### Constraints and chosen stack (`00-CONTEXT.md`)

- [x] Next.js 15 App Router, TypeScript `strict`, `src/` layout
- [x] Persistence — data survives reload (Prisma + SQLite, 3 migrations, seed)
- [x] Working app, not static screens — every list/form/mutation hits the server
- [x] n5deal.com used only as visual reference: dark theme, card-based layout,
      professional fintech feel; no page copied 1:1
- [x] Chosen stack respected: Auth.js v5 Credentials + JWT, Tailwind + shadcn,
      Zod, Vitest — no dependency invented outside the tasks
- [x] Domain vocabulary used verbatim: `Asset`, `BuyerProfile`, `Inquiry`,
      `licenseType`, `jurisdiction`, `status`, `assetStatus`

### Roles and capabilities

- [x] **Seller** — publish asset, browse buyers, filter/search buyers, contact buyer
- [x] **Buyer** — create & maintain profile, describe acquisition interests,
      browse assets, filter/search assets, contact seller
- [x] **Platform Manager** — see buyers/sellers/assets, search and filter members
      and assets, suspend or soft-delete non-compliant members

### Working agreements

- [x] Every user input goes through Zod (`src/lib/validation/*`, incl. AI output)
- [x] All DB access goes through `lib/db/*` repositories — components never
      import `prisma`
- [x] Server actions over REST; the single REST endpoint is `/api/smart-search`,
      which a client component cannot invoke any other way
- [x] No new dependency without a stated reason (sheet reuses `radix-ui`,
      screenshots captured via CDP instead of a browser package)
- [x] Read `00-CONTEXT.md` before every task; no task started before the previous
      DoD was met (commit history is one commit per task, in order)

### Task DoD highlights

- [x] **01 scaffold** — folder structure, shadcn primitives, all four gates
- [x] **02 data model** — models/enums as specified, migrations, 24-row seed
- [x] **03 auth** — each role lands on its home; suspended login rejected with
      `account_suspended`; register offers only BUYER/SELLER
- [x] **04 public listings** — `/assets` renders **20 `PUBLISHED`** listings (24
      rows: 1 draft, 1 paused, 2 owned by the suspended seller are hidden);
      filters narrow correctly; shareable URLs
- [x] **05 buyer flow** — completeness indicator, matched listings, profile
      persists after refresh, inquiry appears in `/buyer/inquiries`
- [x] **06 seller flow** — status counters, own-assets table with
      publish/pause/soft-delete, draft vs publish form, buyer search, inbox with
      unread counts
- [x] **07 manager flow** — dashboard counts, user/asset moderation with confirm
      dialogs, `MANAGER` guard, `AuditLog` written on every mutation,
      `/manager/audit` paginated and filterable
- [x] **08 smart search** — strict JSON prompt, **Zod-validated output with
      keyword fallback**, explanation banner, 10 req/min rate limit,
      `.env.example` keys, `parseQuery` unit-tested with a mock
- [x] **09 polish** — skeletons, `error.tsx` / `not-found.tsx`, toast on every
      mutation, AA contrast measured and documented, responsive nav, tables use
      the documented horizontal-scroll option, screenshots attached
      (`docs/screenshots/`)
- [x] **10 tests/docs/deploy** — this document, `README`, `ARCHITECTURE`,
      `DEMO.md`, the live deployment (§2)

### Definition of Done (Task 10)

- [x] `npm test` passes — 191 tests
- [x] Fresh clone + README commands → working app locally (verified in `/tmp`)
- [x] Live URL accessible — https://minimarketplace-six.vercel.app (§2)
- [x] `ARCHITECTURE.md` contains every required section: problem & roles, stack
      table with per-row justification, data-model diagram, all six trade-off
      decisions (SQLite → Postgres, inquiry direction, JSON vs join tables,
      server actions vs REST, Zod-validated AI, JWT auth), what I would do
      differently, known limitations

### Output format (as requested)

- [x] Test run summary with pass count — §1
- [x] Live URL — §2
- [x] Final self-review checklist — §3

## 4. Deviations, assumptions, and honest gaps

Deliberate deviations from a literal reading of the spec, all documented in
`ARCHITECTURE.md`:

1. **No LLM key in production.** No provider key was provisioned for the
   deployment, so on the live URL smart search always answers in keyword-fallback
   mode — exactly the degraded path the unit tests pin.
2. **SQLite stays the dev/test database** even though production runs on Neon —
   `00-CONTEXT.md` fixes the dev stack. The swap lives only in the Vercel build
   command (§2), so both coexist without touching the repo.
3. **`notFound()` answers 200 + `noindex`.** Next.js streaming root layout; the
   404 screen itself renders. Not fixable without restructuring routes — noted
   as a limitation.
4. **Mobile tables scroll horizontally instead of collapsing into cards.** The
   task allowed either choice; comparison-by-column was the reason, and the
   wrapper became a keyboard-accessible scroll region (WCAG 2.1.1).
5. **One inquiry per `(asset, buyer)` per direction.** Enforced by a unique
   constraint; a second send answers "already sent". Recorded as limitation #4
   with the thread model I would build.
6. **`%` / `_` in the search box act as LIKE wildcards.** SQLite does not escape
   wildcards inside a bound parameter. Pinned by a test instead of hidden.
7. **AI rate limiting is per-process** (in-memory Map): no Redis in a demo;
   resets on deploy, not shared between instances.
8. **No e-mail verification, password reset, or file uploads** — outside the
   assignment scope, listed under known limitations.
9. **Bilingual UI without an i18n library.** English stays the unprefixed
   default, Ukrainian is served under `/uk/…` by a middleware rewrite (no
   `app/[locale]` relocation), dictionaries are compile-checked against the
   English source of truth, and `Intl` handles plurals, dates and money. Zod
   messages are translated at the server-action boundary (`localizeError`),
   so unmapped strings, browser-native HTML5 messages, database content and
   the `global-error` fallback remain English — each of those is an explicit
   safety net or an owner outside our code, documented in
   [ARCHITECTURE § Internationalization](ARCHITECTURE.md#internationalization-en--uk).

Not done, and I would not claim it: an automated E2E suite (Playwright). The
CDP pass covered 17 routes × 2 viewports, role logins, console errors and
page overflow, but it lives outside the repo and is not part of `npm test`.

## 5. Fastest way to verify this yourself

Live (no setup): open **https://minimarketplace-six.vercel.app** and follow
`docs/DEMO.md`.

Locally:

```bash
npm i && npx prisma migrate dev && npm run db:seed && npm run dev
npm test
```

Then follow `docs/DEMO.md` — a five-minute scripted walkthrough (guest → buyer →
seller → manager → smart search), including the expected failure states.
Design rationale and trade-offs: `docs/ARCHITECTURE.md`.
To see the Ukrainian locale: click **UA** in the header, or open any route as
`/uk/…` (e.g. `/uk/manager/audit` — dates and labels switch, data does not).
