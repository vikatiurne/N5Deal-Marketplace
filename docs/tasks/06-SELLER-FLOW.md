# Task 06 — Seller flow

## Deliverables

1. `/seller` — dashboard:
   - total assets by status (DRAFT / PUBLISHED / PAUSED)
   - total inquiries received
   - latest 5 inquiries across all assets
   - "New asset" primary CTA
2. `/seller/assets` — table of own assets:
   - columns: title, license, jurisdiction, price, status, inquiries count, actions
   - actions: edit, publish/unpublish (toggle DRAFT↔PUBLISHED), pause, delete (soft → REMOVED)
3. `/seller/assets/new` and `/seller/assets/[id]/edit`:
   - shared form component
   - fields: title, licenseType, jurisdiction, price, currency, description
   - Zod-validated
   - Draft save vs Publish action
4. `/seller/buyers` — browse buyers:
   - list BuyerProfiles with company, jurisdictions, license interests, budget range
   - filters: jurisdiction, licenseType, budget range, free-text
   - searchable (same pattern as task 04, reuse filter primitives)
5. `/seller/buyers/[id]` — buyer detail:
   - profile info
   - "Contact buyer" button → creates Inquiry-like message but inverted
     (model: reuse Inquiry? NO — create a `SellerMessage` model OR
     make Inquiry direction-agnostic with `initiatorRole`. Choose one
     and document the decision in ARCHITECTURE.md.)
6. `/seller/inquiries` — inbox:
   - grouped by asset
   - shows buyer company, message, date
   - mark as "read" (add `readAt` to Inquiry)
7. Nav for seller role.

## Rules

- Seller can only edit/delete own assets (ownership check in repo + server action).
- Ownership failure returns 403, not 500.
- Bulk actions optional (skip if time-constrained).

## Definition of Done

- Seller publishes a new asset → appears on `/assets`.
- Inbox shows seeded inquiries.
- Toggle publish → asset disappears/reappears from public list.
- Seller cannot edit another seller's asset (verify by URL tampering).
- Seller can browse and filter buyers.

## Output format

- files
- decision note on Inquiry direction handling
