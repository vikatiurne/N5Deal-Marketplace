import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ContactBuyerButton,
  type ContactableAsset,
} from "@/components/seller/ContactBuyerButton";
import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LicenseTypeBadge } from "@/components/assets/LicenseTypeBadge";
import { requireRole } from "@/lib/auth/guards";
import { listAssetsBySeller } from "@/lib/db/repositories/assets";
import { findBuyerProfile } from "@/lib/db/repositories/buyers";
import {
  listIncomingInquiries,
  listSentMessagesBySeller,
} from "@/lib/db/repositories/inquiries";
import { findUserById } from "@/lib/db/repositories/users";
import { formatBudgetRange } from "@/lib/formatPrice";
import { formatDate } from "@/lib/formatDate";

export const metadata: Metadata = {
  title: "Buyer profile",
};

export default async function SellerBuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const seller = await requireRole("SELLER");
  const { id } = await params;

  const buyer = await findUserById(id);
  if (!buyer || buyer.role !== "BUYER" || buyer.status !== "ACTIVE") {
    notFound();
  }

  const [profile, myAssets, askedAbout, sentMessages] = await Promise.all([
    findBuyerProfile(buyer.id),
    listAssetsBySeller(seller.id),
    listIncomingInquiries({ sellerId: seller.id, buyerId: buyer.id }),
    listSentMessagesBySeller(seller.id, buyer.id),
  ]);

  const contactable: ContactableAsset[] = myAssets
    .filter((asset) => asset.status !== "REMOVED")
    .map(({ id: assetId, title, status }) => ({ id: assetId, title, status }));

  const buyerLabel = buyer.company ?? buyer.displayName;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/seller/buyers"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
        >
          ← Back to buyers
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {buyerLabel}
            </h1>
            <p className="text-sm text-muted-foreground">
              {buyer.company ? `${buyer.displayName} · ` : ""}
              Member since {formatDate(buyer.createdAt)}
            </p>
          </div>
          <ContactBuyerButton
            buyerId={buyer.id}
            buyerLabel={buyerLabel}
            assets={contactable}
            sentAssetIds={sentMessages.map((m) => m.assetId)}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="text-base">Interests</CardTitle>
            <CardDescription>
              What this buyer is looking to acquire.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!profile ? (
              <p className="text-sm text-muted-foreground">
                This buyer has not filled in a public profile yet.
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Jurisdictions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.jurisdictions.map((code) => (
                      <Badge
                        key={code}
                        variant="outline"
                        className="font-mono text-muted-foreground"
                      >
                        {code}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    License types
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.licenseTypes.map((license) => (
                      <LicenseTypeBadge key={license} value={license} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Budget
                  </span>
                  <span className="text-sm">
                    {formatBudgetRange(profile.budgetMin, profile.budgetMax)}
                  </span>
                </div>
                {profile.description && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Brief
                    </span>
                    <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                      {profile.description}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="bg-surface">
            <CardHeader>
              <CardTitle className="text-base">
                Inquiries about your assets
              </CardTitle>
              <CardDescription>
                {askedAbout.length === 0
                  ? "This buyer has not inquired about your listings."
                  : `${askedAbout.length} ${askedAbout.length === 1 ? "inquiry" : "inquiries"}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {askedAbout.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="flex flex-col gap-1 border-l-2 border-border pl-3"
                >
                  <span className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <Link
                      href={`/assets/${inquiry.asset.id}`}
                      className="hover:text-primary hover:underline hover:underline-offset-4"
                    >
                      {inquiry.asset.title}
                    </Link>
                    <AssetStatusBadge status={inquiry.asset.status} />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(inquiry.createdAt)}
                  </span>
                  <p className="line-clamp-2 text-sm text-muted-foreground">
                    {inquiry.message}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-surface">
            <CardHeader>
              <CardTitle className="text-base">
                Your messages to this buyer
              </CardTitle>
              <CardDescription>
                Seller → buyer inquiries you already sent.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {sentMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing sent yet.
                </p>
              ) : (
                sentMessages.map((message) => {
                  const asset = myAssets.find((a) => a.id === message.assetId);
                  return (
                    <div
                      key={message.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Badge
                        variant="outline"
                        className="border-primary/40 text-primary"
                      >
                        Sent
                      </Badge>
                      <span className="text-muted-foreground">
                        {asset?.title ?? "Removed listing"} ·{" "}
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
