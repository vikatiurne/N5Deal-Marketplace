import Link from "next/link";
import { BriefcaseBusiness, Inbox, PlusCircle } from "lucide-react";

import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
import { EmptyState } from "@/components/EmptyState";
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
import { localizePath } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth/guards";
import { countAssetsByStatus } from "@/lib/db/repositories/assets";
import {
  countIncomingInquiries,
  listIncomingInquiries,
} from "@/lib/db/repositories/inquiries";
import { findUserById } from "@/lib/db/repositories/users";
import { formatDateTime } from "@/lib/formatDate";
import type { AssetStatus } from "@/types";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("seller.dashboard.title") };
}

const LATEST_INQUIRIES = 5;

export default async function SellerHomePage() {
  const user = await requireRole("SELLER");
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);

  const [account, statusCounts, totalInquiries, latest] = await Promise.all([
    findUserById(user.id),
    countAssetsByStatus(user.id),
    countIncomingInquiries({ sellerId: user.id }),
    listIncomingInquiries({ sellerId: user.id, limit: LATEST_INQUIRIES }),
  ]);

  const unreadCount = latest.filter((i) => i.readAt === null).length;
  const statuses: AssetStatus[] = ["PUBLISHED", "DRAFT", "PAUSED", "REMOVED"];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("seller.dashboard.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {account?.displayName ?? user.email}
            {account?.company ? ` · ${account.company}` : null}
          </p>
        </div>
        <Button asChild>
          <Link href={href("/seller/assets/new")}>
            <PlusCircle className="size-4" aria-hidden="true" />
            {t("seller.assets.new")}
          </Link>
        </Button>
      </div>

      <section
        aria-label={t("seller.dashboard.byStatusAria")}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Card className="flex h-full flex-col bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BriefcaseBusiness
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              {t("seller.dashboard.listingsTitle")}
            </CardTitle>
            <CardDescription>
              {t("seller.dashboard.listingsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <ul className="flex flex-col gap-2">
              {statuses.map((status) => (
                <li
                  key={status}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2"
                >
                  <AssetStatusBadge status={status} />
                  <span className="text-sm font-semibold tabular-nums">
                    {statusCounts[status]}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href={href("/seller/assets")}>
                {t("seller.dashboard.manageAssets")}
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="flex h-full flex-col bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              {t("seller.dashboard.inquiriesTitle")}
            </CardTitle>
            <CardDescription>
              {t("seller.dashboard.inquiriesDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-1 items-end gap-3">
            <span className="text-4xl font-semibold tabular-nums">
              {totalInquiries}
            </span>
            {unreadCount > 0 && (
              <span className="pb-1 text-sm text-muted-foreground">
                {t("seller.dashboard.unreadInLatest", {
                  count: unreadCount,
                  total: LATEST_INQUIRIES,
                })}
              </span>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href={href("/seller/inquiries")}>
                {t("seller.dashboard.openInbox")}
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section
        aria-label={t("seller.dashboard.latestTitle")}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {t("seller.dashboard.latestTitle")}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={href("/seller/inquiries")}>
              {t("seller.dashboard.viewAll")}
            </Link>
          </Button>
        </div>

        {latest.length === 0 ? (
          <EmptyState
            className="py-12"
            icon={Inbox}
            title={t("seller.dashboard.empty.title")}
            description={t("seller.dashboard.empty.description")}
            actionHref={href("/seller/assets/new")}
            actionLabel={t("seller.dashboard.empty.action")}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {latest.map((inquiry) => (
              <li key={inquiry.id}>
                <Card className="bg-surface">
                  <CardContent className="flex flex-col gap-2 pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {inquiry.buyer.company ?? inquiry.buyer.displayName}
                        <span className="font-normal text-muted-foreground">
                          {" · "}
                          <Link
                            href={href(`/assets/${inquiry.asset.id}`)}
                            className="hover:text-foreground hover:underline hover:underline-offset-4"
                          >
                            {inquiry.asset.title}
                          </Link>
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(inquiry.createdAt, locale)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {inquiry.message}
                    </p>
                    {inquiry.readAt === null && (
                      <Badge
                        variant="outline"
                        className="w-fit border-primary/40 text-primary"
                      >
                        {t("seller.inquiry.unread")}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
