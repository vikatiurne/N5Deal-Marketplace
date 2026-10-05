import type { Metadata } from "next";

import { AssetForm } from "@/components/seller/AssetForm";
import { requireRole } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: "New asset",
};

export default async function NewAssetPage() {
  await requireRole("SELLER");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">New asset</h1>
        <p className="text-sm text-muted-foreground">
          Save a draft first and publish when the financials are ready.
        </p>
      </div>

      <AssetForm />
    </div>
  );
}
