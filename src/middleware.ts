import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

import { ROLE_HOME } from "@/lib/auth/types";
import type { Role } from "@/types";

// Edge runtime: JWT decode only — no Prisma, no auth() config.
const PROTECTED: Array<{ prefix: string; role: Role }> = [
  { prefix: "/buyer", role: "BUYER" },
  { prefix: "/seller", role: "SELLER" },
  { prefix: "/manager", role: "MANAGER" },
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const match = PROTECTED.find(
    (m) => pathname === m.prefix || pathname.startsWith(`${m.prefix}/`),
  );
  if (!match) return NextResponse.next();

  // On HTTPS Auth.js prefixes the cookie with `__Secure-`, and getToken
  // derives its decryption salt from the cookie name — without this flag it
  // looks for the unprefixed name and every live session reads as anonymous.
  const isHttps =
    req.headers.get("x-forwarded-proto") === "https" ||
    req.nextUrl.protocol === "https:";
  const token = await getToken({
    req,
    secret: process.env.AUTH_SECRET ?? "",
    secureCookie: isHttps,
  });

  // Make the current pathname available to guards via headers().
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  const withPathname = { request: { headers: requestHeaders } };

  // Unauthenticated → /login?next=...
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Suspended/deleted session → no access, clear error.
  if (token.status !== "ACTIVE") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set(
      "error",
      `account_${String(token.status).toLowerCase()}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  // Wrong role → their own home.
  if (token.role !== match.role) {
    return NextResponse.redirect(new URL(ROLE_HOME[token.role], req.url));
  }

  return NextResponse.next(withPathname);
}

export const config = {
  matcher: ["/buyer/:path*", "/seller/:path*", "/manager/:path*"],
};
