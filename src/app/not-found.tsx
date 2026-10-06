import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { localizePath } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";

/**
 * 404 page (task 09 §3).
 *
 * Three routes call `notFound()` — an unpublished/unknown asset, an unknown
 * buyer and an unknown listing edit form — and all of them used to fall through
 * to Next.js's unstyled development 404.
 */
export default async function NotFound() {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          404
        </p>
        <h1 className="text-lg font-semibold tracking-tight">
          {t("error.notFound.title")}
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("error.notFound.description")}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href={localizePath(locale, "/assets")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("nav.browseAssets")}
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={localizePath(locale, "/")}>
            {t("error.notFound.goHome")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
