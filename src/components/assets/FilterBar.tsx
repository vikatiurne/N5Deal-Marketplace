"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT, useLocaleHref } from "@/i18n/client";
import { LICENSE_KEYS, type MessageKey } from "@/i18n/core";
import { LicenseType } from "@/types";

const LICENSE_OPTIONS = Object.values(LicenseType);
const JURISDICTION_OPTIONS = ["LT", "CY", "MT", "EE", "PL"];

const SORT_OPTIONS: ReadonlyArray<{ value: string; labelKey: MessageKey }> = [
  { value: "newest", labelKey: "filters.sort.newest" },
  { value: "price_asc", labelKey: "filters.sort.price_asc" },
  { value: "price_desc", labelKey: "filters.sort.price_desc" },
];

function selectedValues(params: URLSearchParams, key: string): string[] {
  const direct = params.getAll(key);
  return direct.flatMap((v) => v.split(",")).filter((v) => v.length > 0);
}

/**
 * Filters live entirely in the URL query — no React state for values.
 * Inputs are uncontrolled with `key={query}` so Back/Reset re-syncs them.
 */
export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useT();
  const localizedHref = useLocaleHref();
  const queryKey = params.toString();

  const selectedLicense = selectedValues(params, "licenseType");
  const selectedJurisdiction = selectedValues(params, "jurisdiction");
  const sort = params.get("sort") ?? "newest";

  function replaceWith(next: URLSearchParams) {
    next.delete("page");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  function toggle(value: string, key: "licenseType" | "jurisdiction") {
    const next = new URLSearchParams(params.toString());
    const current = selectedValues(next, key);
    next.delete(key);
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    if (updated.length > 0) next.set(key, updated.join(","));
    replaceWith(next);
  }

  function applyTextFilters(formData: FormData) {
    const next = new URLSearchParams(params.toString());
    const q = String(formData.get("q") ?? "").trim();
    const priceMin = String(formData.get("priceMin") ?? "").trim();
    const priceMax = String(formData.get("priceMax") ?? "").trim();
    if (q) next.set("q", q);
    else next.delete("q");
    if (priceMin) next.set("priceMin", priceMin);
    else next.delete("priceMin");
    if (priceMax) next.set("priceMax", priceMax);
    else next.delete("priceMax");
    replaceWith(next);
  }

  function changeSort(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "newest") next.delete("sort");
    else next.set("sort", value);
    replaceWith(next);
  }

  const hasActiveFilters = queryKey.length > 0;

  return (
    <Card className="bg-surface">
      <CardContent className="flex flex-col gap-4 pt-6">
        <form
          key={queryKey}
          action={applyTextFilters}
          className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-q">{t("filters.search")}</Label>
            <Input
              id="filter-q"
              name="q"
              type="search"
              placeholder={t("filters.qPlaceholder")}
              defaultValue={params.get("q") ?? ""}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-priceMin">{t("filters.minPrice")}</Label>
            <Input
              id="filter-priceMin"
              name="priceMin"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="150000"
              defaultValue={params.get("priceMin") ?? ""}
              className="w-36"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="filter-priceMax">{t("filters.maxPrice")}</Label>
            <Input
              id="filter-priceMax"
              name="priceMax"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              placeholder="3000000"
              defaultValue={params.get("priceMax") ?? ""}
              className="w-36"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit">{t("filters.apply")}</Button>
            {hasActiveFilters && (
              <Button type="button" variant="outline" asChild>
                <Link href={localizedHref("/assets")}>
                  {t("filters.reset")}
                </Link>
              </Button>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("filters.licenseType")}
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {LICENSE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Checkbox
                    checked={selectedLicense.includes(option)}
                    onCheckedChange={() => toggle(option, "licenseType")}
                  />
                  {t(LICENSE_KEYS[option])}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("filters.jurisdiction")}
            </legend>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {JURISDICTION_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Checkbox
                    checked={selectedJurisdiction.includes(option)}
                    onCheckedChange={() => toggle(option, "jurisdiction")}
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-1.5 md:ml-auto">
            <Label id="filter-sort-label">{t("filters.sortBy")}</Label>
            <Select value={sort} onValueChange={changeSort}>
              <SelectTrigger
                aria-labelledby="filter-sort-label"
                className="w-48"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
