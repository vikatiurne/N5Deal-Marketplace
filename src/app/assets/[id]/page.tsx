import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContactSellerButton } from "@/components/assets/ContactSellerButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/formatPrice";
import { getSession } from "@/lib/auth/guards";
import { findAssetById } from "@/lib/db/repositories/assets";
import { findInquiry } from "@/lib/db/repositories/inquiries";
import { findUserById } from "@/lib/db/repositories/users";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const asset = await findAssetById(id);
  if (!asset || asset.status !== "PUBLISHED") {
    return { title: "Asset not found" };
  }
  return {
    title: asset.title,
    description: `${asset.licenseType} in ${asset.jurisdiction} — ${formatPrice(asset.price, asset.currency)}`,
  };
}

export default async function AssetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = await findAssetById(id);

  // Non-published assets are invisible to the public.
  if (!asset || asset.status !== "PUBLISHED") {
    notFound();
  }

  const session = await getSession();
  const role = session?.status === "ACTIVE" ? session.role : null;
  const isOwner = role === "SELLER" && session?.id === asset.sellerId;

  const seller = await findUserById(asset.sellerId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link
        href="/assets"
        className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
      >
        ← Back to listings
      </Link>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20">
            {asset.licenseType}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {asset.jurisdiction}
          </Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">{asset.title}</h1>
        <p className="text-xl font-semibold text-primary">
          {formatPrice(asset.price, asset.currency)}
        </p>
      </div>

      <Card className="bg-surface">
        <CardHeader>
          <CardTitle className="text-base">About this asset</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {asset.description}
          </CardDescription>
        </CardContent>
      </Card>

      <Card className="bg-surface">
        <CardHeader>
          <CardTitle className="text-base">Seller</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {seller?.displayName ?? "Seller"}
            {seller?.company ? (
              <span className="text-muted-foreground"> · {seller.company}</span>
            ) : null}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        {!role && (
          <Button asChild>
            <Link
              href={`/login?next=${encodeURIComponent(`/assets/${asset.id}`)}`}
            >
              Login to contact seller
            </Link>
          </Button>
        )}
        {role === "BUYER" && session && (
          <ContactSellerButton
            assetId={asset.id}
            assetTitle={asset.title}
            sellerName={seller?.displayName ?? "the seller"}
            alreadySent={Boolean(await findInquiry(asset.id, session.id))}
          />
        )}
        {isOwner && (
          <Button variant="outline" asChild>
            <Link href={`/seller/assets/${asset.id}/edit`}>Edit asset</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
