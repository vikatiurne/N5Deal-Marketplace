import Link from "next/link";
import { SearchX, Send } from "lucide-react";

import { ProfileCompletenessCard } from "@/components/buyer/ProfileCompletenessCard";
import { EmptyState } from "@/components/EmptyState";
import { AssetCard } from "@/components/assets/AssetCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { intlLocale, localizePath, type Locale } from "@/i18n/config";
import { LICENSE_KEYS, type TFunction } from "@/i18n/core";
import { getLocale, getT } from "@/i18n/server";
import {
  buildMatchCriteria,
  computeProfileCompleteness,
  type MatchCriteria,
} from "@/lib/buyer/matching";
import { requireRole } from "@/lib/auth/guards";
import { listAssets } from "@/lib/db/repositories/assets";
import { findBuyerProfile } from "@/lib/db/repositories/buyers";
import { countInquiriesByBuyer } from "@/lib/db/repositories/inquiries";
import { findUserById } from "@/lib/db/repositories/users";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("buyer.dashboard.meta.title"),
  };
}

const MATCH_LIMIT = 5;

function describeMatchedCriteria(
  t: TFunction,
  criteria: MatchCriteria,
  locale: Locale,
): string[] {
  const parts: string[] = [];
  if (criteria.jurisdiction?.length) {
    parts.push(
      t("buyer.criteria.jurisdiction", {
        codes: criteria.jurisdiction.join(", "),
      }),
    );
  }
  if (criteria.licenseType?.length) {
    parts.push(
      t("buyer.criteria.license", {
        types: criteria.licenseType
          .map((license) => t(LICENSE_KEYS[license]))
          .join(", "),
      }),
    );
  }
  if (criteria.priceMin != null) {
    parts.push(
      t("buyer.criteria.from", {
        amount: criteria.priceMin.toLocaleString(intlLocale(locale)),
      }),
    );
  }
  if (criteria.priceMax != null) {
    parts.push(
      t("buyer.criteria.upTo", {
        amount: criteria.priceMax.toLocaleString(intlLocale(locale)),
      }),
    );
  }
  return parts;
}

export default async function BuyerHomePage() {
  const user = await requireRole("BUYER");
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);

  const [account, profile, inquiryCount] = await Promise.all([
    findUserById(user.id),
    findBuyerProfile(user.id),
    countInquiriesByBuyer(user.id),
  ]);

  const completeness = computeProfileCompleteness({
    company: account?.company ?? null,
    profile,
  });

  const criteria = buildMatchCriteria(profile);
  const criteriaLabels = describeMatchedCriteria(t, criteria, locale);

  const { items: matchedAssets } = await listAssets({
    status: "PUBLISHED",
    sellerStatus: "ACTIVE",
    sort: "newest",
    pageSize: MATCH_LIMIT,
    ...criteria,
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("buyer.dashboard.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {account?.displayName ?? user.email}
          {account?.company ? ` · ${account.company}` : null}
        </p>
      </div>

      <section
        aria-label={t("buyer.dashboard.overviewLabel")}
        className="grid gap-4 md:grid-cols-2"
      >
        <ProfileCompletenessCard completeness={completeness} />

        <Card className="flex h-full flex-col bg-surface">
          <CardHeader>
            <CardTitle className="text-base">
              {t("buyer.dashboard.inquiries.title")}
            </CardTitle>
            <CardDescription>
              {t("buyer.dashboard.inquiries.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Send className="size-5" aria-hidden="true" />
            </span>
            <span className="text-3xl font-semibold tabular-nums">
              {inquiryCount}
            </span>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href={href("/buyer/inquiries")}>
                {t("buyer.dashboard.inquiries.view")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section
        aria-label={t("buyer.dashboard.matchedLabel")}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {t("buyer.dashboard.matched.title")}
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href={href("/assets")}>
                {t("buyer.dashboard.matched.browse")}
              </Link>
            </Button>
          </div>

          {criteriaLabels.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("buyer.dashboard.matchedOn")}{" "}
              {criteriaLabels.map((label, index) => (
                <span key={label}>
                  {index > 0 ? ", " : ""}
                  <span className="text-foreground">{label}</span>
                </span>
              ))}
              .
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("buyer.dashboard.matched.hint")}
            </p>
          )}
        </div>

        {matchedAssets.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title={t("buyer.dashboard.empty.title")}
            description={t("buyer.dashboard.empty.description")}
            action={
              <>
                <Button variant="outline" asChild>
                  <Link href={href("/buyer/profile")}>
                    {t("buyer.dashboard.empty.adjust")}
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={href("/assets")}>
                    {t("buyer.dashboard.empty.browse")}
                  </Link>
                </Button>
              </>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {matchedAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}

        {profile && (
          <p className="text-xs text-muted-foreground">
            {t("buyer.dashboard.showing", { limit: MATCH_LIMIT })}{" "}
            <Badge variant="outline" className="text-muted-foreground">
              {t("buyer.dashboard.formula")}
            </Badge>
          </p>
        )}
      </section>
    </div>
  );
}
