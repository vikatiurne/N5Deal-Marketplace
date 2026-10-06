# Architecture — N5Deal Marketplace

B2B marketplace for licensed financial products (EMI, PI, MiCA/CASP, VASP,
banking licences). A buyer posts what it is looking for and its budget, a seller
posts a concrete asset, the two exchange inquiries **without ever seeing each
other's contacts**, and a manager moderates both sides.

The document grows as tasks land (`docs/tasks/`). Rule: if a decision changes the
data model or the shape of the code, it belongs here.

---

## Problem, roles, and boundaries

**Problem.** Regulated-entity licences are bought through brokers and warm
introductions. Buyers cannot see who is selling, sellers cannot see who is
buying, and neither side can filter by jurisdiction, licence type or price. The
product replaces the "who do you know" channel with a searchable catalogue plus
a blind two-sided inquiry flow.

**Roles and what each one may touch.**

| Role    | Reads                                   | Writes                                                                | Cannot                                                                |
| ------- | --------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Guest   | `/`, `/assets`, asset card, seller name | —                                                                     | contact form, dashboards; smart-search rate limit keyed by IP only    |
| Buyer   | catalogue, buyer cards, own inquiries   | buyer profile, inquiries `initiatorRole = BUYER`                      | seller contact data (only `displayName` + `company`), asset editing   |
| Seller  | own assets + their inquiries, buyers    | assets (`DRAFT/PUBLISHED/PAUSED`), inquiries `initiatorRole = SELLER` | other sellers' assets, own asset deletion, moderation, buyer profiles |
| Manager | everything, incl. audit log             | user status, asset status, audit entries                              | own account moderation, `DRAFT` (not a moderation state)              |

Two invariants shape the whole codebase:

1. **Contacts are never exchanged.** A seller sees buyers as `UserSummary`
   (`displayName`, `company`, budget) — no email, no phone. Same in reverse.
2. **The public catalogue only ever contains `PUBLISHED` assets owned by
   `ACTIVE` users.** Enforced in the repository (`listAssets` takes
   `sellerStatus: "ACTIVE"`, and the public callers pass it) and on the detail
   page (404 unless both hold), not in the UI. `MANAGER` bypasses the detail
   check so the moderation table can open any listing.

## Stack

