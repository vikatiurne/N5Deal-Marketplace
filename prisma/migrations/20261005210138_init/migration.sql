-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "displayName" TEXT NOT NULL,
    "company" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BuyerProfile" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "jurisdictions" TEXT NOT NULL,
    "licenseTypes" TEXT NOT NULL,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "description" TEXT,
    CONSTRAINT "BuyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "licenseType" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "price" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Asset_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inquiry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Inquiry_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inquiry_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Asset_status_idx" ON "Asset"("status");

-- CreateIndex
CREATE INDEX "Asset_sellerId_idx" ON "Asset"("sellerId");

-- CreateIndex
CREATE INDEX "Inquiry_buyerId_idx" ON "Inquiry"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "Inquiry_assetId_buyerId_key" ON "Inquiry"("assetId", "buyerId");
