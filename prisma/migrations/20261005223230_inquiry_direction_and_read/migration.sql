-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Inquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "initiatorRole" TEXT NOT NULL DEFAULT 'BUYER',
    "message" TEXT NOT NULL,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inquiry_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Inquiry" ("assetId", "buyerId", "createdAt", "id", "message") SELECT "assetId", "buyerId", "createdAt", "id", "message" FROM "Inquiry";
DROP TABLE "Inquiry";
ALTER TABLE "new_Inquiry" RENAME TO "Inquiry";
CREATE INDEX "Inquiry_buyerId_idx" ON "Inquiry"("buyerId");
CREATE INDEX "Inquiry_assetId_idx" ON "Inquiry"("assetId");
CREATE INDEX "Inquiry_initiatorRole_idx" ON "Inquiry"("initiatorRole");
CREATE UNIQUE INDEX "Inquiry_assetId_buyerId_initiatorRole_key" ON "Inquiry"("assetId", "buyerId", "initiatorRole");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
