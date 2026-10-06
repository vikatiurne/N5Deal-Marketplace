import Link from "next/link";
import { ROLE_STYLES } from "@/lib/badgeStyles";
import {
  ArrowRight,
  BriefcaseBusiness,
  Inbox,
  UserPlus,
  Users,
} from "lucide-react";

import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
import { ManagerUserStatusBadge } from "@/components/manager/ManagerUserStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { localizePath } from "@/i18n/config";
import { LICENSE_KEYS, ROLE_KEYS, USER_STATUS_KEYS } from "@/i18n/core";
import { getLocale, getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth/guards";
import {
  countAssetsByStatus,
  listRecentAssetsForManager,
} from "@/lib/db/repositories/assets";
import { countAllInquiries } from "@/lib/db/repositories/inquiries";
import {
  countUsersByRoleAndStatus,
  listRecentUsers,
} from "@/lib/db/repositories/users";
import { formatDateTime } from "@/lib/formatDate";
import { formatPrice } from "@/lib/formatPrice";
import type { AssetStatus, Role, UserStatus } from "@/types";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("manager.home.meta.title") };
}

const RECENT = 5;
const ROLES: Role[] = ["BUYER", "SELLER", "MANAGER"];
const USER_STATUSES: UserStatus[] = ["ACTIVE", "SUSPENDED", "DELETED"];
const ASSET_STATUSES: AssetStatus[] = [
  "PUBLISHED",
  "DRAFT",
  "PAUSED",
  "REMOVED",
];

export default async function ManagerHomePage() {
  const user = await requireRole("MANAGER");
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);

  const [userCounts, assetCounts, inquiryCounts, recentUsers, recentAssets] =
    await Promise.all([
      countUsersByRoleAndStatus(),
      countAssetsByStatus(),
      countAllInquiries(),
      listRecentUsers(RECENT),
      listRecentAssetsForManager(RECENT),
    ]);

  const userTotal = ROLES.reduce(
    (sum, role) =>
      sum +
      USER_STATUSES.reduce((s, status) => s + userCounts[role][status], 0),
    0,
  );
  const assetTotal = ASSET_STATUSES.reduce(
    (sum, status) => sum + assetCounts[status],
    0,
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("manager.home.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("manager.home.subtitle", { email: user.email })}
        </p>
      </div>

      {/* Headline numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-surface">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Users className="size-4" aria-hidden="true" />
              {t("manager.home.membersCard")}
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">{userTotal}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("manager.home.membersCardNote", {
              sellers: userCounts.SELLER.ACTIVE,
              buyers: userCounts.BUYER.ACTIVE,
            })}
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <BriefcaseBusiness className="size-4" aria-hidden="true" />
              {t("manager.home.listingsCard")}
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {assetTotal}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("manager.home.listingsCardNote", {
              published: assetCounts.PUBLISHED,
              draft: assetCounts.DRAFT,
              paused: assetCounts.PAUSED,
              removed: assetCounts.REMOVED,
            })}
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Inbox className="size-4" aria-hidden="true" />
              {t("manager.home.inquiriesCard")}
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {inquiryCounts.total}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("manager.home.inquiriesCardNote", {
              fromBuyers: inquiryCounts.fromBuyers,
              fromSellers: inquiryCounts.fromSellers,
            })}
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <UserPlus className="size-4" aria-hidden="true" />
              {t("manager.home.attentionCard")}
            </CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {userCounts.SELLER.SUSPENDED +
                userCounts.BUYER.SUSPENDED +
                userCounts.SELLER.DELETED +
                userCounts.BUYER.DELETED}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {t("manager.home.attentionCardNote")}
          </CardContent>
        </Card>
      </div>

      {/* Users by role x status */}
      <Card className="bg-surface">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">
                {t("manager.home.matrixTitle")}
              </CardTitle>
              <CardDescription>
                {t("manager.home.matrixDescription")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={href("/manager/users")}>
                {t("manager.home.manageMembers")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.role")}</TableHead>
                {USER_STATUSES.map((status) => (
                  <TableHead key={status} className="text-right">
                    {t(USER_STATUS_KEYS[status])}
                  </TableHead>
                ))}
                <TableHead className="text-right">
                  {t("manager.home.total")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROLES.map((role) => (
                <TableRow key={role}>
                  <TableCell className="font-medium">
                    {t(ROLE_KEYS[role])}
                  </TableCell>
                  {USER_STATUSES.map((status) => (
                    <TableCell key={status} className="text-right">
                      {userCounts[role][status] > 0 ? (
                        <Link
                          href={href(
                            `/manager/users?role=${role}&status=${status}`,
                          )}
                          className="tabular-nums hover:text-primary hover:underline hover:underline-offset-4"
                        >
                          {userCounts[role][status]}
                        </Link>
                      ) : (
                        <span className="tabular-nums text-muted-foreground">
                          {userCounts[role][status]}
                        </span>
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium tabular-nums">
                    {USER_STATUSES.reduce(
                      (sum, status) => sum + userCounts[role][status],
                      0,
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Listings by status */}
      <Card className="bg-surface">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-base">
                {t("manager.home.assetMatrixTitle")}
              </CardTitle>
              <CardDescription>
                {t("manager.home.assetMatrixDescription")}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={href("/manager/assets")}>
                {t("manager.home.manageListings")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {ASSET_STATUSES.map((status) => (
            <Link
              key={status}
              href={href(`/manager/assets?status=${status}`)}
              className="rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent"
            >
              <AssetStatusBadge status={status} />
              <p className="mt-2 text-2xl font-semibold tabular-nums">
                {assetCounts[status]}
              </p>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Recent activity */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="text-base">
              {t("manager.home.recentMembersTitle")}
            </CardTitle>
            <CardDescription>
              {t("manager.home.recentMembersDescription", { limit: RECENT })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {u.displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {u.email}
                      {u.company ? ` · ${u.company}` : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={ROLE_STYLES[u.role]}>
                      {t(ROLE_KEYS[u.role])}
                    </Badge>
                    <ManagerUserStatusBadge status={u.status} />
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {formatDateTime(u.createdAt, locale)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="text-base">
              {t("manager.home.recentListingsTitle")}
            </CardTitle>
            <CardDescription>
              {t("manager.home.recentListingsDescription", { limit: RECENT })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-border">
              {recentAssets.map((asset) => (
                <li
                  key={asset.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                >
                  <div className="min-w-0">
                    <Link
                      href={href(
                        `/manager/assets?q=${encodeURIComponent(asset.title)}`,
                      )}
                      className="line-clamp-1 text-sm font-medium hover:text-primary hover:underline hover:underline-offset-4"
                    >
                      {asset.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {asset.seller.displayName} ·{" "}
                      {t(LICENSE_KEYS[asset.licenseType])} ·{" "}
                      {formatPrice(asset.price, asset.currency, locale)}
                    </p>
                  </div>
                  <AssetStatusBadge status={asset.status} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        {t("manager.home.inquiriesFooter", {
          total: inquiryCounts.total,
          unread: inquiryCounts.unread,
        })}
      </p>
    </div>
  );
}
