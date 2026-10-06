import Link from "next/link";
import { Inbox } from "lucide-react";

import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
import { MarkReadButton } from "@/components/seller/MarkReadButton";
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
import { LICENSE_KEYS } from "@/i18n/core";
import { getLocale, getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth/guards";
import {
  countIncomingInquiries,
  listIncomingInquiries,
} from "@/lib/db/repositories/inquiries";
import { formatDateTime } from "@/lib/formatDate";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("seller.inquiries.meta") };
}

export default async function SellerInquiriesPage() {
  const user = await requireRole("SELLER");
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);

  const [inquiries, total] = await Promise.all([
    listIncomingInquiries({ sellerId: user.id }),
    countIncomingInquiries({ sellerId: user.id }),
  ]);

  const unreadTotal = inquiries.filter((i) => i.readAt === null).length;

  // Group by asset, keeping the order of the newest inquiry per asset.
  const groups = inquiries.reduce<
    Array<{
      asset: (typeof inquiries)[number]["asset"];
      items: typeof inquiries;
    }>
  >((acc, inquiry) => {
    const existing = acc.find((g) => g.asset.id === inquiry.asset.id);
    if (existing) existing.items.push(inquiry);
    else acc.push({ asset: inquiry.asset, items: [inquiry] });
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("seller.inquiries.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("seller.inquiries.received", { count: total })}
            {unreadTotal > 0
              ? ` · ${t("seller.inquiries.unread", { count: unreadTotal })}`
              : ""}{" "}
            · {t("seller.inquiries.grouped")}
          </p>
        </div>
        <MarkReadButton
          inquiryIds={inquiries
            .filter((i) => i.readAt === null)
            .map((i) => i.id)}
        />
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t("seller.inquiries.empty.title")}
          description={t("seller.inquiries.empty.description")}
          action={
            <Button asChild>
              <Link href={href("/seller/assets")}>
                {t("seller.inquiries.empty.action")}
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => {
            const unreadIds = group.items
              .filter((i) => i.readAt === null)
              .map((i) => i.id);

            return (
              <Card key={group.asset.id} className="bg-surface">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-base">
                        <Link
                          href={href(`/assets/${group.asset.id}`)}
                          className="hover:text-primary hover:underline hover:underline-offset-4"
                        >
                          {group.asset.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">
                          {t(LICENSE_KEYS[group.asset.licenseType])} ·{" "}
                          {group.asset.jurisdiction}
                        </span>
                        <AssetStatusBadge status={group.asset.status} />
                      </CardDescription>
                    </div>
                    <MarkReadButton inquiryIds={unreadIds} />
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  {group.items.map((inquiry) => (
                    <article
                      key={inquiry.id}
                      className="flex flex-col gap-2 rounded-md border border-border bg-background/40 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {inquiry.buyer.company ?? inquiry.buyer.displayName}
                          <Badge
                            variant="outline"
                            className={
                              inquiry.readAt === null
                                ? "border-primary/40 text-primary"
                                : "text-muted-foreground"
                            }
                          >
                            {inquiry.readAt === null
                              ? t("seller.inquiry.unread")
                              : t("seller.inquiry.read")}
                          </Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(inquiry.createdAt, locale)}
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                        {inquiry.message}
                      </p>
                      {inquiry.readAt === null && (
                        <MarkReadButton inquiryIds={[inquiry.id]} size="icon" />
                      )}
                    </article>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
