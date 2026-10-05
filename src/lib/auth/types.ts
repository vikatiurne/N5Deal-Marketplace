import type { Role, UserStatus } from "@/types";

/** Minimal user shape carried in the JWT session. */
export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
}

/** Route of the role home page — used by guards, middleware and redirects. */
export const ROLE_HOME: Record<Role, string> = {
  BUYER: "/buyer",
  SELLER: "/seller",
  MANAGER: "/manager",
};

/** Routes protected by middleware, in matcher-friendly form. */
export const PROTECTED_PREFIXES = ["/buyer", "/seller", "/manager"] as const;
