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
import { useLocaleHref, useT } from "@/i18n/client";
import { ASSET_STATUS_KEYS, LICENSE_KEYS } from "@/i18n/core";
import { AssetStatus, JURISDICTIONS, LicenseType } from "@/types";

const LICENSE_OPTIONS = Object.values(LicenseType);
const JURISDICTION_OPTIONS = [...JURISDICTIONS];
const STATUS_OPTIONS = Object.values(AssetStatus);

function selectedValues(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((v) => v.split(","))
    .filter((v) => v.length > 0);
}

/**
 * Moderation filters live in the URL query. Supports repeated params and
 * comma-separated values (`?licenseType=EMI,PI`).
 */
export function ManagerAssetFilterBar() {
  const t = useT();
  const localizedHref = useLocaleHref();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const queryKey = params.toString();

  const status = params.get("status") ?? "";

  function replace(next: URLSearchParams) {
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
    replace(next);
  }

  function applyText(formData: FormData) {
    const next = new URLSearchParams(params.toString());
    const q = String(formData.get("q") ?? "").trim();
    if (q) next.set("q", q);
    else next.delete("q");
    replace(next);
  }

  function changeStatus(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "") next.delete("status");
    else next.set("status", value);
    replace(next);
  }

  const selectedLicense = selectedValues(params, "licenseType");
  const selectedJurisdiction = selectedValues(params, "jurisdiction");

  return (
    <Card className="bg-surface">
      <CardContent className="flex flex-col gap-4 pt-6">
        <form
          key={queryKey}
          action={applyText}
          className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end"
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="manager-asset-q">{t("common.search")}</Label>
            <Input
              id="manager-asset-q"
              name="q"
              type="search"
              placeholder={t("manager.assetFilter.placeholder")}
              defaultValue={params.get("q") ?? ""}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label id="manager-asset-status-label">{t("common.status")}</Label>
            <Select value={status} onValueChange={changeStatus}>
              <SelectTrigger
                aria-labelledby="manager-asset-status-label"
                className="w-44"
              >
                <SelectValue placeholder={t("manager.filters.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {t(ASSET_STATUS_KEYS[option])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button type="submit">{t("manager.filters.apply")}</Button>
            {queryKey.length > 0 && (
              <Button type="button" variant="outline" asChild>
                <Link href={localizedHref("/manager/assets")}>
                  {t("manager.filters.reset")}
                </Link>
              </Button>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-8">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("manager.assetFilter.licenseType")}
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
              {t("manager.assetFilter.jurisdiction")}
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
        </div>
      </CardContent>
    </Card>
  );
}
