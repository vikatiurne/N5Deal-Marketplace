import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

import { findUserByEmail } from "@/lib/db/repositories/users";
import { loginSchema } from "@/lib/validation/auth";
import type { SessionUser } from "@/lib/auth/types";

/**
 * Codes returned to the client in the `code` query param (never expose
 * sensitive details — full error is logged server-side only).
 */
const AUTH_ERRORS = {
  noAccount: "no_account",
  invalidPassword: "invalid_password",
  suspended: "account_suspended",
  deleted: "account_deleted",
} as const;

class SigninError extends CredentialsSignin {
  constructor(code: string) {
    super();
    this.code = code;
  }
}

async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Self-hosted (not Vercel): without this Auth.js rejects the request host in
  // production builds with UntrustedHost, so login only works in `next dev`.
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(raw) {
        const parsed = loginSchema.safeParse({
          email: raw.email,
          password: raw.password,
        });
        if (!parsed.success) throw new SigninError(AUTH_ERRORS.noAccount);

        const user = await findUserByEmail(parsed.data.email);
        if (!user) throw new SigninError(AUTH_ERRORS.noAccount);

        const valid = await verifyPassword(
          parsed.data.password,
          user.passwordHash,
        );
        if (!valid) throw new SigninError(AUTH_ERRORS.invalidPassword);

        // SUSPENDED/DELETED users never get a session (task requirement).
        if (user.status === "SUSPENDED")
          throw new SigninError(AUTH_ERRORS.suspended);
        if (user.status === "DELETED")
          throw new SigninError(AUTH_ERRORS.deleted);

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    // Token carries id, role, status (task requirement).
    jwt({ token, user }) {
      if (user) {
        const u = user as SessionUser & { id: string };
        token.id = u.id;
        token.role = u.role;
        token.status = u.status;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.status = token.status;
      return session;
    },
  },
});

export { AUTH_ERRORS };
