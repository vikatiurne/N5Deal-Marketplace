import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, Send } from "lucide-react";

import { ProfileCompletenessCard } from "@/components/buyer/ProfileCompletenessCard";
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
import {
  buildMatchCriteria,
  computeProfileCompleteness,
  describeCriteria,
} from "@/lib/buyer/matching";
import { requireRole } from "@/lib/auth/guards";
import { listAssets } from "@/lib/db/repositories/assets";
import { findBuyerProfile } from "@/lib/db/repositories/buyers";
import { countInquiriesByBuyer } from "@/lib/db/repositories/inquiries";
import { findUserById } from "@/lib/db/repositories/users";

export const metadata: Metadata = {
  title: "Buyer workspace",
};

const MATCH_LIMIT = 5;

export default async function BuyerHomePage() {
  const user = await requireRole("BUYER");

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
  const criteriaLabels = describeCriteria(criteria);

  const { items: matchedAssets } = await listAssets({
    status: "PUBLISHED",
    sort: "newest",
    pageSize: MATCH_LIMIT,
    ...criteria,
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Buyer workspace
        </h1>
        <p className="text-sm text-muted-foreground">
          {account?.displayName ?? user.email}
          {account?.company ? ` · ${account.company}` : null}
        </p>
      </div>

      <section aria-label="Overview" className="grid gap-4 md:grid-cols-2">
        <ProfileCompletenessCard completeness={completeness} />

        <Card className="flex h-full flex-col bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Inquiries sent</CardTitle>
            <CardDescription>
              Contact requests you sent to sellers.
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
              <Link href="/buyer/inquiries">View inquiries</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section aria-label="Matched assets" className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold tracking-tight">
              Matched for you
            </h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/assets">Browse all assets</Link>
            </Button>
          </div>

          {criteriaLabels.length > 0 ? (
            <p className="text-sm text-muted-foreground">
              Matched on{" "}
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
              Add jurisdictions, license types and a budget to your profile to
              get matched listings here.
            </p>
          )}
        </div>

        {matchedAssets.length === 0 ? (
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-surface px-6 py-14 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted">
              <SearchX
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold">No published assets match yet</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Widen your budget or jurisdictions, or send an inquiry to a
                seller from the marketplace.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/buyer/profile">Adjust interests</Link>
              </Button>
              <Button asChild>
                <Link href="/assets">Browse all assets</Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {matchedAssets.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
        )}

        {profile && (
          <p className="text-xs text-muted-foreground">
            Showing up to {MATCH_LIMIT} of the newest published listings.{" "}
            <Badge variant="outline" className="text-muted-foreground">
              license ∩ jurisdiction ∩ budget
            </Badge>
          </p>
        )}
      </section>
    </div>
  );
}
