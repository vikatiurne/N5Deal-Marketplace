import type { Prisma, Asset as AssetRow } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { Asset, AssetStatus, LicenseType, Paged } from "@/types";

function toDomain(row: AssetRow): Asset {
  return {
    id: row.id,
    sellerId: row.sellerId,
    title: row.title,
    licenseType: row.licenseType,
    jurisdiction: row.jurisdiction,
    price: row.price,
    currency: row.currency,
    description: row.description,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface AssetFilters {
  q?: string;
  licenseType?: LicenseType[];
  jurisdiction?: string[];
  priceMin?: number;
  priceMax?: number;
  status?: AssetStatus;
  sellerId?: string;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  pageSize?: number;
}

export async function listAssets(
  filters: AssetFilters = {},
): Promise<Paged<Asset>> {
  const {
    q,
    licenseType,
    jurisdiction,
    priceMin,
    priceMax,
    status,
    sellerId,
    sort = "newest",
    page = 1,
    pageSize = 12,
  } = filters;

  const where: Prisma.AssetWhereInput = {
    ...(status ? { status } : {}),
    ...(sellerId ? { sellerId } : {}),
    ...(licenseType && licenseType.length > 0
      ? { licenseType: { in: licenseType } }
      : {}),
    ...(jurisdiction && jurisdiction.length > 0
      ? { jurisdiction: { in: jurisdiction } }
      : {}),
    ...(priceMin !== undefined || priceMax !== undefined
      ? {
          price: {
            ...(priceMin !== undefined ? { gte: priceMin } : {}),
            ...(priceMax !== undefined ? { lte: priceMax } : {}),
          },
        }
      : {}),
    ...(q
      ? { OR: [{ title: { contains: q } }, { description: { contains: q } }] }
      : {}),
  };

  const orderBy: Prisma.AssetOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
        ? { price: "desc" }
        : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.asset.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.asset.count({ where }),
  ]);

  return { items: rows.map(toDomain), total };
}

export async function findAssetById(id: string): Promise<Asset | null> {
  const row = await prisma.asset.findUnique({ where: { id } });
  return row ? toDomain(row) : null;
}

export async function listAssetsBySeller(sellerId: string): Promise<Asset[]> {
  const rows = await prisma.asset.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDomain);
}

/**
 * Ownership gate for every seller mutation — returns null instead of throwing
 * so callers can answer "not yours" (403) instead of crashing (500).
 */
export async function findOwnedAsset(
  assetId: string,
  sellerId: string,
): Promise<Asset | null> {
  const row = await prisma.asset.findFirst({
    where: { id: assetId, sellerId },
  });
  return row ? toDomain(row) : null;
}

export type AssetStatusCounts = Record<AssetStatus, number>;

/** Counts of the seller's own assets per status — one grouped query. */
export async function countAssetsByStatus(
  sellerId: string,
): Promise<AssetStatusCounts> {
  const grouped = await prisma.asset.groupBy({
    by: ["status"],
    where: { sellerId },
    _count: { _all: true },
  });

  const counts: AssetStatusCounts = {
    DRAFT: 0,
    PUBLISHED: 0,
    PAUSED: 0,
    REMOVED: 0,
  };
  for (const row of grouped) counts[row.status] = row._count._all;
  return counts;
}

export type SellerAsset = Asset & { inquiryCount: number; unreadCount: number };

/**
 * Seller's own assets with how many buyer inquiries (and unread ones) each got.
 * Counts come from grouped queries and are merged in JS — SQLite has no
 * filtered aggregate in a single relation count.
 */
export async function listSellerAssets(
  sellerId: string,
): Promise<SellerAsset[]> {
  const where = { initiatorRole: "BUYER" as const, asset: { sellerId } };

  const [rows, totals, unread] = await Promise.all([
    prisma.asset.findMany({
      where: { sellerId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.inquiry.groupBy({
      by: ["assetId"],
      where,
      _count: { _all: true },
    }),
    prisma.inquiry.groupBy({
      by: ["assetId"],
      where: { ...where, readAt: null },
      _count: { _all: true },
    }),
  ]);

  const totalBy = new Map(totals.map((g) => [g.assetId, g._count._all]));
  const unreadBy = new Map(unread.map((g) => [g.assetId, g._count._all]));

  return rows.map((row) => ({
    ...toDomain(row),
    inquiryCount: totalBy.get(row.id) ?? 0,
    unreadCount: unreadBy.get(row.id) ?? 0,
  }));
}

export async function createAsset(data: {
  sellerId: string;
  title: string;
  licenseType: LicenseType;
  jurisdiction: string;
  price?: number | null;
  currency?: string;
  description: string;
  status?: AssetStatus;
}): Promise<Asset> {
  const row = await prisma.asset.create({
    data: {
      sellerId: data.sellerId,
      title: data.title,
      licenseType: data.licenseType,
      jurisdiction: data.jurisdiction,
      price: data.price ?? null,
      currency: data.currency ?? "EUR",
      description: data.description,
      status: data.status ?? "DRAFT",
    },
  });
  return toDomain(row);
}

export async function updateAsset(
  id: string,
  data: Partial<{
    title: string;
    licenseType: LicenseType;
    jurisdiction: string;
    price: number | null;
    currency: string;
    description: string;
    status: AssetStatus;
  }>,
): Promise<Asset> {
  const row = await prisma.asset.update({ where: { id }, data });
  return toDomain(row);
}
