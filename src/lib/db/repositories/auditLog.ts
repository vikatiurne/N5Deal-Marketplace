import type { Prisma, AuditLog as AuditLogRow } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { AuditAction, AuditEntry, AuditTargetType, Paged } from "@/types";

/**
 * `meta` is stored as JSON text (SQLite has no JSON column). Writes go through
 * `createAuditLog`, reads through `parseMeta`, so the encoding stays in here.
 */
function parseMeta(raw: string | null): Record<string, string> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" || typeof value === "number") {
        out[key] = String(value);
      }
    }
    return out;
  } catch {
    return null;
  }
}

function serializeMeta(meta?: Record<string, string>): string | null {
  if (!meta || Object.keys(meta).length === 0) return null;
  return JSON.stringify(meta);
}

export async function createAuditLog(data: {
  actorId: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  meta?: Record<string, string>;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorId: data.actorId,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      meta: serializeMeta(data.meta),
    },
  });
}

export interface ListAuditFilters {
  action?: AuditAction;
  targetType?: AuditTargetType;
  targetId?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Audit entries newest first, with the actor attached. `targetLabel` prefers the
 * label snapshotted in `meta` at write time and falls back to a live lookup, so
 * an entry stays readable even if the target was renamed afterwards.
 */
export async function listAuditLogs(
  filters: ListAuditFilters = {},
): Promise<Paged<AuditEntry>> {
  const { action, targetType, targetId, page = 1, pageSize = 25 } = filters;

  const where: Prisma.AuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(targetType ? { targetType } : {}),
    ...(targetId ? { targetId } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { actor: { select: { email: true, displayName: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  const details = rows.map((row) => parseMeta(row.meta));
  const labels = await resolveTargetLabels(rows, details);

  return {
    total,
    items: rows.map((row, i) => ({
      id: row.id,
      actorId: row.actorId,
      actorEmail: row.actor.email,
      actorDisplayName: row.actor.displayName,
      action: row.action,
      targetType: row.targetType,
      targetId: row.targetId,
      targetLabel: labels[i],
      meta: row.meta,
      details: details[i],
      createdAt: row.createdAt,
    })),
  };
}

/** Entry counts per action — drives the filter chips on /manager/audit. */
export async function countAuditLogsByAction(): Promise<
  Record<AuditAction, number>
> {
  const grouped = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: { _all: true },
  });

  const counts = {
    USER_SUSPENDED: 0,
    USER_REACTIVED: 0,
    USER_SOFT_DELETED: 0,
    ASSET_PUBLISHED: 0,
    ASSET_PAUSED: 0,
    ASSET_REMOVED: 0,
  } satisfies Record<AuditAction, number>;

  for (const row of grouped) counts[row.action] = row._count._all;
  return counts;
}

async function countByTargetType(type: AuditTargetType): Promise<number> {
  return prisma.auditLog.count({ where: { targetType: type } });
}

export async function countAuditEntriesByKind(): Promise<{
  user: number;
  asset: number;
}> {
  const [user, asset] = await Promise.all([
    countByTargetType("USER"),
    countByTargetType("ASSET"),
  ]);
  return { user, asset };
}

/**
 * Resolves the missing label snapshot for a page of entries with two indexed
 * lookups (instead of one query per row).
 */
async function resolveTargetLabels(
  rows: AuditLogRow[],
  details: Array<Record<string, string> | null>,
): Promise<string[]> {
  const missingUserIds: string[] = [];
  const missingAssetIds: string[] = [];

  rows.forEach((row, i) => {
    if (details[i]?.label) return;
    if (row.targetType === "USER") missingUserIds.push(row.targetId);
    else missingAssetIds.push(row.targetId);
  });

  const [users, assets] = await Promise.all([
    missingUserIds.length
      ? prisma.user.findMany({
          where: { id: { in: [...new Set(missingUserIds)] } },
          select: { id: true, email: true },
        })
      : [],
    missingAssetIds.length
      ? prisma.asset.findMany({
          where: { id: { in: [...new Set(missingAssetIds)] } },
          select: { id: true, title: true },
        })
      : [],
  ]);

  const userLabels = new Map(users.map((u) => [u.id, u.email]));
  const assetLabels = new Map(assets.map((a) => [a.id, a.title]));

  return rows.map((row, i) => {
    if (details[i]?.label) return details[i].label;
    if (row.targetType === "USER") {
      return userLabels.get(row.targetId) ?? "deleted user";
    }
    return assetLabels.get(row.targetId) ?? "deleted asset";
  });
}
