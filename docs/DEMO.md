# Demo script — 5 minutes, three roles

Everything below runs against the seeded dataset
(`npm run db:seed` → 9 users, 24 assets, 10 inquiries, 3 audit entries). Every
account uses the password `password123`. Buttons are found by their visible
label, so the script survives copy changes in the code.

Open three private windows (or use one normal + two incognito) so the three
sessions do not overwrite each other's cookie.

---

## 0. Warm-up (20 s)

Live alternative: open **https://minimarketplace-six.vercel.app** — same seed, no setup.

```bash
npm run dev   # http://localhost:3000
```

Landing page: five licence domains, four numbers (listings, buyers, sellers,
inquries), two entry points — **Browse assets** and **Create account**.

---

## 1. Guest: catalogue and smart search (60 s)

1. `/assets` — 20 `PUBLISHED` listings from active sellers (24 rows exist: 1 draft,
   1 paused and 2 listings of the suspended `seller3` are filtered out). The
   smart-search bar, interpretation banner and filter bar stack above the card
   grid, newest first.
2. Tick **EMI** under _License type_, untick everything else, set
   **Max price (EUR)** to `3000000`, sort by
   **Price: low to high**. The URL updates (`?licenseType=EMI&priceMax=3000000&sort=price_asc`)
   and the header reports how many listings matched — the list, the counter and
   the URL always agree.
3. Copy the URL, open it in a fresh tab: state restores from the query string
   alone. This is the shareable-link guarantee.
4. Clear the filters. Type into the search box:
   `cheap emi in lithuania under 300k`.
   - With `OPENAI_API_KEY` set: an amber banner explains what was understood
     ("EMI · Lithuania · max 300 000") and the same filters appear as chips.
   - Without a key: a toast says smart search is unavailable and the phrase is
     searched as plain keywords — **the page never breaks**.
5. Try `q=%` in the URL bar: all listings come back. Not a bug — documented in
   [Known limitations](../README.md#known-limitations); the test
   `KNOWN LIMITATION: % in the query acts as a LIKE wildcard` pins the behaviour.

## 2. Buyer: profile, blind inquiry (75 s)

Sign in at `/login` as `buyer1@n5deal.test`.

1. `/buyer` — profile completeness card, chips of the criteria already filled,
   and the "Matched for you" strip with listings matching the buyer's own
   jurisdictions/licences/budget.
2. `/buyer/profile` — set **Budget up to (EUR)** to `3000000`, add jurisdiction `LT`
   and licence `MICA_CASP`, keep the description above 20 characters, **Save
   profile**. Toast confirms; the completeness bar grows; `/buyer` now matches
   on those exact criteria.
3. `/assets` → open the Cyprus EMI card → **Contact seller** → write a message
   of 20+ characters → **Send inquiry**.
   - Message is below 20 characters: inline error, no request sent.
   - Success: toast, and the button turns into "Inquiry sent".
   - **Note what is absent:** no email, no phone — the seller identity is only
     a display name and company.
4. Send a second inquiry from the same buyer on the same asset → inline
   "already sent": one message per direction per pair is a product rule, not a
   crash.
5. `/buyer/inquiries` — the buyer's outgoing thread plus any seller messages
   (there is one in the seed, from `seller1`).

## 3. Seller: inbox and matching buyers (75 s)

Sign in as `seller1@n5deal.test`.

1. `/seller` — status counters, matched buyer profiles, unread inquiry badge.
2. `/seller/inquiries` — inbound questions grouped by asset with unread
   counters. Select several → **Mark as read**; the badge and per-row count drop
   to zero. Marking someone else's inquiry read is impossible — the repository
   filters by `asset.sellerId`.
3. `/seller/buyers` — blind buyer search: type `lithuania`, filter by licence,
   sort by budget. Each card shows display name, company, budget, interests —
   **never contact details**.
4. Open a buyer → **Contact buyer** → send a message about one of this seller's
   assets. It appears for the buyer in `/buyer/inquiries`.
5. `/seller/assets` → **New asset**: title (5+), description (40+), licence,
   jurisdiction, price, and choose the **Save as draft** / **Publish now**
   intent. Publish → the listing is visible in `/assets` immediately; draft →
   visible only in the seller table.
6. Back in `/seller/assets` → **Pause** the listing, confirm the dialog. It
   disappears from `/assets` but stays recoverable here.

## 4. Manager: moderation and audit trail (60 s)

Sign in as `manager@n5deal.test`.

1. `/manager` — dashboard totals.
2. `/manager/users` — filter role = `SELLER`, status = `SUSPENDED`:
   `seller3@n5deal.test` is the seed example. The **Reactivate** button on any
   manager row is disabled — managers are not moderatable.
3. Suspend a buyer (`buyer4@n5deal.test`) via the confirm dialog. Then:
   - that buyer drops out of `/seller/buyers` (search lists `ACTIVE` only);
   - their existing inquiries stay visible to the seller;
   - their listings stay in `/manager/assets` — account moderation and listing
     moderation are independent levers.
4. `/manager/assets` → **Remove** a listing: it leaves `/assets` and stays
   visible here with a `REMOVED` badge and a **Reinstate & publish** action.
5. `/manager/audit` — the last three entries: `USER_SUSPENDED`,
   `ASSET_REMOVED`, … each with actor, target, timestamp and the JSON `meta`
   diff (`from` → `to`). The log is append-only; there is no delete or edit.
6. Prove suspension is immediate: in the incognito window the suspended buyer
   still holds a session cookie, but every protected request re-reads the DB
   and is rejected. `requireUser()` trusts the database, not the JWT.

## 5. Wrap-up (20 s)

- Public routes return 200; `/seller`, `/buyer`, `/manager` redirect guests to
  `/login` (307). A malformed catalogue query (`?priceMin=abc`) falls back to
  default filters with 200 — filters never crash the page — while
  `POST /api/smart-search` rejects a bad body with 400 and `GET` with 405.
- Smart search: one REST endpoint (`/api/smart-search`), everything else is a
  server action; AI output never reaches SQL unvalidated.
- Nothing about this demo required infrastructure beyond Node: SQLite, an
  in-memory rate limiter, and `OPENAI_API_KEY` optional.

---

## Recovery and re-runs

| Sympt                          | Fix                                                                    |
| ------------------------------ | ---------------------------------------------------------------------- |
| Login says `account_suspended` | Use another demo account, or reactivate the user in `/manager/users`   |
| No listings match a filter     | **Reset filters** on `/assets`; suspended/removed sellers drop out     |
| Second inquiry rejected        | Expected — one message per `(asset, buyer, direction)`                 |
| "Audit log is empty"           | Seed does not moderate anything; make a manager action first           |
| AI toast instead of filters    | `OPENAI_API_KEY` not set — keyword search fallback is intentional      |
| Want a clean dataset           | `npm run db:seed` is idempotent; `npm run db:reset` drops and re-seeds |

Cross-references: [`../README.md`](../README.md) for setup, accounts and the
feature map; [`ARCHITECTURE.md`](ARCHITECTURE.md) for why each of these flows is
built the way it is.
