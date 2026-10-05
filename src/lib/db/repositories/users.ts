import type { Prisma, User as UserRow } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { Paged, Role, User, UserPreview, UserStatus } from "@/types";

function toDomain(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
    status: row.status,
    displayName: row.displayName,
    company: row.company,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** Drops the password hash before anything reaches a view or a client prop. */
function toPreview(row: UserRow): UserPreview {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    displayName: row.displayName,
    company: row.company,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export interface ListUsersFilters {
  q?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  pageSize?: number;
}

export async function findUserById(id: string): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toDomain(row) : null;
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const row = await prisma.user.findUnique({ where: { email } });
  return row ? toDomain(row) : null;
}

/**
 * Current role + status straight from the database. Guards use this instead of
 * the JWT claims: a session issued before a suspension must lose access
 * immediately, not when it expires.
 */
export async function findAccountAccess(
  id: string,
): Promise<{ role: Role; status: UserStatus } | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { role: true, status: true },
  });
}

export async function listUsers(
  filters: ListUsersFilters = {},
): Promise<Paged<UserPreview>> {
  const { q, role, status, page = 1, pageSize = 20 } = filters;
  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { displayName: { contains: q } },
            { email: { contains: q } },
            { company: { contains: q } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  return { items: rows.map(toPreview), total };
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  role: Role;
  displayName: string;
  company?: string | null;
  status?: UserStatus;
}): Promise<User> {
  const row = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role,
      displayName: data.displayName,
      company: data.company ?? null,
      ...(data.status ? { status: data.status } : {}),
    },
  });
  return toDomain(row);
}

export async function updateUser(
  id: string,
  data: Partial<{ displayName: string; company: string | null }>,
): Promise<User> {
  const row = await prisma.user.update({ where: { id }, data });
  return toDomain(row);
}

export async function updateUserStatus(
  id: string,
  status: UserStatus,
): Promise<User> {
  const row = await prisma.user.update({ where: { id }, data: { status } });
  return toDomain(row);
}

export type UserCountMatrix = Record<Role, Record<UserStatus, number>>;

/**
 * Users grouped by role × status for the manager dashboard. One grouped query
 * instead of nine counts.
 */
export async function countUsersByRoleAndStatus(): Promise<UserCountMatrix> {
  const grouped = await prisma.user.groupBy({
    by: ["role", "status"],
    _count: { _all: true },
  });

  const emptyRow = (): Record<UserStatus, number> => ({
    ACTIVE: 0,
    SUSPENDED: 0,
    DELETED: 0,
  });

  const counts: UserCountMatrix = {
    BUYER: emptyRow(),
    SELLER: emptyRow(),
    MANAGER: emptyRow(),
  };

  for (const row of grouped) counts[row.role][row.status] = row._count._all;
  return counts;
}

/** Newest accounts first — dashboard "recent signups". */
export async function listRecentUsers(limit = 5): Promise<UserPreview[]> {
  const rows = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.map(toPreview);
}
