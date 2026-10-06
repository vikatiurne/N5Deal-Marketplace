import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_LOCALE,
  isEnPrefixedPath,
  isUkPath,
  stripUkPrefix,
  withUkPrefix,
  type Locale,
} from "@/i18n/config";
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
  let locale: Locale = DEFAULT_LOCALE;
  let logicalPath = pathname;

  if (isUkPath(pathname)) {
    locale = "uk";
    logicalPath = stripUkPrefix(pathname);
  } else if (isEnPrefixedPath(pathname)) {
    // /en/... is a non-canonical alias — English lives unprefixed.
    const url = req.nextUrl.clone();
    url.pathname = stripEnPrefix(pathname);
    return NextResponse.redirect(url);
  }

  const match = PROTECTED.find(
    (m) => logicalPath === m.prefix || logicalPath.startsWith(`${m.prefix}/`),
  );

  // Language rewrite helper: /uk/... → canonical path, locale passed via header.
  const respond = (headers: Headers): NextResponse => {
    if (locale !== "uk") return NextResponse.next({ request: { headers } });
    const url = req.nextUrl.clone();
    url.pathname = logicalPath;
    return NextResponse.rewrite(url, { request: { headers } });
  };

  if (!match) {
    if (locale !== "uk") return NextResponse.next();
    const headers = new Headers(req.headers);
    headers.set("x-locale", "uk");
    headers.set("x-pathname", pathname);
    return respond(headers);
  }

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

  // Make the current pathname (locale-prefixed as seen by the browser)
  // available to guards via headers().
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);
  if (locale === "uk") requestHeaders.set("x-locale", "uk");

  const withHeaders = { request: { headers: requestHeaders } };

  const localePath = (path: string) =>
    locale === "uk" ? withUkPrefix(path) : path;

  // Unauthenticated → /login?next=...
  if (!token) {
    const loginUrl = new URL(localePath("/login"), req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Suspended/deleted session → no access, clear error.
  if (token.status !== "ACTIVE") {
    const loginUrl = new URL(localePath("/login"), req.url);
    loginUrl.searchParams.set(
      "error",
      `account_${String(token.status).toLowerCase()}`,
    );
    return NextResponse.redirect(loginUrl);
  }

  // Wrong role → their own home.
  if (token.role !== match.role) {
    return NextResponse.redirect(
      new URL(localePath(ROLE_HOME[token.role]), req.url),
    );
  }

  if (locale === "uk") {
    const url = req.nextUrl.clone();
    url.pathname = logicalPath;
    return NextResponse.rewrite(url, withHeaders);
  }
  return NextResponse.next(withHeaders);
}

function stripEnPrefix(pathname: string): string {
  if (pathname === "/en") return "/";
  return pathname.slice("/en".length) || "/";
}

export const config = {
  matcher: [
    "/buyer/:path*",
    "/seller/:path*",
    "/manager/:path*",
    "/uk/:path*",
    "/en/:path*",
  ],
};
