/**
 * Locale routing config. Kept dependency-free and importable from the
 * middleware (edge) — no message dictionaries here, only path helpers.
 *
 * URL scheme: English is the default locale and stays UNPREFIXED so every
 * existing link (README, DEMO, live smoke checks) keeps working; Ukrainian
 * lives under /uk/... (`uk` = ISO 639-1 for Ukrainian, not the UA country
 * code). /en/... is redirected to the canonical unprefixed form.
 */
export const LOCALES = ["en", "uk"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const UK_PREFIX = "/uk";

export function isUkPath(pathname: string): boolean {
  return pathname === UK_PREFIX || pathname.startsWith(`${UK_PREFIX}/`);
}

export function isEnPrefixedPath(pathname: string): boolean {
  return pathname === "/en" || pathname.startsWith("/en/");
}

/** "/uk/assets?x" input paths: "/uk/seller" -> "/seller", "/uk" -> "/". */
export function stripUkPrefix(pathname: string): string {
  if (pathname === UK_PREFIX) return "/";
  return pathname.slice(UK_PREFIX.length) || "/";
}

/** "/seller" -> "/uk/seller"; "/" -> "/uk". */
export function withUkPrefix(pathname: string): string {
  return pathname === "/" ? UK_PREFIX : `${UK_PREFIX}${pathname}`;
}

export function resolveLocale(headerValue: string | null): Locale {
  return headerValue === "uk" ? "uk" : DEFAULT_LOCALE;
}

/** BCP-47 tag for Intl formatters (dates, numbers, currency). */
export function intlLocale(locale: Locale): string {
  return locale === "uk" ? "uk-UA" : "en-IE";
}

/**
 * Prefix a link target with the locale when needed. Server components use it
 * so in-app links on /uk/... pages stay in Ukrainian.
 */
export function localizePath(locale: Locale, path: string): string {
  if (locale !== "uk") return path;
  return isUkPath(path) || isEnPrefixedPath(path) ? path : withUkPrefix(path);
}