| Concern    | Choice                               | Why                                                                                                                                              |
| ---------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework  | Next.js 15 App Router, RSC           | server-first by default; mutations are server actions, so the client never holds write logic; `revalidatePath` is one line                       |
| Language   | TypeScript `strict`                  | `exactOptionalPropertyTypes` / `noUncheckedIndexedAccess` catch the two bug classes this app is prone to: filters and nullable rows              |
| Data       | Prisma + SQLite (dev)                | relational domain (assets ↔ inquiries ↔ users) with zero infrastructure; Postgres is an explicit, documented swap (below)                        |
| Auth       | Auth.js v5 Credentials, JWT session  | no email provider, no OAuth app registration; JWT keeps server actions cheap, while DB status is re-read on every request for instant suspension |
| Styling    | Tailwind v4 + `radix-ui` + shadcn    | tokens in CSS, primitives copied into `components/ui`, no second UI kit; the unified `radix-ui` package already ships Dialog/Sheet/Table         |
| Validation | Zod                                  | every input (query string, form, AI output, server action) parsed at the boundary, before any write                                              |
| AI         | OpenAI Chat Completions over `fetch` | `response_format: json_object` plus an injected `LlmClient` interface; see [AI smart search](#ai-smart-search-task-08)                           |
| Tests      | Vitest + a real SQLite fixture DB    | filter/query logic is only trustworthy against a real engine; Zod schemas need no DOM                                                            |
| Money      | integer `price`, 3-letter `currency` | no float rounding; EUR/USD/GBP only, so no FX table in the demo                                                                                  |

## Data model

```
User ──────────────┬──< Asset >──────────────┬─── Inquiry >────┐
│ id               │   id                   │    id           │
│ role/status      │   sellerId             │    assetId ─────┘
│ displayName      │   title/description    │    buyerId ──┐
│ passwordHash ────┼──< BuyerProfile         │    initiatorRole
│ (never exposed)  │   (1:1, buyer only)    │    message   │
│                  │                        │    readAt    │
│ AuditLog         │                        └──────────────┘
│ actorId, action, targetType, targetId, meta
└──< AuditLog      │
```

Relations, all cascading from the owning side:

- `User 1—N Asset` — a seller owns listings. Deleting a user row would cascade,
  which is why moderation never deletes: it flips `status` (see
  [Moderation](#moderation-task-07)).
- `User 1—1 BuyerProfile` — only for `role = BUYER`; carries
  `jurisdictions` / `licenseTypes` / budget / description used for seller↔buyer
  matching.
- `Asset 1—N Inquiry`, `User 1—N Inquiry` — an inquiry is unique on
  `(assetId, buyerId, initiatorRole)`: one message per direction per pair.
- `User 1—N AuditLog` — `actorId`; `targetType/targetId` is polymorphic
  (`USER | ASSET`), which SQLite cannot express as a real FK, so referential
  integrity for the target is enforced in `lib/auth/permissions.ts` and the
  repository.

Enums are deliberately closed (`Role`, `AssetStatus`, `LicenseType`,
`AuditAction`, `AuditTargetType`): a typo in a UI button must fail validation,
not create a new category.

---

## Data model decisions

### 1. `Inquiry` — one table, direction in `initiatorRole` (Task 06)

**Context.** A buyer writes to a seller (`/assets/[id]` → “Contact seller”), and
a seller wants to write to a buyer (`/seller/buyers/[id]` → “Contact buyer”).
Task 06 proposed two options: a separate `SellerMessage` model, or a
direction-agnostic `Inquiry`.

**Decision:** one `Inquiry` model with `initiatorRole`
(`BUYER` | `SELLER`, default `BUYER`) and `readAt`.

```prisma
model Inquiry {
  assetId       String
  buyerId       String
  initiatorRole Role    @default(BUYER)
  message       String
  readAt        DateTime?

  @@unique([assetId, buyerId, initiatorRole])
}
```

**Why:**

| Criterion             | `Inquiry` + `initiatorRole`                                                                                       | Separate `SellerMessage`                       |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Domain meaning        | Matches CONTEXT: “contact request between buyer and seller about an asset” — direction is not part of the concept | A second message type with identical semantics |
| Metadata              | One `readAt`, one place for badges and audit                                                                      | Two read columns, two models in the UI         |
| Seller reply          | `initiatorRole = SELLER` on the same `(asset, buyer)` does not collide with the unique index                      | Separate table                                 |
| Migration to Postgres | One table                                                                                                         | Two tables + a join for a “conversation”       |
| Limits                | Cannot send two messages in one direction per pair                                                                | Can, but then needs a thread model             |

**What it costs:** one message per `(asset, buyer)` per direction — a repeat send
answers “already sent”. A deliberate trade-off: full reply threads are out of
scope for the assignment, and unlimited messages without a conversation model
only pollute the data.

**Consequences in code:**

- repository: `findInquiry(assetId, buyerId, initiatorRole)`,
  `listIncomingInquiries({ sellerId, ... })` — only `initiatorRole = BUYER`;
- a buyer's own inquiries filter on `initiatorRole = BUYER`, so seller replies
  never appear in their outgoing list;
- `readAt` is set only by the recipient (the seller) and only on inquiries
  belonging to their assets (`markInquiriesRead` filters on `asset.sellerId`);
- a buyer never sees seller contact details: only `displayName` and `company`
  (`UserSummary`) leave the server.

### 2. Arrays as JSON strings (Task 02)

`BuyerProfile.jurisdictions` and `licenseTypes` are `String` columns holding
`JSON.stringify` output, parsed in the repository (`parseJsonArray`) and existing
in the domain as `string[]`. The reason is SQLite's missing array type; the
trade-off is recorded here, and on Postgres these columns become `text[]`
without touching domain or UI code.

Search over them is `LIKE` (`contains`) straight on the JSON string: enough for
the demo dataset, and it needs no triggers.

### 3. Ownership checked in the repository and in the action (Task 06)

`findOwnedAsset(assetId, sellerId)` returns `null` instead of throwing:

- page `/seller/assets/[id]/edit` → `notFound()` (404, no leak of whether
  another seller's asset exists);
- server action → `{ ok: false, error }` with no write and no 500.

Next.js server actions cannot return 403 (every response is 200 + RSC payload),
so “403 semantics” are expressed as a typed result rather than an HTTP code.

### 4. Server actions instead of REST (CONTEXT, rule 5)

Mutations live in `src/server/<role>.ts` and return a shared
`ActionResult { ok, error?, redirectTo? }`. The UI reads it once: toast +
`router.refresh()`. `revalidatePath` is called for every affected path
(`/seller`, `/seller/assets`, `/assets`, the asset card).

Validation is Zod (`src/lib/validation/*`) at the action entry point, before any
write; DB unique constraints (`P2002`) are caught and turned into plain text
instead of a 500.

---

## Moderation (Task 07)

### 5. Auth: host trust and account status

- `trustHost: true` in the NextAuth config — the app is self-hosted, and without
  it Auth.js answers `UntrustedHost` on `/api/auth/*` in `next start` (this does
  not reproduce in `next dev`).
- Access rules live in `lib/auth/*`, not in pages: `requireUser()` and
  `requireRole()` are the only way into a protected area, and they also guard
  every server action. The business rule “a manager cannot be suspended” is a
  pure function, `memberModerationError()` (`lib/auth/permissions.ts`), so it is
  testable without HTTP.

### 6. Moderation flips status, never `delete`

`moderateUser` and `moderateAsset` never remove rows:

- soft-deleting a member = `User.status = DELETED`, so their listings (the
  cascade does not fire — it is a status, not a delete) and every inquiry on
  both sides stay in the database, visible to the manager and to the seller's
  inbox;
- `Asset.status = REMOVED` hides a listing from `/assets` but keeps it in
  `/manager/assets` and in the seller's own table, from where it can be restored
  (`Reinstate & publish`);
- a `SUSPENDED` user cannot sign in (the Credentials provider raises
  `account_suspended`), and an already-issued JWT stops working: `requireUser()`
  re-reads `role` / `status` from the database on every request
  (`findAccountAccess`) instead of trusting claims minted at login time.

Consequence for a buyer: “profile marked inactive” means the user disappears
from the buyer catalogue (`listBuyers` filters `status: ACTIVE`) and from
matching, but their inquiries remain visible to the seller.

**Deliberate decision:** suspending an account does not touch its listings. They
are two independent levers — account moderation and listing moderation. The
`/manager/assets` table shows a badge for a seller with a non-ACTIVE status, and
a specific listing can be hidden separately (`Pause` / `Remove`). Unpublishing
every listing automatically would make account recovery irreversible.

### 7. `AuditLog` — append-only, closed action set

```prisma
model AuditLog {
  actorId    String
  action     AuditAction      // USER_SUSPENDED | … | ASSET_REMOVED
  targetType AuditTargetType  // USER | ASSET
  targetId   String
  meta       String?          // JSON: { label, from, to, reason }
  createdAt  DateTime
}
```

- `action` and `targetType` are enums, not strings: junk cannot enter the log
  from the UI or from a typo at the call site; the action set is known upfront.
- `meta.label` is a snapshot of the target's readable name at action time. If
  the target is renamed later, the log entry still reads clearly; a live
  fallback (`resolveTargetLabels`) picks up the current name when no snapshot
  exists.
- Only `createAuditLog` in `src/server/manager.ts` writes it; the repository
  exposes no update or delete.

### 8. Managers are untouchable

`target.role === "MANAGER" && status !== "ACTIVE"` → `{ ok: false }` with
“Manager accounts cannot be suspended or deleted”, and no audit entry is
written. This closes both “suspend yourself” and “kick out the other admin”;
reactivation (`ACTIVE`) stays allowed. The guard is duplicated in the UI — the
buttons are disabled.

A manager also cannot move an asset to `DRAFT`: a private draft is a seller's
state, not a moderation one (`moderationStatusValues`).

---

## Layers

```
app/ (routes)  →  server/<role>.ts (server actions)  →  lib/db/repositories/*
                                          ↘  lib/validation/*  (Zod)
                                  ↘  lib/auth/guards.ts  (requireUser / requireRole)
```

- Components and pages **never** import `prisma` directly.
- Repositories return plain domain objects from `src/types`, not Prisma rows:
  `toDomain` strips `passwordHash` and any Prisma-specific types.
- Guards sit in layouts (`/seller/layout.tsx`, `/buyer/layout.tsx`), in every
  page, and in every action — middleware is not the only line of defence.

---

## AI smart search (Task 08)

```
SmartSearchBar (client)  →  POST /api/smart-search  →  parseQuery()
                                                           ↘ createLlmClient() (fetch)
```

- **Provider: OpenAI Chat Completions over `fetch`, not Anthropic.** The task
  reduces to extracting JSON from text: OpenAI has
  `response_format: {"type":"json_object"}`, which removes most of the prompt
  engineering (“return only JSON” in the system prompt stays as a belt-and-
  braces). Anthropic would need the same Zod guard plus an extra round-trip on a
  tool call, for no gain. The provider changes in one function,
  `createLlmClient()`.
- **Why `fetch` and not the `openai` SDK:** the SDK would be the project's only
  new runtime dependency, while the REST call is ~30 lines and a trivial mock in
  tests via `LlmClient`. `OPENAI_BASE_URL` lets us swap the endpoint
  (Azure-compatible gateway, local mock in E2E checks).
- **The LLM is an untrusted source.** The response passes
  `smartFiltersSchema` (`.strict()` — unknown keys are dropped wholesale, so the
  model cannot write extra parameters into the URL), `JSON.parse` with code-fence
  stripping, and a `priceMin <= priceMax` check. Any failure, garbage or empty
  object produces a **degraded fallback**: the original phrase goes into `q` as a
  plain keyword search and the client shows a toast. The app never breaks.
- **`explanation` is built locally** from the already-validated filters
  (`describeFilters`), not generated by the model: the text must match the real
  URL, otherwise the banner lies to the user.
- **Rate limit** — `lib/ai/rateLimit.ts`, 10 requests/minute per user (session
  id) or per IP for anonymous visitors, an in-memory Map with a 60-second window.
  A blunt abuse guard, not a hard quota: the state lives in the process, resets
  on deploy, and is not shared between instances. The real spend ceiling is the
  15-second LLM timeout in `llmClient.ts`.
- **Privacy:** the only thing sent out is the string the user typed into the
  search field — no records, emails or profiles. The raw model response is
  logged only when `NODE_ENV !== "production"`, and the API key is read on the
  server only; it never reaches the client bundle.
- **`/api/smart-search` is the only REST endpoint in the project** (CONTEXT,
  rule 5): a client component cannot invoke a server action, and `ai=1` / `exp=`
  in the URL are what make the explanation survive a refresh or a shared link.

---

## UI polish (Task 09)

### 9. Design tokens: contrast over palette

Status and licence colours live in `lib/badgeStyles.ts` and `globals.css`,
because inline Tailwind classes drift between pages, and `--destructive` in the
default theme **fails AA** on its own tints:

| Token                                                      | Value                      | Used for                                               |
| ---------------------------------------------------------- | -------------------------- | ------------------------------------------------------ |
| `--warning`                                                | `#fbbf24`                  | `PENDING` / `SUSPENDED` — amber is reserved for status |
| `--warning-foreground`                                     | `#0a0a0a`                  | text on solid `--warning`                              |
| `--destructive-text`                                       | `#f87171`                  | text/icons on `*-tint` backgrounds                     |
| `--destructive-solid`                                      | `#dc2626`                  | solid fill with white text                             |
| `--shadow-card`, `--shadow-card-hover`, `--shadow-popover` | oklch                      | depth without brightness swing                         |
| `--ease-soft`                                              | `cubic-bezier(.2,.8,.2,1)` | one easing for hover and entrance                      |

Measured contrast ratios (text on the matching 10% tint; AA requires 4.5:1):

| Element                     | Colour                  | Contrast               |
| --------------------------- | ----------------------- | ---------------------- |
| EMI                         | `sky-400` `#38bdf8`     | 7.24:1                 |
| PI                          | `violet-400` `#a78bfa`  | 5.82:1                 |
| MICA / CASP                 | `fuchsia-400` `#e879f9` | 6.44:1                 |
| VASP                        | `rose-400` `#fb7185`    | 5.97:1                 |
| BANK                        | `cyan-400` `#22d3ee`    | 8.46:1                 |
| OTHER                       | `slate-400` `#94a3b8`   | 6.15:1                 |
| warning badge               | `#fbbf24` on 10%        | 9.07:1                 |
| destructive on 10% (before) | `#ef4444`               | 4.44:1 — **AA fail**   |
| destructive-text on 10%     | `#f87171`               | 5.82:1 (4.92:1 on 20%) |
| solid destructive (before)  | white on `#ef4444`      | 3.76:1 — **AA fail**   |
| solid-destructive           | white on `#dc2626`      | 4.83:1                 |

Both failures would have stayed invisible to the eye but break AA inside
`Badge` / `Button` / `Toast`, so they were fixed in the primitives rather than at
call sites. Licences deliberately avoid amber/emerald: those hues are taken by
`PENDING` / `SUSPENDED` / `PUBLISHED`.

### 10. Dark theme is the only theme

`layout.tsx` always sets `<html className="dark">`, so `globals.css` has no
separate `.dark` block: it was byte-identical to `:root` and only created the
false impression that the theme could be toggled. Dark is the source of truth.

### 11. Mobile navigation: Sheet, not a new package

`ui/sheet.tsx` is built on `Dialog` from the already-installed `radix-ui`
v1.6.7 (Dialog is part of that package's unified module), so no new dependency
was needed. Below `md` the horizontal nav hides and the header keeps brand + a
menu button; the drawer takes focus, sets `aria-hidden` on `<main>`, locks body
scroll, and closes on Escape, overlay click, the close button, or navigating a
link. On desktop the session is visible explicitly: a dropdown with email and a
role badge — previously the only sign of being logged in was the Logout label.

### 12. Role nav — a grid, not a horizontal scroll

A five-item strip did not fit at 375px and hid items in an invisible scroller.
Below `sm` it is a two-column grid (every item visible, no scrolling),
`sm..lg` a horizontal strip, `lg` a sticky sidebar.

### 13. Tables: scroll instead of collapse

Manager tables (8 columns, 806–994px) do not collapse into cards: the data is
compared column-wise, and losing a column breaks the job. Instead the `Table`
wrapper got `role="region"`, `tabIndex={0}` and a focus ring — a plain
`overflow-x-auto` is unreachable from the keyboard (WCAG 2.1.1), while with
`tabIndex` the arrow keys pan the region. Measured: focus on the container,
`scrollLeft` 0 → 120 in three `ArrowRight` presses. Every table also gained a
`<caption>`: a screen reader now hears what it is comparing.

### 14. Small a11y fixes found during the audit

- Validation messages under textareas were visible but never announced:
  added `aria-invalid` + `aria-describedby` with ids (3 forms).
- `MarkReadButton` in its icon variant announced the counter twice (“Mark as
  read” + “Mark 3 inquiries as read”) — the sr-only text now appears only when
  there is no visible label.
- A toast for every mutation: `createAsset` returned `redirectTo` **before**
  `toast()`, so publishing a listing was the only mutation without feedback;
  `signIn` / `registerAction` showed errors inline only.

### 15. What was verified, and how

`npm test`, `tsc --noEmit`, `eslint`, `prettier --check`, `next build` — no
errors or warnings. Plus a headless-Chrome pass over CDP (no new dependencies)
across 17 routes at 375px and 1280px: 0 errors and 0 warnings in the console, 0
page-level horizontal overflow. A separate pass logs in as each of the three
roles. Known Next.js limitation: `notFound()` returns 200 with
`<meta name="robots" content="noindex">` (the root layout streams the header, so
the status is never committed) — the 404 screen itself is fully functional.

---

## Internationalization (en + uk)

The interface ships in English and Ukrainian; the whole UI switches, including
server-rendered pages, metadata titles, toasts, validation messages, dates and
money. The layer is ~10 small files in `src/i18n/` with **zero new runtime
dependencies** — the spec forbids adding libraries without justification, and
everything this app needs (a key-value lookup, `Intl` plurals, URL prefixes) is
already in the platform.

### 16. URL prefix, not a route segment

- **English is the default and has no prefix** — every pre-existing URL
  (README, demo script, shared links) keeps working unchanged.
- **Ukrainian lives under `/uk/…`**: `src/middleware.ts` rewrites
  `/uk/(.*)` → the internal path and sets `x-locale: uk`. There is no
  `app/[locale]/` tree — relocating every route, link and guard for two locales
  would touch the whole tree for zero product value.
- `/en/…` answers `307` to the canonical unprefixed path, so there is exactly
  one URL per resource per locale (no duplicate-content pairs).
- The prefix is one constant (`UK_PREFIX` in `src/i18n/config.ts`); switching
  to `/ua` is a one-line change. The locale tag for `Intl`/`lang` stays the
  correct ISO `uk`.

### 17. Reading the locale, server and client

| Context                 | How                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Server components       | `await getT()` / `getLocale()` — reads the `x-locale` request header                                             |
| Server actions          | same (`localizeError`, `localizePath` after a mutation redirect)                                                 |
| Client components       | `<I18nProvider>` in the root layout → `useT()`, `useLocaleHref()`                                                |
| Links and `router.push` | `localizePath(locale, path)` (server) / `useLocaleHref()` (client) — never raw paths; `/api/*` is never prefixed |

The language switcher (`LanguageSwitcher.tsx`) performs a **full page load**
of the current pathname plus the preserved query string, so filters and
pagination survive an EN↔UA switch. It is a full load on purpose: the locale
reaches client components through `I18nProvider` in the root layout, and
Next.js does not re-render the root layout on soft navigation — a
`router.push` would update page content while the provider and the
server-rendered header stayed on the old locale, making the next click a no-op.
After login, the middleware puts the _original_ browser path (with the
`/uk` prefix) into `?next=`, so the post-login redirect returns to the
Ukrainian page the user came from.

### 18. Dictionaries

- `src/i18n/messages/parts/` — one module per zone (common, catalog, auth,
  buyer, seller, manager); `en.ts` aggregates them and is the **source of
  truth**: `MessageKey = keyof typeof en`, so a typo'd key is a compile error.
- `uk.ts` is typed `Record<MessageKey, string> & Record<string, string>`:
  the first half enforces full coverage, the second allows zone-specific
  plural keys (`key_one` / `key_few` / `key_many`) resolved through
  `Intl.PluralRules("uk")` when a message is called with `{count}`.
- Lookup falls back en → key, so a missing Ukrainian string degrades to
  English instead of rendering `undefined`.
- **Zod messages stay English in `lib/validation`** — 127 existing tests assert
  those exact strings. Server actions translate what the user can see through
  `localizeError(message)` (an EN→uk map in `messages/uk-errors.ts`); anything
  unmapped — a rare Zod default or a future message someone forgets to add —
  falls back to English rather than failing.

### 19. Locale-aware formatting

`lib/formatDate.ts` and `lib/formatPrice.ts` take the locale explicitly and
format through `Intl` with `intlLocale()` (`en-IE` → `06 Oct 2025 / €1,500,000`,
`uk-UA` → `06 жовт. 2025 / 1 500 000 EUR`). They are synchronous by design:
passing `locale` keeps them usable inside `.map()` callbacks and makes them
plain unit-testable functions — no `headers()` inside formatting helpers.

### 20. What is deliberately _not_ translated

- **Data, not interface:** asset titles and descriptions, display names,
  companies, e-mail addresses, jurisdiction codes (`LT`), audit `meta` labels.
- **`global-error.tsx` stays English:** it replaces the root layout itself, so
  the i18n provider does not exist when it renders. Best-effort EN is the
  correct degradation for a last-resort boundary.
- **Browser-native HTML5 messages** (`required`, `type="email"`): the browser
  renders them before our handlers run; their language follows the browser,
  not the URL prefix.
- **Unmapped Zod/error strings** fall back to English (§18) — a safety net,
  not a target.

---

## Testing (Task 10)

```
test/globalSetup.ts          prisma db push --skip-generate --force-reset  (DATABASE_URL=file:./test.db)
        ↓
src/lib/db/repositories/assets.test.ts   47 tests — real SQLite, real Prisma
src/lib/validation/*.test.ts            127 tests — pure Zod
src/lib/ai/smartSearch.test.ts           17 tests — injected LlmClient
```

Three rules shaped the suite:

- **Filter tests run against a real database, not a mocked repository.** A mock
  restates exactly the logic we want to verify and is always green: it will not
  catch a typo in `where` / `orderBy`. `assets.test.ts` creates 7 assets, 2
  sellers and 2 buyers, exercises every filter and their combinations, checks
  pagination together with `total`, sorting, ownership (`findOwnedAsset` on
  someone else's asset → `null`), the seller's inbox counters, and
  incoming/outgoing inquiries. The test database is a separate file
  (`prisma/test.db`) recreated before each run; `fileParallelism: false` because
  the files share one schema.
- **AI is never tested over the network.** `createLlmClient()` is the single
  exit point and is replaced by an `LlmClient` in 17 `parseQuery` tests,
  including code fences, garbage, extra keys and timeouts.
- **Zod tests cover the URL and form contract**, not line coverage: query
  strings arrive with repeated parameters, CSV lists, empty strings from reset
  filters, and manual-input garbage. Each of those cases is pinned explicitly,
  including `priceMin > priceMax` (the error points at `priceMin`) and the ban
  on self-registering as `MANAGER`.

The tests caught two real bugs instead of merely confirming the implementation:

1. `markReadSchema` / `Inquiry` uniqueness — two messages from one buyer about
   one asset failed on `P2002`; the test now requires two buyers and thereby
   pins the “one message per direction” rule.
2. `assetFiltersSchema` accepted `?jurisdiction=12`: a `length(2)` check treated
   two digits as a country code. Replaced with `/^[A-Z]{2}$/`, which
   **deliberately** still allows a new country to ship without a deploy, unlike
   the closed enum on the write path (`JURISDICTIONS`).

## Known limitations

| #   | Limitation                                                                                          | Why                                                                                               | What to do when it grows                                                  |
| --- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | SQLite: one file, no concurrent writes in production, `LIKE` over JSON arrays                       | The demo must start with zero infrastructure                                                      | Move to Postgres: `text[]` + GIN/trgm, one migration script (below)       |
| 2   | `%` and `_` in search act as LIKE metacharacters                                                    | SQLite does not escape them inside a bound parameter                                              | Raw query with `ESCAPE '\'` for public search; currently pinned by a test |
| 3   | AI rate limit is an in-memory Map                                                                   | No Redis in the demo; resets on deploy and is per-instance                                        | Upstash/Redis, key by userId                                              |
| 4   | One message per `(asset, buyer)` per direction, no threads                                          | Real conversations need their own model                                                           | `InquiryThread` + `InquiryMessage`, migrate along `initiatorRole`         |
| 5   | `notFound()` returns HTTP 200 + `noindex` (streaming root layout)                                   | Next.js behaviour, not our code                                                                   | Move 404 pages into a route group without the streaming layout            |
| 6   | JSON-array filtering uses `LIKE` — slow and unindexed                                               | 24 demo assets do not need an index                                                               | Postgres `text[]` + GIN, or join tables                                   |
| 7   | No e-mail confirmation or password reset                                                            | Credentials provider without mail                                                                 | Resend/Postmark + verify-token on `User`                                  |
| 8   | No file uploads (licence scans, diligence documents)                                                | Files are outside the demo scope                                                                  | S3-compatible storage + signed URLs                                       |
| 9   | Ukrainian UI, but unmapped Zod strings, HTML5 browser messages and `global-error` render in English | Safety net over silent failures; browser-owned UI; last-resort boundary without the i18n provider | Add keys to `uk-errors.ts`; accept browser-local HTML5 text by design     |

## SQLite → Postgres: exact sequence

Swapping the datasource here is one schema migration plus two repository edits,
because the domain layer does not know it is running on SQLite:

1. Create a managed Postgres database and set `DATABASE_URL` to
   `postgresql://…?sslmode=require`, plus a `DIRECT_URL` (direct endpoint, no
   pgbouncer) referenced by `directUrl` in the Prisma datasource — Migrate needs
   transactions and refuses to run through a pooler.
2. `npx prisma migrate dev --name postgres-baseline` builds the tables on
   Postgres. Rows from SQLite are moved by hand (dump + `INSERT`); the demo has
   nothing worth keeping. _Verified against a live Neon project: the provider
   swap alone produced a clean baseline migration._
3. `BuyerProfile.jurisdictions` / `licenseTypes`: `String` → `String[]`
   (`text[]`). The domain type does not change, but `parseJsonArray` /
   `JSON.stringify` in `repositories/users.ts` become redundant — delete them
   together with their tests.
4. Array filters: `contains` → Prisma's `array_contains` or a GIN index. Until
   then, `LIKE` on JSON keeps working as it does today.
5. `AuditLog` could gain a real FK to the polymorphic target — either two tables
   or nullable `targetUserId` / `targetAssetId` with a `CHECK` constraint.
6. Tests: keep `file:` on a laptop (fast), or run a `postgres` service in CI for
   honest coverage of `array_contains`.
7. Deploy: keep the committed schema on SQLite and swap the provider inside
   the build command (`vercel.json` → `sed` + `prisma generate && next build`),
   with `DATABASE_URL` (pooled) and `DIRECT_URL` as separate env vars. This is
   how the live URL is built; exact steps are in the README.

## What I would do differently

- **Arrays as join tables from day one.** The JSON string was a conscious
  simplification for SQLite, but `BuyerProfile` is really many-to-many
  (`jurisdictions`, `licenseTypes`), and on Postgres `text[]` is a poor
  conversion target. Redesigning, I would start with
  `BuyerJurisdiction(buyerId, code)` — an index, a normalised filter, and no
  `LIKE` over JSON.
- **Inquiries as threads from day one.** The “one message per direction” rule is
  not a saving; it is a ban on conversation that we will later break with a
  migration. `InquiryThread(assetId, buyerId)` +
  `InquiryMessage(threadId, authorRole, body, readAt)` would be right.
- **Money as `Decimal`, not `Int`.** `Int` in minor units holds out to ~90
  million units, but adding two-decimal currencies (JPY) or fractional rates
  needs a type migration. For the demo `Int` is honest; for production it is not.
- **No hand-rolled VASP logic in `auth.ts`.** `trustHost: true` and re-reading
  the user status on every request are right for a demo, but in production they
  are two extra DB queries per page; an edge-compatible status cache with a 60s
  TTL would give the same behaviour for less load.
- **Playwright for E2E from the start.** The CDP pass covered visual and a11y
  checks cheaply, but it had to be written by hand (`CDP` + `fetch` + scripts in
  `/tmp`). Playwright would give the same checks declaratively with tracing, for
  the price of one dev dependency.

## Product improvements I would propose next

Technical debt above; these are the product-level changes I would raise before
writing more code — each one maps to a business outcome, not to tidiness.

1. **Turn inquiries into threads with response SLAs.** One message per direction
   blocks the actual M&A workflow: diligence is a back-and-forth. Threads plus
   unread counters per thread, and a “seller response time” figure on listings,
   directly feed deal velocity and give buyers a reason to prefer this platform
   over email. (`InquiryThread` in the data model above.)
2. **Replace exact-filter matching with a scored match.** Today “Matched for you”
   is an equality filter on jurisdictions/licences/budget. A marketplace's core
   value loop is matching: rank by budget overlap (distance between ranges),
   jurisdiction adjacency (EU passporting is a proxy for jurisdiction value) and
   licence compatibility, then expose the score. That also enables saved searches
   and alerts — the retention mechanism the current product has none of.
3. **Add verification and data enrichment to listings.** In this market the
   listing is an unverifiable claim. Cross-checking the licence against public
   registries (or an LLM-assisted enrichment pass over filings) and showing a
   verification badge raises trust and conversion; it is also where the existing
   AI pipeline (`smartSearch`'s validated-JSON pattern) extends naturally to
   enrichment rather than search.
4. **Give sellers a funnel, not a table.** Sellers currently see statuses;
   buyers see inquiries. The business question is “how many listings turned into
   contact requests?” — a simple conversion view per asset (impressions →
   inquiries → thread active) is a day of work against data we already store.

Out of scope for this assignment, and deliberately not started: payments,
multipart file exchange, real KYC, and multi-tenant orgs.
