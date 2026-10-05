# Task 10 — Tests, ARCHITECTURE.md, README, deploy

## Deliverables

1. Vitest setup:
   - `vitest.config.ts`
   - tests for:
     - `lib/ai/smartSearch.ts` (mock LLM)
     - `lib/db/repositories/assets.ts` filters logic (against a test SQLite)
     - `lib/validation/*` schemas (happy + edge cases)
   - script: `"test": "vitest run"`
2. `ARCHITECTURE.md` (required — this is graded):
   Sections:
   - Problem summary & roles
   - Stack choice table with one-line justification per row
   - Data model diagram (ASCII or mermaid)
   - Key decisions & trade-offs:
     - SQLite → Postgres path
     - Inquiry direction (buyer-initiated vs seller-initiated)
     - JSON columns vs join tables for arrays
     - Server actions vs REST
     - AI in smart search: why Zod-validate output
     - Auth strategy & why JWT
   - What I would do differently with more time
   - Known limitations
3. `README.md`:
   - one-command setup: `npm i && npx prisma migrate dev && npm run db:seed && npm run dev`
   - demo credentials table (all roles)
   - feature checklist mapping to the original task requirements
   - env vars table
4. Deploy to Vercel (or provide exact steps):
   - swap SQLite to Vercel Postgres (or keep SQLite with a note)
   - set env vars
   - seed production DB
   - share live URL
5. `docs/DEMO.md`:
   - 5-minute walkthrough script for the reviewer:
     - login as buyer → filter assets → contact seller
     - login as seller → see inquiry → publish new asset
     - login as manager → suspend the seller → show audit log
     - demo smart search

## Definition of Done

- `npm test` passes.
- Fresh clone + README commands → working app locally.
- Live URL accessible (or documented blocker).
- ARCHITECTURE.md contains all required sections.

## Output format

- test run summary (pass count)
- live URL or deploy blocker
- final self-review checklist against original task
