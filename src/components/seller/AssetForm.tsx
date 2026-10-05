"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createAsset, updateAssetDetails } from "@/server/seller";
import { JURISDICTIONS, LicenseType, type Asset } from "@/types";

const DESCRIPTION_MIN = 40;
const CURRENCIES = ["EUR", "USD", "GBP"] as const;

const LICENSE_OPTIONS = Object.values(LicenseType);

interface AssetFormProps {
  /** Present → edit mode, absent → create mode. */
  asset?: Asset;
}

/** Shared by /seller/assets/new and /seller/assets/[id]/edit. */
export function AssetForm({ asset }: AssetFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(asset?.title ?? "");
  const [licenseType, setLicenseType] = useState<string>(
    asset?.licenseType ?? "EMI",
  );
  const [jurisdiction, setJurisdiction] = useState<string>(
    asset?.jurisdiction ?? "LT",
  );
  const [price, setPrice] = useState(
    asset?.price != null ? String(asset.price) : "",
  );
  const [currency, setCurrency] = useState(asset?.currency ?? "EUR");
  const [description, setDescription] = useState(asset?.description ?? "");
  const [error, setError] = useState<string | null>(null);

  const descriptionTooShort =
    description.trim().length > 0 &&
    description.trim().length < DESCRIPTION_MIN;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const intent = String(
      new FormData(e.currentTarget).get("intent") ?? "draft",
    );
    const payload = {
      title,
      licenseType,
      jurisdiction,
      price,
      currency,
      description,
    };

    startTransition(async () => {
      const result = asset
        ? await updateAssetDetails({ id: asset.id, intent, ...payload })
        : await createAsset({ intent, ...payload });

      if (!result.ok) {
        setError(result.error ?? "Could not save the listing.");
        toast({
          title: "Not saved",
          description: result.error ?? "Check the fields and try again.",
          variant: "destructive",
        });
        return;
      }

      if (result.redirectTo) {
        router.push(result.redirectTo);
        router.refresh();
        return;
      }

      router.refresh();
      toast({
        title: intent === "publish" ? "Listing published" : "Listing saved",
        description:
          intent === "publish"
            ? "It is now visible on the public marketplace."
            : "Saved as a draft — not visible publicly.",
      });
    });
  }

  const isPublished = asset?.status === "PUBLISHED";
  const draftLabel = isPublished ? "Save & unpublish" : "Save as draft";

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
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
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              minLength={5}
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nordic Pay EMI"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label id="license-label">License type</Label>
              <Select value={licenseType} onValueChange={setLicenseType}>
                <SelectTrigger aria-labelledby="license-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label id="jurisdiction-label">Jurisdiction</Label>
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger aria-labelledby="jurisdiction-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
            <div className="flex flex-col gap-2">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Leave empty for price on request"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label id="currency-label">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger aria-labelledby="currency-label">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="description">Description</Label>
              <span
                className={`text-xs tabular-nums ${
                  descriptionTooShort
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {description.trim().length} / min {DESCRIPTION_MIN}
              </span>
            </div>
            <Textarea
              id="description"
              name="description"
              rows={6}
              required
              minLength={DESCRIPTION_MIN}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Licensed electronic money institution with 40k active accounts, full EEA passporting, profitable since 2021…"
            />
            {descriptionTooShort && (
              <p className="text-xs text-destructive">
                Describe the licence, traction and financials — at least{" "}
                {DESCRIPTION_MIN} characters.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          name="intent"
          value="publish"
          disabled={isPending}
        >
          {isPending ? "Saving…" : asset ? "Save & publish" : "Publish"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          disabled={isPending}
        >
          {draftLabel}
        </Button>
        <p className="text-xs text-muted-foreground">
          {isPublished
            ? "This listing is live on /assets — unpublishing removes it there."
            : "Drafts stay private to you until you publish."}
        </p>
      </div>
    </form>
  );
}
