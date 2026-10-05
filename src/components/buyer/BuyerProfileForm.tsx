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
        setError(result.error ?? "Could not save profile.");
        toast({
          title: "Profile not saved",
          description: result.error ?? "Check the fields and try again.",
          variant: "destructive",
        });
        return;
      }

      router.refresh();
      toast({
        title: "Profile saved",
        description: "Your dashboard now matches assets to these interests.",
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
          className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      )}

      <Card className="bg-surface">
        <CardContent className="flex flex-col gap-6 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="company">Company</Label>
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
              Jurisdictions of interest
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
              Licences in these countries are matched to your dashboard.
            </p>
          </fieldset>

          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">
              License types of interest
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
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="budgetMin">Budget from (EUR)</Label>
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
              <Label htmlFor="budgetMax">Budget up to (EUR)</Label>
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
              <Label htmlFor="description">Acquisition interests</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  descriptionTooShort
                    ? "text-destructive"
                    : "text-muted-foreground",
                )}
              >
                {description.trim().length} / min {DESCRIPTION_MIN}
              </span>
            </div>
            <Textarea
              id="description"
              name="description"
              rows={5}
              required
              minLength={DESCRIPTION_MIN}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Looking for an established EMI in the Baltics with passporting rights across the EEA…"
            />
            {descriptionTooShort && (
              <p className="text-xs text-destructive">
                Add a bit more detail — at least {DESCRIPTION_MIN} characters.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save profile"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Interests drive your matched listings on the dashboard.
        </p>
      </div>
    </form>
  );
}
