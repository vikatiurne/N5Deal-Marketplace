"use client";

import { usePathname } from "next/navigation";

import { withUkPrefix, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { Button } from "@/components/ui/button";

/**
 * Segmented EN/UA switch. Locale lives in the URL, so switching rewrites the
 * prefix of the current path and carries the query string (filters) over.
 *
 * Navigation is a full page load on purpose: the locale reaches client
 * components through `I18nProvider` in the *root layout*, and Next.js does
 * not re-render the root layout on soft navigation — a `router.push` would
 * update page content but keep the provider (and the server-rendered header)
 * on the old locale, so the next click would no-op. A full load re-renders
 * `<html lang>`, the provider and the header from the new `/uk/…` URL every
 * time.
 *
 * SSR hrefs omit the query (server has no search params without
 * useSearchParams/Suspense); click-time navigation appends it, so regular
 * clicks keep filters — only modified clicks (open in new tab) lose them.
 */
export function LanguageSwitcher() {
  const { locale, t } = useI18n();
  const pathname = usePathname();

  const base =
    pathname === "/uk"
      ? "/"
      : pathname.startsWith("/uk/")
        ? pathname.slice(3)
        : pathname;

  const hrefFor = (target: Locale) =>
    target === "uk" ? withUkPrefix(base) : base;

  const go = (target: Locale) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (target === locale) return;
    window.location.assign(hrefFor(target) + window.location.search);
  };

  return (
    <div
      role="group"
      aria-label={t("switcher.ariaLabel")}
      className="flex items-center rounded-md border border-border"
    >
      {(["en", "uk"] as const).map((target) => (
        <Button
          key={target}
          variant={target === locale ? "secondary" : "ghost"}
          size="sm"
          aria-pressed={target === locale}
          aria-label={target === "en" ? t("switcher.toEn") : t("switcher.toUk")}
          className="h-7 px-2 text-xs"
          onClick={go(target)}
        >
          {target === "en" ? t("switcher.en") : t("switcher.uk")}
        </Button>
      ))}
    </div>
  );
}
