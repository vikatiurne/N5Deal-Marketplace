# N5Deal Marketplace

B2B marketplace for regulated financial products — EMI, PI, MiCA/CASP, VASP and
banking licences. Buyers publish what they are looking for and their budget,
sellers list concrete assets, the two exchange inquiries **without ever seeing
each other's contacts**, and a manager moderates both sides.

Demo accounts and the 5-minute script live in [`docs/DEMO.md`](docs/DEMO.md);
design and trade-off rationale in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Quick start

```bash
cp .env.example .env      # creates prisma/dev.db and enables Auth.js + AI fallback
npx auth secret >> .env   # fills AUTH_SECRET (skip only for a throwaway local look)
npm i
npx prisma migrate dev    # creates prisma/dev.db from the 3 migrations
npm run db:seed           # 9 users, 20 assets, 10 inquiries, 3 audit entries
npm run dev               # http://localhost:3000
```

One-liner after the two file edits above:

```bash
npm i && npx prisma migrate dev && npm run db:seed && npm run dev
```

AI smart search works without an API key: `POST /api/smart-search` falls back to
keyword search and the UI shows a toast. Add `OPENAI_API_KEY` in `.env` to get
natural-language filtering ("cheap emi in lithuania under 300k").

Requirements: Node 20.9+ (or 22), npm 10+. No database server, no Docker, no
external services.

## Demo accounts

All demo passwords are `password123`.

| Role             | Email                 | Password      | Use this to see                                 |
| ---------------- | --------------------- | ------------- | ----------------------------------------------- |
| Manager          | `manager@n5deal.test` | `password123` | moderation queues + audit log                   |
| Seller           | `seller1@n5deal.test` | `password123` | publishing flow, unread inquiries, buyer search |
| Buyer            | `buyer1@n5deal.test`  | `password123` | profile, matched sellers, outgoing inquiries    |
| Suspended seller | `seller3@n5deal.test` | `password123` | login is refused with `account_suspended`       |

There are more buyers (`buyer2`…`buyer5`) and sellers (`seller2`) so filters and
pagination have something to page through.

## Feature map

| Role    | Feature                                                                                       | Route                           | Where it lives                                                         |
| ------- | --------------------------------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------- |
| Guest   | Landing page with domain counts                                                               | `/`                             | `src/app/page.tsx`                                                     |
| Guest   | Filterable catalogue: licence type, jurisdiction, price range, text, 3 sort modes, pagination | `/assets`                       | `components/assets/FilterBar.tsx`, `lib/db/repositories/assets.ts`     |
| Guest   | Asset card with status/licence badges, seller name, price                                     | `/assets/[id]`                  | `toDomain`, `components/assets/AssetCard.tsx`                          |
| Guest   | Natural-language smart search with explanation + degraded fallback                            | `/assets?ai=1&q=…`              | `src/lib/ai/smartSearch.ts`, `app/api/smart-search/route.ts`           |
| Guest   | Auth pages with inline + toast validation errors                                              | `/login`, `/register`           | `src/server/auth.ts`, `lib/validation/auth.ts`                         |
| Buyer   | Dashboard: profile completeness, criteria chips, listings matched to the profile              | `/buyer`                        | `listAssets` with the buyer's own criteria                             |
| Buyer   | Interest profile: jurisdictions, licence types, budget, description                           | `/buyer/profile`                | `upsertBuyerProfile`, `buyerProfileSchema`                             |
| Buyer   | Contact seller on an asset (blind — no seller contact data)                                   | `/assets/[id]`                  | `server/buyer.ts` → `createInquiry`, `initiatorRole = BUYER`           |
| Buyer   | Read-only view of which sellers contacted them                                                | `/buyer/inquiries`              | `listInquiriesForBuyer` (seller messages land here)                    |
| Seller  | Dashboard: status counts, unread inquiry badge, matched buyer profiles                        | `/seller`                       | `listSellerAssets`, `countIncomingInquiries`, `listBuyers`             |
| Seller  | Create / edit assets with `draft` vs `publish` intent                                         | `/seller/assets/new`, `/…/edit` | `lib/validation/seller.ts`, `assetsRepo`                               |
| Seller  | Status changes: publish, pause, reinstate                                                     | `/seller/assets`                | `setAssetStatus` + `assetStatusActionSchema`                           |
| Seller  | Blind buyer search: name/company, jurisdictions, licences, budget                             | `/seller/buyers`                | `listBuyers`, `buyerSearchSchema`                                      |
| Seller  | Contact buyer about one of your assets (`initiatorRole = SELLER`)                             | `/seller/buyers/[id]`           | `sendBuyerMessage`                                                     |
| Seller  | Inquiry inbox with unread counters and mark-as-read                                           | `/seller/inquiries`             | `listIncomingInquiries`, `markInquiriesRead` via `markInquiriesAsRead` |
| Manager | Moderation: suspend / reactivate / soft-delete users                                          | `/manager/users`                | `moderateUser`, `USER_AUDIT_ACTION`                                    |
| Manager | Moderation: publish / pause / remove assets                                                   | `/manager/assets`               | `moderateAsset`, `ASSET_AUDIT_ACTION`                                  |
| Manager | Append-only audit log with actor, target and JSON meta                                        | `/manager/audit`                | `AuditLog`, `createAuditLog`                                           |
| Cross   | 404 / error / global-error boundaries, skeletons, empty states                                | `not-found.tsx`, `error.tsx`    | `src/components/ui/*`                                                  |
| Cross   | Token-based dark theme, AA contrast, keyboard-scrollable tables, mobile Sheet nav             | layout, `globals.css`           | `lib/badgeStyles.ts`, `SiteHeader`, `components/ui/sheet`              |

