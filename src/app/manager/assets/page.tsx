import type { Metadata } from "next";
import Link from "next/link";

import { ManagerAssetFilterBar } from "@/components/manager/ManagerAssetFilterBar";
import { ManagerAssetRowActions } from "@/components/manager/ManagerAssetRowActions";
import { ManagerUserStatusBadge } from "@/components/manager/ManagerUserStatusBadge";
import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
import { Pagination } from "@/components/assets/Pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/guards";
import { listAssetsForManager } from "@/lib/db/repositories/assets";
import { formatDate } from "@/lib/formatDate";
import { formatPrice } from "@/lib/formatPrice";
import { managerAssetFiltersSchema } from "@/lib/validation/manager";

export const metadata: Metadata = {
  title: "Listings · Manager",
};

const PAGE_SIZE = 20;

export default async function ManagerAssetsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("MANAGER");

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
        <h1 className="text-2xl font-semibold tracking-tight">Listings</h1>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "asset" : "assets"} across all sellers ·
          removing a listing hides it from the marketplace without deleting it.
        </p>
      </div>

      <ManagerAssetFilterBar />

      {items.length === 0 ? (
        <Card className="bg-surface">
          <CardContent className="flex flex-col items-start gap-3 pt-6">
            <p className="text-sm text-muted-foreground">
              No listings match these filters.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/manager/assets">Reset filters</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-surface">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Listed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="max-w-[16rem] font-medium">
                      <Link
                        href={`/assets/${asset.id}`}
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
                    <TableCell className="font-mono text-xs">
                      {asset.licenseType}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {asset.jurisdiction}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(asset.price, asset.currency)}
                    </TableCell>
                    <TableCell>
                      <AssetStatusBadge status={asset.status} />
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatDate(asset.createdAt)}
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
