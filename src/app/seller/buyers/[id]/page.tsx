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
import { localizePath } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";
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

export async function generateMetadata() {
  const t = await getT();
  return { title: t("seller.buyer.title") };
}

export default async function SellerBuyerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const seller = await requireRole("SELLER");
  const { id } = await params;
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);

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
          href={href("/seller/buyers")}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
        >
          {t("seller.buyer.back")}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {buyerLabel}
            </h1>
            <p className="text-sm text-muted-foreground">
              {buyer.company ? `${buyer.displayName} · ` : ""}
              {t("seller.buyer.memberSince", {
                date: formatDate(buyer.createdAt, locale),
              })}
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
            <CardTitle className="text-base">
              {t("seller.buyer.interests")}
            </CardTitle>
            <CardDescription>
              {t("seller.buyer.interestsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!profile ? (
              <p className="text-sm text-muted-foreground">
                {t("seller.buyer.noProfile")}
              </p>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("seller.buyer.jurisdictions")}
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
                    {t("seller.buyer.licenseTypes")}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.licenseTypes.map((license) => (
                      <LicenseTypeBadge key={license} value={license} />
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("seller.buyer.budget")}
                  </span>
                  <span className="text-sm">
                    {formatBudgetRange(
                      profile.budgetMin,
                      profile.budgetMax,
                      locale,
                    )}
                  </span>
                </div>
                {profile.description && (
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {t("seller.buyer.brief")}
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
                {t("seller.buyer.askedTitle")}
              </CardTitle>
              <CardDescription>
                {askedAbout.length === 0
                  ? t("seller.buyer.askedNone")
                  : t("seller.buyer.askedCount", { count: askedAbout.length })}
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
                      href={href(`/assets/${inquiry.asset.id}`)}
                      className="hover:text-primary hover:underline hover:underline-offset-4"
                    >
                      {inquiry.asset.title}
                    </Link>
                    <AssetStatusBadge status={inquiry.asset.status} />
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(inquiry.createdAt, locale)}
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
                {t("seller.buyer.sentTitle")}
              </CardTitle>
              <CardDescription>
                {t("seller.buyer.sentDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {sentMessages.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("seller.buyer.sentEmpty")}
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
                        {t("seller.buyer.sentBadge")}
                      </Badge>
                      <span className="text-muted-foreground">
                        {asset?.title ?? t("seller.buyer.removedListing")} ·{" "}
                        {formatDate(message.createdAt, locale)}
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
