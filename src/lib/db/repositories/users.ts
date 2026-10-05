import type { Prisma, User as UserRow } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import type { Paged, Role, User, UserStatus } from "@/types";

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

export async function listUsers(
  filters: ListUsersFilters = {},
): Promise<Paged<User>> {
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

  return { items: rows.map(toDomain), total };
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
