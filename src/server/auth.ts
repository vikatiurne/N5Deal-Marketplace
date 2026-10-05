"use server";

import bcrypt from "bcryptjs";

import { signIn, signOut } from "@/lib/auth/auth";
import { ROLE_HOME } from "@/lib/auth/types";
import { requireUser } from "@/lib/auth/guards";
import { createUser, findUserByEmail } from "@/lib/db/repositories/users";
import { registerSchema } from "@/lib/validation/auth";

function isPrismaUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && e.code === "P2002"
  );
}

export interface ActionResult {
  ok: boolean;
  error?: string;
  /** Where to go on success — role home or /login with ?next= */
  redirectTo?: string;
}

/**
 * Registers a BUYER or SELLER account (MANAGER is not self-serve),
 * then signs in via the Credentials provider.
 */
export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { email, password, displayName, role } = parsed.data;

  const existing = await findUserByEmail(email);
  if (existing) {
    return { ok: false, error: "Email already registered" };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    await createUser({ email, passwordHash, role, displayName });
  } catch (e) {
    if (isPrismaUniqueError(e)) {
      return { ok: false, error: "Email already registered" };
    }
    throw e;
  }

  // Auto-login. Server signIn with redirect:false returns the target URL;
  // an error URL (contains ?error=) means login failed — account is created.
  const url = await signIn("credentials", { email, password, redirect: false });
  if (typeof url === "string" && url.includes("error=")) {
    return { ok: true, redirectTo: "/login?registered=1" };
  }

  return { ok: true, redirectTo: ROLE_HOME[role] };
}

/** Logout via server action (task requirement). */
export async function logoutAction(): Promise<void> {
  await requireUser();
  await signOut({ redirectTo: "/" });
}
