import type { Inquiry as InquiryRow } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { Asset, Inquiry, Role } from "@/types";

function toDomain(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    assetId: row.assetId,
    buyerId: row.buyerId,
    initiatorRole: row.initiatorRole,
    message: row.message,
    readAt: row.readAt,
    createdAt: row.createdAt,
  };
}

/** Counterparty shown to the other side — never email or credentials. */
export interface UserSummary {
  id: string;
  displayName: string;
  company: string | null;
}

function toUserSummary(row: {
  id: string;
  displayName: string;
  company: string | null;
}): UserSummary {
  return { id: row.id, displayName: row.displayName, company: row.company };
}

/**
 * Creates an inquiry. `initiatorRole` is the direction: BUYER (buyer → seller)
 * or SELLER (seller → buyer). Throws on unique violation
 * @@unique([assetId, buyerId, initiatorRole]) (Prisma P2002) — server actions
 * map it to a friendly error.
 */
export async function createInquiry(data: {
  assetId: string;
  buyerId: string;
  initiatorRole: Role;
  message: string;
}): Promise<Inquiry> {
  const row = await prisma.inquiry.create({ data });
  return toDomain(row);
}

export async function findInquiry(
  assetId: string,
  buyerId: string,
  initiatorRole: Role = "BUYER",
): Promise<Inquiry | null> {
  const row = await prisma.inquiry.findUnique({
    where: {
      assetId_buyerId_initiatorRole: { assetId, buyerId, initiatorRole },
    },
  });
  return row ? toDomain(row) : null;
}

export async function listInquiriesByBuyer(
  buyerId: string,
): Promise<Inquiry[]> {
  const rows = await prisma.inquiry.findMany({
    where: { buyerId, initiatorRole: "BUYER" },
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
  return prisma.inquiry.count({ where: { buyerId, initiatorRole: "BUYER" } });
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
  seller: UserSummary;
}

/** Inquiries of one buyer joined with the asset and its seller, newest first. */
export async function listInquiriesForBuyer(
  buyerId: string,
): Promise<InquiryWithAsset[]> {
  const rows = await prisma.inquiry.findMany({
    where: { buyerId, initiatorRole: "BUYER" },
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
    seller: toUserSummary(row.asset.seller),
  }));
}

export interface InquiryWithParticipants extends Inquiry {
  asset: Pick<
    Asset,
    "id" | "title" | "licenseType" | "jurisdiction" | "status"
  >;
  buyer: UserSummary;
}

export interface IncomingInquiryFilters {
  sellerId: string;
  buyerId?: string;
  assetId?: string;
  limit?: number;
}

/**
 * Buyer → seller inquiries received by this seller. `readAt` is only ever set
 * by the seller, so unread means "the seller has not opened it yet".
 */
export async function listIncomingInquiries(
  filters: IncomingInquiryFilters,
): Promise<InquiryWithParticipants[]> {
  const rows = await prisma.inquiry.findMany({
    where: {
      initiatorRole: "BUYER",
      asset: {
        sellerId: filters.sellerId,
        ...(filters.assetId ? { id: filters.assetId } : {}),
      },
      ...(filters.buyerId ? { buyerId: filters.buyerId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: filters.limit,
    include: { asset: true, buyer: true },
  });

  return rows.map((row) => ({
    ...toDomain(row),
    asset: {
      id: row.asset.id,
      title: row.asset.title,
      licenseType: row.asset.licenseType,
      jurisdiction: row.asset.jurisdiction,
      status: row.asset.status,
    },
    buyer: toUserSummary(row.buyer),
  }));
}

export interface IncomingCountFilters {
  sellerId: string;
  unreadOnly?: boolean;
}

export async function countIncomingInquiries({
  sellerId,
  unreadOnly = false,
}: IncomingCountFilters): Promise<number> {
  return prisma.inquiry.count({
    where: {
      initiatorRole: "BUYER",
      asset: { sellerId },
      ...(unreadOnly ? { readAt: null } : {}),
    },
  });
}

/**
 * Marks inquiries as read, but only those sitting on the seller's own assets —
 * a tampered id list can never touch somebody else's inbox.
 */
export async function markInquiriesRead(
  inquiryIds: string[],
  sellerId: string,
): Promise<number> {
  const { count } = await prisma.inquiry.updateMany({
    where: {
      id: { in: inquiryIds },
      initiatorRole: "BUYER",
      readAt: null,
      asset: { sellerId },
    },
    data: { readAt: new Date() },
  });
  return count;
}

/** Which of the seller's assets already have a seller → buyer message. */
export async function listSentMessagesBySeller(
  sellerId: string,
  buyerId: string,
): Promise<Array<Pick<Inquiry, "id" | "assetId" | "createdAt">>> {
  const rows = await prisma.inquiry.findMany({
    where: { initiatorRole: "SELLER", buyerId, asset: { sellerId } },
    orderBy: { createdAt: "desc" },
    select: { id: true, assetId: true, createdAt: true },
  });
  return rows;
}

export type InquiryTotals = {
  total: number;
  fromBuyers: number;
  fromSellers: number;
  unread: number;
};

/** Platform-wide inquiry totals for the manager dashboard. */
export async function countAllInquiries(): Promise<InquiryTotals> {
  const [total, fromBuyers, fromSellers, unread] = await Promise.all([
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { initiatorRole: "BUYER" } }),
    prisma.inquiry.count({ where: { initiatorRole: "SELLER" } }),
    prisma.inquiry.count({ where: { readAt: null } }),
  ]);
  return { total, fromBuyers, fromSellers, unread };
}