## Scripts

| Script                 | What it does                                   |
| ---------------------- | ---------------------------------------------- |
| `npm run dev`          | Next dev server on :3000 (turbopack)           |
| `npm run build`        | Production build                               |
| `npm start`            | Serve the production build                     |
| `npm test`             | Vitest, one run — 189 tests across 7 files     |
| `npm run test:watch`   | Vitest in watch mode                           |
| `npm run lint`         | ESLint                                         |
| `npm run format:check` | Prettier check (use `npm run format` to write) |
| `npm run db:seed`      | Re-run the idempotent demo seed                |
| `npm run db:reset`     | Drop, re-migrate and re-seed the dev database  |

Tests use their own SQLite file (`prisma/test.db`) and reset it before each run,
so `npm test` never touches `prisma/dev.db`. See
[Testing](docs/ARCHITECTURE.md#testing-task-10).

## Environment variables

| Variable          | Required         | Default                     | Notes                                                                          |
| ----------------- | ---------------- | --------------------------- | ------------------------------------------------------------------------------ |
| `DATABASE_URL`    | yes              | `file:./dev.db`             | SQLite file relative to `prisma/`. Swap to `postgresql://…` for prod.          |
| `AUTH_SECRET`     | yes for real use | —                           | `npx auth secret`. Without it Auth.js errors on `/api/auth/*` in `next start`. |
| `OPENAI_API_KEY`  | no               | empty                       | Without it smart search degrades to keyword search.                            |
| `OPENAI_MODEL`    | no               | `gpt-4o-mini`               | Any OpenAI chat-completions model that supports `json_object`.                 |
| `OPENAI_BASE_URL` | no               | `https://api.openai.com/v1` | Point at an OpenAI-compatible gateway or a local mock.                         |

`.env` is git-ignored; only `.env.example` is committed.

## Deployment

**Not deployed — no Vercel credentials are available in this environment.** The
blocker and the exact steps below are documented rather than faked:

1. **Postgres first.** Vercel's filesystem is ephemeral and cannot hold
   `prisma/dev.db`. Create a Postgres database, set `DATABASE_URL` to it, and
   swap `BuyerProfile.jurisdictions`/`licenseTypes` from JSON strings to
   `String[]` (`text[]`) — see
   [SQLite → Postgres: exact sequence](docs/ARCHITECTURE.md#sqlite--postgres-exact-sequence).
2. **Generate a Prisma client for the serverless runtime:**

   ```bash
   npm i -D @prisma/adapter-neon   # or @prisma/adapter-planetscale / -pg
   ```

   then set `binaryTargets = ["native", "rhel-openssl-3.0.x"]` in
   `prisma/schema.prisma`.

3. **Build with migrations in one command.** Add to `package.json`:

   ```json
   "vercel-build": "prisma generate && prisma migrate deploy && next build"
   ```

4. **Environment variables** — `DATABASE_URL`, `AUTH_SECRET`, and
   `OPENAI_API_KEY` in Vercel → Project → Settings → Environment Variables for
   _all_ environments. `AUTH_SECRET` must match the one used by the Credentials
   provider.
5. **Seed once, manually.** Do **not** run `npm run db:seed` on every deploy; it
   is idempotent but would overwrite demo edits. Run it from a local machine
   against the production `DATABASE_URL` only when you want the demo dataset.
6. **First deploy:**

   ```bash
   npx vercel link
   npx vercel env pull .env.local
   npx vercel --prod
   ```

   Or push to `main` and let Vercel's Git integration build it.

7. **Post-deploy check:** open `/`, `/assets`, `/login`; sign in as
   `manager@n5deal.test` and confirm `/manager/users` loads — a missing
   `prisma migrate deploy` in the build step shows up as a Prisma error there.

## Project layout

```
src/
  app/                     routes (RSC pages) + api/smart-search
  components/              ui primitives, layout, feature components
  lib/ai/                  smartSearch.ts, llmClient.ts, rateLimit.ts (+ test)
  lib/auth/                guards.ts, permissions.ts, config
  lib/db/                  prisma singleton + repositories/ (+ repository test)
  lib/validation/          Zod schemas for every input (+ tests)
  server/                  server actions per role, shared ActionResult type
  types/                   domain types, enums, badges copy
prisma/                    schema, 3 migrations, seed, dev.db (ignored)
docs/                      ARCHITECTURE.md, DEMO.md, tasks/
test/                      globalSetup.ts — test-database bootstrap
```

## Known limitations

- SQLite for local dev; see [SQLite → Postgres: exact sequence](docs/ARCHITECTURE.md#sqlite--postgres-exact-sequence) for production.
- AI rate limit is an in-memory `Map` (resets on deploy, not shared across instances).
- One inquiry per `(asset, buyer)` per direction — no threaded replies.
- `%` and `_` in catalogue search act as LIKE wildcards (documented and pinned by a test).
- No e-mail confirmation, password reset, or file uploads.
