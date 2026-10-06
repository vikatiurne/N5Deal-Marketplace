import Link from "next/link";
import { Inbox } from "lucide-react";
import { LicenseTypeBadge } from "@/components/assets/LicenseTypeBadge";
import { EmptyState } from "@/components/EmptyState";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { localizePath } from "@/i18n/config";
import { ASSET_STATUS_KEYS } from "@/i18n/core";
import { getLocale, getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth/guards";
import { listInquiriesForBuyer } from "@/lib/db/repositories/inquiries";
import { formatDate } from "@/lib/formatDate";
import { formatPrice } from "@/lib/formatPrice";

export async function generateMetadata() {
  const t = await getT();
  return {
    title: t("buyer.inquiries.meta.title"),
  };
}

export default async function BuyerInquiriesPage() {
  const user = await requireRole("BUYER");
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);

  const inquiries = await listInquiriesForBuyer(user.id);

  if (inquiries.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("buyer.inquiries.title")}
        </h1>
        <EmptyState
          icon={Inbox}
          title={t("buyer.inquiries.empty.title")}
          description={t("buyer.inquiries.empty.description")}
          action={
            <Button asChild>
              <Link href={href("/assets")}>
                {t("buyer.inquiries.empty.browse")}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("buyer.inquiries.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("buyer.inquiries.count", { count: inquiries.length })}
        </p>
      </div>

      <ul className="flex flex-col gap-4">
        {inquiries.map((inquiry) => (
          <li key={inquiry.id}>
            <Card className="bg-surface">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-base">
                      <Link
                        href={href(`/assets/${inquiry.asset.id}`)}
                        className="hover:text-primary hover:underline hover:underline-offset-4"
                      >
                        {inquiry.asset.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {inquiry.seller.displayName}
                      {inquiry.seller.company
                        ? ` · ${inquiry.seller.company}`
                        : null}{" "}
                      ·{" "}
                      {formatPrice(
                        inquiry.asset.price,
                        inquiry.asset.currency,
                        locale,
                      )}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-primary"
                  >
                    {t("buyer.inquiries.sent")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {inquiry.message}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(inquiry.createdAt, locale)}</span>
                  <span aria-hidden="true">·</span>
                  <LicenseTypeBadge value={inquiry.asset.licenseType} />
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">
                    {inquiry.asset.jurisdiction}
                  </span>
                  {inquiry.asset.status !== "PUBLISHED" && (
                    <Badge variant="outline" className="text-muted-foreground">
                      {t("buyer.inquiries.assetStatus", {
                        status: t(ASSET_STATUS_KEYS[inquiry.asset.status]),
                      })}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
