import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { BuyerProfile, LicenseType, Paged } from "@/types";

const parseJsonArray = (raw: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : [];
  } catch {
    return [];
  }
};

function toDomain(row: {
  userId: string;
  jurisdictions: string;
  licenseTypes: string;
  budgetMin: number | null;
  budgetMax: number | null;
  description: string | null;
}): BuyerProfile {
  return {
    userId: row.userId,
    jurisdictions: parseJsonArray(row.jurisdictions),
    licenseTypes: parseJsonArray(row.licenseTypes) as LicenseType[],
    budgetMin: row.budgetMin,
    budgetMax: row.budgetMax,
    description: row.description,
  };
}

export async function findBuyerProfile(
  userId: string,
): Promise<BuyerProfile | null> {
  const row = await prisma.buyerProfile.findUnique({ where: { userId } });
  return row ? toDomain(row) : null;
}

export async function upsertBuyerProfile(
  userId: string,
  data: {
    jurisdictions: string[];
    licenseTypes: LicenseType[];
    budgetMin?: number | null;
    budgetMax?: number | null;
    description?: string | null;
  },
): Promise<BuyerProfile> {
  const row = await prisma.buyerProfile.upsert({
    where: { userId },
    create: {
      userId,
      jurisdictions: JSON.stringify(data.jurisdictions),
      licenseTypes: JSON.stringify(data.licenseTypes),
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      description: data.description ?? null,
    },
    update: {
      jurisdictions: JSON.stringify(data.jurisdictions),
      licenseTypes: JSON.stringify(data.licenseTypes),
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      description: data.description ?? null,
    },
  });
  return toDomain(row);
}

export interface ListBuyersFilters {
  q?: string;
  jurisdiction?: string;
  licenseType?: LicenseType;
  page?: number;
  pageSize?: number;
}

/**
 * Buyers with their profiles joined in (buyer profile JSON columns are
 * parsed to arrays; searching inside JSON uses LIKE, which is enough for
 * SQLite demo data).
 */
export async function listBuyers(
  filters: ListBuyersFilters = {},
): Promise<
  Paged<BuyerProfile & { displayName: string; company: string | null }>
> {
  const { q, jurisdiction, licenseType, page = 1, pageSize = 20 } = filters;

  const where: Prisma.UserWhereInput = {
    role: "BUYER",
    status: "ACTIVE",
    ...(q
      ? {
          OR: [
            { displayName: { contains: q } },
            { company: { contains: q } },
            { profile: { is: { description: { contains: q } } } },
          ],
        }
      : {}),
    ...(jurisdiction
      ? { profile: { is: { jurisdictions: { contains: jurisdiction } } } }
      : {}),
    ...(licenseType
      ? { profile: { is: { licenseTypes: { contains: licenseType } } } }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { profile: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  const items = rows.flatMap((row) => {
    if (!row.profile) return [];
    return [
      {
        ...toDomain(row.profile),
        displayName: row.displayName,
        company: row.company,
      },
    ];
  });

  return { items, total };
}
