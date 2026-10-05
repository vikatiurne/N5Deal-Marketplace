import type { Inquiry as InquiryRow } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { Asset, Inquiry } from "@/types";

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

export async function countInquiriesByBuyer(buyerId: string): Promise<number> {
  return prisma.inquiry.count({ where: { buyerId } });
}

/** Seller details a buyer is allowed to see — never the email or credentials. */
export interface SellerSummary {
  id: string;
  displayName: string;
  company: string | null;
}

export interface InquiryWithAsset extends Inquiry {
  asset: Pick<
    Asset,
    | "id"
    | "title"
    | "licenseType"
    | "jurisdiction"
    | "price"
    | "currency"
    | "status"
  >;
  seller: SellerSummary;
}

/** Inquiries of one buyer joined with the asset and its seller, newest first. */
export async function listInquiriesForBuyer(
  buyerId: string,
): Promise<InquiryWithAsset[]> {
  const rows = await prisma.inquiry.findMany({
    where: { buyerId },
    orderBy: { createdAt: "desc" },
    include: { asset: { include: { seller: true } } },
  });

  return rows.map((row) => ({
    ...toDomain(row),
    asset: {
      id: row.asset.id,
      title: row.asset.title,
      licenseType: row.asset.licenseType,
      jurisdiction: row.asset.jurisdiction,
      price: row.asset.price,
      currency: row.asset.currency,
      status: row.asset.status,
    },
    seller: {
      id: row.asset.seller.id,
      displayName: row.asset.seller.displayName,
      company: row.asset.seller.company,
    },
  }));
}
