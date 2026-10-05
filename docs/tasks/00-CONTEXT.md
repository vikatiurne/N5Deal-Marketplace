# Project Context — N5Deal Marketplace (Test Task)

## Goal

Build a working mini-marketplace for FinTech/M&A assets with 3 roles:
Buyer, Seller, Platform Manager. This is a **test assignment**, evaluated on:

- working app (not static screens)
- state persists after refresh
- enough demo data
- UX quality, architecture rationale, data model quality
- bonus: AI-assisted features (smart search)

## Non-negotiable constraints

- Next.js 15 (App Router) + TypeScript
- Persistence REQUIRED (state must survive page reload)
- Working app, not mockups
- Do NOT reproduce n5deal.com 1:1 — use it only as visual reference
  (dark theme, clean cards, accent color, professional fintech feel)

## Chosen stack (already decided — do not re-litigate)

- Next.js 15 App Router + TypeScript (strict)
- Prisma + SQLite (dev), easy to swap to Postgres
- Auth.js (NextAuth v5) — Credentials provider, JWT sessions, role in token
- Tailwind CSS + shadcn/ui
- Zod for all input validation
- Vitest for domain-layer tests

## Roles & capabilities (source of truth)

**Seller**

- publish asset
- browse buyers
- filter/search buyers
- contact buyer

**Buyer**

- create & maintain profile
- describe investment/acquisition interests
- browse available assets
- filter/search assets
- contact seller

**Platform Manager**

- see buyers, sellers, assets
- search/filter members and assets
- delete or suspend non-compliant members

## Domain vocabulary (use these exact terms in code)

- `Asset` — a licensed company/fintech entity for sale
- `BuyerProfile` — buyer's interests, jurisdictions, budget
- `Inquiry` — a contact request between buyer and seller about an asset
- `licenseType` — EMI | PI | MiCA_CASP | VASP | BANK | OTHER
- `jurisdiction` — ISO country code (LT, CY, MT, EE, ...)
- `status` — ACTIVE | SUSPENDED | DELETED (users)
- `assetStatus` — DRAFT | PUBLISHED | PAUSED | REMOVED

## Working agreements with Cline

1. Read this file before EVERY task file.
2. Do not start task N+1 until task N's "Definition of Done" is fully met.
3. After each task, output:
   - files created/modified
   - how to verify (exact commands + URL to open)
   - open questions / assumptions made
4. Never invent new dependencies without stating why in the summary.
5. Prefer server actions over REST endpoints unless there is a reason.
6. All user input goes through Zod.
7. All DB access goes through a thin `lib/db/*` repository layer,
   NOT directly from components.
