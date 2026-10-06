import Link from "next/link";
import { LicenseTypeBadge } from "@/components/assets/LicenseTypeBadge";

import { BriefcaseBusiness } from "lucide-react";
import { ManagerAssetFilterBar } from "@/components/manager/ManagerAssetFilterBar";
import { EmptyState } from "@/components/EmptyState";
import { ManagerAssetRowActions } from "@/components/manager/ManagerAssetRowActions";
import { ManagerUserStatusBadge } from "@/components/manager/ManagerUserStatusBadge";
import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
import { Pagination } from "@/components/assets/Pagination";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableCaption,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { localizePath } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth/guards";
import { listAssetsForManager } from "@/lib/db/repositories/assets";
import { formatDate } from "@/lib/formatDate";
import { formatPrice } from "@/lib/formatPrice";
import { managerAssetFiltersSchema } from "@/lib/validation/manager";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("manager.assets.meta.title") };
}

const PAGE_SIZE = 20;

export default async function ManagerAssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("MANAGER");
  const [locale, t] = await Promise.all([getLocale(), getT()]);

  const params = await searchParams;
  const parsed = managerAssetFiltersSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : { page: 1 };
  const page = filters.page ?? 1;

  const { items, total } = await listAssetsForManager({
    ...filters,
    pageSize: PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("manager.assets.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("manager.assets.subtitle", { count: total })}
        </p>
      </div>

      <ManagerAssetFilterBar />

      {items.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title={t("manager.assets.emptyTitle")}
          description={t("manager.assets.emptyDescription")}
          actionHref={localizePath(locale, "/manager/assets")}
          actionLabel={t("manager.filters.resetAll")}
        />
      ) : (
        <Card className="bg-surface">
          <CardContent className="pt-6">
            <Table>
              <TableCaption className="text-xs">
                {t("manager.assets.caption")}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("manager.assets.titleColumn")}</TableHead>
                  <TableHead>{t("manager.assets.seller")}</TableHead>
                  <TableHead>{t("manager.assets.license")}</TableHead>
                  <TableHead>{t("manager.assets.jurisdiction")}</TableHead>
                  <TableHead className="text-right">
                    {t("common.price")}
                  </TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("manager.assets.listed")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="max-w-[16rem] font-medium">
                      <Link
                        href={localizePath(locale, `/assets/${asset.id}`)}
                        className="line-clamp-1 hover:text-primary hover:underline hover:underline-offset-4"
                      >
                        {asset.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm">
                          {asset.seller.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {asset.seller.company ?? "—"}
                        </span>
                        {asset.seller.status !== "ACTIVE" && (
                          <ManagerUserStatusBadge
                            status={asset.seller.status}
                          />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <LicenseTypeBadge value={asset.licenseType} />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {asset.jurisdiction}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(asset.price, asset.currency, locale)}
                    </TableCell>
                    <TableCell>
                      <AssetStatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatDate(asset.createdAt, locale)}
                    </TableCell>
                    <TableCell>
                      <ManagerAssetRowActions
                        asset={{
                          id: asset.id,
                          title: asset.title,
                          status: asset.status,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        searchParams={params}
        basePath="/manager/assets"
      />
    </div>
  );
}
