import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth/auth";
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
 * Also re-checks account status — a JWT issued before a suspension
 * must not keep granting access.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    const path = await currentPath();
    const next = path !== "/" ? `?next=${encodeURIComponent(path)}` : "";
    redirect(`/login${next}`);
  }
  if (user.status !== "ACTIVE") {
    redirect(`/login?error=account_${user.status.toLowerCase()}`);
  }
  return user;
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
