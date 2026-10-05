# Task 04 — Public asset listings + filters + search

## Deliverables

1. Route `/assets` — public, no auth required. Lists PUBLISHED assets.
2. Route `/assets/[id]` — public asset detail page.
   - Shows: title, licenseType, jurisdiction, price, description, seller displayName.
   - If not logged in: "Login to contact seller" button.
   - If logged in as BUYER: "Contact seller" button (opens dialog, task 05).
   - If logged in as SELLER (not owner): read-only.
   - If owner: "Edit asset" link (task 06).
3. Filters component (URL-search-params driven, shareable links):
   - licenseType (multi-select)
   - jurisdiction (multi-select)
   - priceMin / priceMax (number inputs)
   - free text `q` (matches title + description)
   - Reset button
4. Sorting: newest, price asc, price desc.
5. Pagination (server-side, 12 per page).
6. Empty state with illustration/text and "Reset filters" CTA.
7. Loading skeletons via `loading.tsx`.
8. All filtering happens server-side via `lib/db/repositories/assets.ts`.

## Visual reference

- Card grid (3 cols desktop / 1 mobile)
- Each card: license type badge, jurisdiction badge, title, price, "View" link
- Dark theme, subtle border, hover lift

## Rules

- Filters are pure URL state — no local React state for filter values.
- Repo function signature: `listAssets(filters: AssetFilters): Promise<{items, total}>`
- Add Zod schema `assetFiltersSchema` in `lib/validation/`.

## Definition of Done

- `/assets` shows 20 seeded PUBLISHED assets (some are DRAFT/PAUSED — those hidden).
- Filtering by licenseType + jurisdiction + price narrows correctly.
- URL reflects filters; copying URL into new tab restores them.
- Refresh keeps filters (URL).
- Pagination works.

## Output format

- files
- example URLs demonstrating each filter
