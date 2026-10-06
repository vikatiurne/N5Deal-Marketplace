import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { AssetForm } from "@/components/seller/AssetForm";
import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
import { localizePath } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth/guards";
import { findOwnedAsset } from "@/lib/db/repositories/assets";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("seller.assets.edit.title") };
}

export default async function EditAssetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("SELLER");
  const { id } = await params;
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);

  // Ownership gate: another seller's id in the URL renders a 404 page,
  // the mutation itself is refused again inside the server action.
  const asset = await findOwnedAsset(id, user.id);
  if (!asset) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href={href("/seller/assets")}
          className="text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
        >
          {t("seller.assets.edit.back")}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("seller.assets.edit.title")}
          </h1>
          <AssetStatusBadge status={asset.status} />
          {asset.status === "PUBLISHED" && (
            <Link
              href={href(`/assets/${asset.id}`)}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
            >
              {t("seller.assets.edit.viewPublic")}
              <ExternalLink className="size-3" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      <AssetForm asset={asset} />
    </div>
  );
}
