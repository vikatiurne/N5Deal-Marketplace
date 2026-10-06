"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useT } from "@/i18n/client";
import { LICENSE_KEYS } from "@/i18n/core";
import { updateBuyerProfile } from "@/server/buyer";
import { cn } from "@/lib/utils";
import { JURISDICTIONS, LicenseType, type BuyerProfile } from "@/types";

const LICENSE_OPTIONS = Object.values(LicenseType);
const DESCRIPTION_MIN = 20;

interface BuyerProfileFormProps {
  company: string;
  profile: BuyerProfile | null;
}

export function BuyerProfileForm({
  company: initialCompany,
  profile,
}: BuyerProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();
  const [isPending, startTransition] = useTransition();

  const [company, setCompany] = useState(initialCompany);
  const [jurisdictions, setJurisdictions] = useState<string[]>(
    profile?.jurisdictions ?? [],
  );
  const [licenseTypes, setLicenseTypes] = useState<string[]>(
    profile?.licenseTypes ?? [],
  );
  const [budgetMin, setBudgetMin] = useState(
    profile?.budgetMin != null ? String(profile.budgetMin) : "",
  );
  const [budgetMax, setBudgetMax] = useState(
    profile?.budgetMax != null ? String(profile.budgetMax) : "",
  );
  const [description, setDescription] = useState(profile?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  function toggle(
    value: string,
    list: string[],
    setList: (v: string[]) => void,
  ) {
    setList(
      list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await updateBuyerProfile({
        company,
        jurisdictions,
        licenseTypes,
        budgetMin,
        budgetMax,
        description,
      });

      if (!result.ok) {
        setError(result.error ?? t("buyer.profile.saveError"));
        toast({
          title: t("buyer.profile.toastFailedTitle"),
          description:
            result.error ?? t("buyer.profile.toastFailedDescription"),
          variant: "destructive",
        });
        return;
      }

      router.refresh();
      toast({
        title: t("buyer.profile.toastSavedTitle"),
        description: t("buyer.profile.toastSavedDescription"),
      });
    });
  }

  const descriptionTooShort =
    description.trim().length > 0 &&
    description.trim().length < DESCRIPTION_MIN;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-text"
        >
          {error}
        </p>
      )}

      <Card className="bg-surface">
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="company">{t("buyer.profile.company")}</Label>
            <Input
              id="company"
              name="company"
              required
              minLength={2}
              maxLength={120}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Nordic Ventures AB"
            />
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("buyer.profile.jurisdictions")}
            </legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {JURISDICTIONS.map((code) => (
                <label
                  key={code}
                  className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Checkbox
                    checked={jurisdictions.includes(code)}
                    onCheckedChange={() =>
                      toggle(code, jurisdictions, setJurisdictions)
                    }
                  />
                  {code}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("buyer.profile.jurisdictionsHint")}
            </p>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              {t("buyer.profile.licenseTypes")}
            </legend>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {LICENSE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Checkbox
                    checked={licenseTypes.includes(option)}
                    onCheckedChange={() =>
                      toggle(option, licenseTypes, setLicenseTypes)
                    }
                  />
                  {t(LICENSE_KEYS[option])}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="budgetMin">{t("buyer.profile.budgetMin")}</Label>
              <Input
                id="budgetMin"
                name="budgetMin"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="500000"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="budgetMax">{t("buyer.profile.budgetMax")}</Label>
              <Input
                id="budgetMax"
                name="budgetMax"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="3000000"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="description">
                {t("buyer.profile.descriptionLabel")}
              </Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  descriptionTooShort
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {t("buyer.profile.counter", {
                  count: description.trim().length,
                  min: DESCRIPTION_MIN,
                })}
              </span>
            </div>
            <Textarea
              id="description"
              name="description"
              aria-invalid={descriptionTooShort || undefined}
              aria-describedby={
                descriptionTooShort ? "description-error" : undefined
              }
              rows={5}
              required
              minLength={DESCRIPTION_MIN}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("buyer.profile.descriptionPlaceholder")}
            />
            {descriptionTooShort && (
              <p id="description-error" className="text-xs text-destructive">
                {t("buyer.profile.tooShort", { min: DESCRIPTION_MIN })}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? t("buyer.profile.saving") : t("buyer.profile.save")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {t("buyer.profile.hint")}
        </p>
      </div>
    </form>
  );
}
