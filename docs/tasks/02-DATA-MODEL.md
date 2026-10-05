# Task 02 — Data model, Prisma, seed

## Deliverables

1. `prisma/schema.prisma` with these models (fields may be refined,
   but semantics must stay):

   enum Role { BUYER SELLER MANAGER }
   enum UserStatus { ACTIVE SUSPENDED DELETED }
   enum AssetStatus { DRAFT PUBLISHED PAUSED REMOVED }
   enum LicenseType { EMI PI MICA_CASP VASP BANK OTHER }

   model User {
   id, email (unique), passwordHash, role, status,
   displayName, company, createdAt, updatedAt
   relations: profile?, assets[], inquiriesSent[]
   }

   model BuyerProfile {
   userId (PK, FK), jurisdictions String[], // JSON
   licenseTypes LicenseType[], // JSON
   budgetMin Int?, budgetMax Int?,
   description String?
   }

   model Asset {
   id, sellerId, title, licenseType, jurisdiction,
   price Int?, currency, description, status,
   createdAt, updatedAt
   relations: seller, inquiries[]
   }

   model Inquiry {
   id, assetId, buyerId, message, createdAt
   @@unique([assetId, buyerId]) // one inquiry per buyer per asset
   }

2. `lib/db/prisma.ts` — singleton PrismaClient (dev-safe).
3. `lib/db/repositories/` — one file per entity:
   - users.ts, assets.ts, buyers.ts, inquiries.ts
   - each exports typed functions (listAssets, findBuyerProfile, etc.)
   - NO Prisma calls outside this folder.
4. `prisma/seed.ts` producing realistic demo data:
   - 1 manager: manager@n5deal.test / password123
   - 3 sellers: seller1@n5deal.test ... seller3@n5deal.test / password123
   - 5 buyers: buyer1@n5deal.test ... buyer5@n5deal.test / password123
   - 20 assets across LT/CY/MT/EE/PL, license types EMI/PI/MICA_CASP/VASP
   - prices between 150k and 3M EUR
   - 8 inquiries with varied messages
   - 1 SUSPENDED seller, 1 DRAFT asset, 1 PAUSED asset (to test manager views)
5. `package.json` script: `"db:seed": "tsx prisma/seed.ts"`,
   `"db:reset": "prisma migrate reset --force"`.

## Rules

- Passwords hashed with bcrypt (add `bcryptjs`).
- Use JSON columns for arrays in SQLite via `String` + `JSON.parse` helper
  in repo layer (document this trade-off in ARCHITECTURE.md later).
- Every repo function returns plain domain objects, not Prisma rows.

## Definition of Done

- `npx prisma migrate dev --name init` succeeds.
- `npm run db:seed` populates DB without errors.
- `npx prisma studio` shows all tables with the seeded data.
- Summary lists row counts per table.

## Output format

- schema.prisma (full)
- list of repo files with exported function signatures
- seed summary with counts
