import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { AssetForm } from "@/components/seller/AssetForm";
import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { findOwnedAsset } from "@/lib/db/repositories/assets";

export const metadata: Metadata = {
  title: "Edit asset",
};

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("SELLER");
  const { id } = await params;

  // Ownership gate: another seller's id in the URL renders a 404 page,
  // the mutation itself is refused again inside the server action.
  const asset = await findOwnedAsset(id, user.id);
  if (!asset) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/seller/assets"
          className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
        >
          ← Back to my assets
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Edit asset</h1>
          <AssetStatusBadge status={asset.status} />
          {asset.status === "PUBLISHED" && (
            <Link
              href={`/assets/${asset.id}`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
            >
              View public page
              <ExternalLink className="size-3" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      <AssetForm asset={asset} />
    </div>
  );
}
