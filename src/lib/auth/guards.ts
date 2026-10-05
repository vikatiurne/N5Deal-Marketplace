import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
import { findAccountAccess } from "@/lib/db/repositories/users";
import { ROLE_HOME, type SessionUser } from "@/lib/auth/types";
import type { Role } from "@/types";

/**
 * Safe nullable session read — use in layouts/pages for conditional UI.
 */
export async function getSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    role: session.user.role,
    status: session.user.status,
  };
}

async function currentPath(): Promise<string> {
  const headersList = await headers();
  return headersList.get("x-pathname") ?? "/";
}

/**
 * Server-side guard: returns the user or redirects to /login?next=...
 *
 * Role and status are re-read from the database instead of being trusted from
 * the JWT: the token is minted at login, so without this a manager's suspension
 * (or soft delete) would keep working until the cookie expired.
 */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    const path = await currentPath();
    const next = path !== "/" ? `?next=${encodeURIComponent(path)}` : "";
    redirect(`/login${next}`);
  }

  const account = await findAccountAccess(session.id);
  if (!account) {
    redirect("/login?error=account_deleted");
  }
  if (account.status !== "ACTIVE") {
    redirect(`/login?error=account_${account.status.toLowerCase()}`);
  }

  return { ...session, role: account.role, status: account.status };
}

/**
 * Server-side role guard: wrong role → redirect to the caller's own home.
 */
export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== role) {
    redirect(ROLE_HOME[user.role]);
  }
  return user;
}
