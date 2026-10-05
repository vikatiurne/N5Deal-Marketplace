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
