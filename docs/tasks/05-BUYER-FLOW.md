# Task 05 — Buyer flow

## Deliverables

1. `/buyer` — dashboard:
   - profile completeness indicator
   - count of inquiries sent
   - latest 5 published assets matching buyer interests (simple match:
     jurisdiction ∩, licenseType ∩, price in range)
   - link to edit profile
2. `/buyer/profile` — form:
   - company, jurisdictions (multi), licenseTypes (multi),
     budgetMin, budgetMax, description
   - Zod-validated server action `updateBuyerProfile`
   - On save: toast + revalidate
3. Contact-seller flow:
   - On `/assets/[id]`, BUYER sees "Contact seller" button
   - Dialog with message textarea (min 20 chars, Zod)
   - Server action `createInquiry({assetId, message})`
   - Rejects if inquiry already exists (unique constraint) with clear toast
   - After success: button becomes "Inquiry sent ✓" (disabled)
4. `/buyer/inquiries` — list of sent inquiries:
   - asset title, seller name, message, date, status label (Sent)
5. Sidebar/nav for buyer role with all 3 routes.

## Rules

- Buyer cannot see seller contact details directly — all comms via Inquiry.
- All mutations via server actions in `src/server/buyer.ts`.
- After mutation: `revalidatePath` on affected routes.

## Definition of Done

- New buyer (register) → sees profile form → saves → refresh keeps data.
- Contact seller on an asset → inquiry appears in `/buyer/inquiries`.
- Attempting to send second inquiry on same asset → blocked with toast.
- Home dashboard shows matched assets for the buyer.

## Output format

- files
- manual test walkthrough
