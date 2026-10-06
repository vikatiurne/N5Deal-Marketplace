"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocaleHref, useT } from "@/i18n/client";
import { LICENSE_KEYS } from "@/i18n/core";
import { JURISDICTIONS, LicenseType } from "@/types";

const LICENSE_OPTIONS = Object.values(LicenseType);

/**
 * Same contract as the public FilterBar: the URL is the single source of
 * truth, inputs are uncontrolled and re-synced via `key={queryKey}`.
 */
export function BuyerFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useT();
  const localizedHref = useLocaleHref();
  const queryKey = params.toString();

  const selectedJurisdictions = params.getAll("jurisdiction");
  const selectedLicenses = params.getAll("licenseType");

  function replaceWith(next: URLSearchParams) {
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function toggle(value: string, key: "jurisdiction" | "licenseType") {
    const next = new URLSearchParams(params.toString());
    const current = next.getAll(key).flatMap((v) => v.split(","));
    next.delete(key);
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (updated.length > 0) next.set(key, updated.join(","));
    replaceWith(next);
  }

  function applyTextFilters(formData: FormData) {
    const next = new URLSearchParams(params.toString());
    for (const key of ["q", "budgetMin", "budgetMax"]) {
      const value = String(formData.get(key) ?? "").trim();
      if (value) next.set(key, value);
      else next.delete(key);
    }
    replaceWith(next);
  }

  return (
    <Card className="bg-surface">
      <CardContent className="flex flex-col gap-4 pt-6">
        <form
          key={queryKey}
          action={applyTextFilters}
          className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="buyer-q">{t("common.search")}</Label>
            <Input
              id="buyer-q"
              name="q"
              type="search"
              placeholder={t("seller.filter.searchPlaceholder")}
              defaultValue={params.get("q") ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="buyer-budgetMin">
              {t("seller.filter.budgetFrom")}
            </Label>
            <Input
              id="buyer-budgetMin"
              name="budgetMin"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="500000"
              defaultValue={params.get("budgetMin") ?? ""}
              className="w-36"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="buyer-budgetMax">
              {t("seller.filter.budgetTo")}
            </Label>
            <Input
              id="buyer-budgetMax"
              name="budgetMax"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="3000000"
              defaultValue={params.get("budgetMax") ?? ""}
              className="w-36"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">{t("seller.filter.apply")}</Button>
            {queryKey.length > 0 && (
              <Button type="button" variant="outline" asChild>
                <Link href={localizedHref(pathname)}>
                  {t("seller.filter.reset")}
                </Link>
              </Button>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("seller.filter.jurisdiction")}
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {JURISDICTIONS.map((code) => (
                <label
                  key={code}
                  className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Checkbox
                    checked={selectedJurisdictions.includes(code)}
                    onCheckedChange={() => toggle(code, "jurisdiction")}
                  />
                  {code}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("seller.filter.licenseType")}
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {LICENSE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Checkbox
                    checked={selectedLicenses.includes(option)}
                    onCheckedChange={() => toggle(option, "licenseType")}
                  />
                  {t(LICENSE_KEYS[option])}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </CardContent>
    </Card>
  );
}
