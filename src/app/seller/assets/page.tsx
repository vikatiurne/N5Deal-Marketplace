import Link from "next/link";
import { BriefcaseBusiness, PlusCircle } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { LicenseTypeBadge } from "@/components/assets/LicenseTypeBadge";

import { AssetRowActions } from "@/components/seller/AssetRowActions";
import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { listSellerAssets } from "@/lib/db/repositories/assets";
import { formatPrice } from "@/lib/formatPrice";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("seller.assets.title") };
}

export default async function SellerAssetsPage() {
  const user = await requireRole("SELLER");
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);

  const assets = await listSellerAssets(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("seller.assets.title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("seller.assets.subtitle", { count: assets.length })}
          </p>
        </div>
        <Button asChild>
          <Link href={href("/seller/assets/new")}>
            <PlusCircle className="size-4" aria-hidden="true" />
            {t("seller.assets.new")}
          </Link>
        </Button>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={BriefcaseBusiness}
          title={t("seller.assets.empty.title")}
          description={t("seller.assets.empty.description")}
          action={
            <Button asChild>
              <Link href={href("/seller/assets/new")}>
                {t("seller.assets.empty.action")}
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="bg-surface">
          <CardContent className="pt-6">
            <Table>
              <TableCaption className="text-xs">
                {t("seller.assets.caption")}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("seller.assets.col.title")}</TableHead>
                  <TableHead>{t("seller.assets.col.license")}</TableHead>
                  <TableHead>{t("seller.assets.col.jurisdiction")}</TableHead>
                  <TableHead className="text-right">
                    {t("common.price")}
                  </TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">
                    {t("seller.assets.col.inquiries")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="max-w-[16rem] font-medium">
                      <Link
                        href={href(`/assets/${asset.id}`)}
                        className="line-clamp-1 hover:text-primary hover:underline hover:underline-offset-4"
                      >
                        {asset.title}
                      </Link>
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
                    <TableCell className="text-right">
                      <span className="tabular-nums">{asset.inquiryCount}</span>
                      {asset.unreadCount > 0 && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-primary/40 text-primary"
                        >
                          {t("seller.assets.newBadge", {
                            count: asset.unreadCount,
                          })}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <AssetRowActions asset={asset} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
