import { headers } from "next/headers";

import { resolveLocale, type Locale } from "./config";
import { createT, type TFunction } from "./core";
import { errorsUk } from "./messages/parts/uk-errors";

/**
 * Locale is resolved from the `x-locale` request header set by the
 * middleware (rewrite of /uk/... paths). Absent header → English default.
 */
export async function getLocale(): Promise<Locale> {
  const h = await headers();
  return resolveLocale(h.get("x-locale"));
}

export async function getT(): Promise<TFunction> {
  return createT(await getLocale());
}

/**
 * Localises a server-originated error string (zod message or business
 * error). English messages are the schema/source-of-truth wording, so EN
 * passes through untouched and the test suite keeps asserting it.
 */
export async function localizeError(message: string): Promise<string> {
  const locale = await getLocale();
  if (locale !== "uk") return message;
  return errorsUk[message] ?? message;
}

/** Current logical path for building locale-prefixed links server-side. */
export async function getPathname(): Promise<string> {
  const h = await headers();
  return h.get("x-pathname") ?? "/";
}
