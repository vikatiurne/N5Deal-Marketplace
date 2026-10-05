import type { Inquiry as InquiryRow } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { Inquiry } from "@/types";

function toDomain(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    assetId: row.assetId,
    buyerId: row.buyerId,
    message: row.message,
    createdAt: row.createdAt,
  };
}

/**
 * Creates an inquiry. Throws on unique violation @@unique([assetId, buyerId])
 * (Prisma P2002) — server actions map it to a friendly error.
 */
export async function createInquiry(data: {
  assetId: string;
  buyerId: string;
  message: string;
}): Promise<Inquiry> {
  const row = await prisma.inquiry.create({ data });
  return toDomain(row);
}

export async function findInquiry(
  assetId: string,
  buyerId: string,
): Promise<Inquiry | null> {
  const row = await prisma.inquiry.findUnique({
    where: { assetId_buyerId: { assetId, buyerId } },
  });
  return row ? toDomain(row) : null;
}

export async function listInquiriesByBuyer(
  buyerId: string,
): Promise<Inquiry[]> {
  const rows = await prisma.inquiry.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDomain);
}

export async function listInquiriesByAsset(
  assetId: string,
): Promise<Inquiry[]> {
  const rows = await prisma.inquiry.findMany({
    where: { assetId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDomain);
}
