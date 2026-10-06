import { AssetForm } from "@/components/seller/AssetForm";
import { getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth/guards";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("seller.assets.new") };
}

export default async function NewAssetPage() {
  await requireRole("SELLER");
  const t = await getT();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("seller.assets.new")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("seller.assets.new.subtitle")}
        </p>
      </div>

      <AssetForm />
    </div>
  );
}
