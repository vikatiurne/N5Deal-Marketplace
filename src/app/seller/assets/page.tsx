import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

import { AssetRowActions } from "@/components/seller/AssetRowActions";
import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
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
import { requireRole } from "@/lib/auth/guards";
import { listSellerAssets } from "@/lib/db/repositories/assets";
import { formatPrice } from "@/lib/formatPrice";

export const metadata: Metadata = {
  title: "My assets",
};

export default async function SellerAssetsPage() {
  const user = await requireRole("SELLER");

  const assets = await listSellerAssets(user.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">My assets</h1>
          <p className="text-sm text-muted-foreground">
            {assets.length} {assets.length === 1 ? "listing" : "listings"} ·
            only published ones appear on the public marketplace.
          </p>
        </div>
        <Button asChild>
          <Link href="/seller/assets/new">
            <PlusCircle className="size-4" aria-hidden="true" />
            New asset
          </Link>
        </Button>
      </div>

      {assets.length === 0 ? (
        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="text-base">No listings yet</CardTitle>
            <CardDescription>
              Publish your first licensed entity to reach buyers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/seller/assets/new">Create an asset</Link>
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
                  <TableHead>License</TableHead>
                  <TableHead>Jurisdiction</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Inquiries</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => (
                  <TableRow key={asset.id}>
                    <TableCell className="max-w-[16rem] font-medium">
                      <Link
                        href={`/assets/${asset.id}`}
                        className="line-clamp-1 hover:text-primary hover:underline hover:underline-offset-4"
                      >
                        {asset.title}
                      </Link>
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
                    <TableCell className="text-right">
                      <span className="tabular-nums">{asset.inquiryCount}</span>
                      {asset.unreadCount > 0 && (
                        <Badge
                          variant="outline"
                          className="ml-2 border-primary/40 text-primary"
                        >
                          {asset.unreadCount} new
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
