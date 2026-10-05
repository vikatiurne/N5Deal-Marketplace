import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AiInterpretationBanner } from "@/components/assets/AiInterpretationBanner";
import { AssetCard } from "@/components/assets/AssetCard";
import { EmptyState } from "@/components/assets/EmptyState";
import { FilterBar } from "@/components/assets/FilterBar";
import { Pagination } from "@/components/assets/Pagination";
import { SmartSearchBar } from "@/components/assets/SmartSearchBar";
import { listAssets } from "@/lib/db/repositories/assets";
import { assetFiltersSchema } from "@/lib/validation/assets";

export const metadata: Metadata = {
  title: "Browse assets",
  description: "Browse licensed fintech companies for sale.",
};

const PAGE_SIZE = 12;

type RawParams = Record<string, string | string[] | undefined>;

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const raw = await searchParams;

  // Invalid values fall back to defaults — filters never crash the page.
  const parsed = assetFiltersSchema.safeParse(raw);
  const filters = parsed.success
    ? parsed.data
    : { sort: "newest" as const, page: 1 };

  const { items, total } = await listAssets({
    status: "PUBLISHED",
    pageSize: PAGE_SIZE,
    ...filters,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Out-of-range page (e.g. filters narrowed while on page 3): clamp to bounds.
  if (filters.page > totalPages) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(raw)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) params.append(key, v);
      } else {
        params.set(key, value);
      }
    }
    if (totalPages === 1) params.delete("page");
    else params.set("page", String(totalPages));
    const query = params.toString();
    redirect(query ? `/assets?${query}` : "/assets");
  }

  const page = filters.page;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Browse assets</h1>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No published assets"
            : `${total} published ${total === 1 ? "asset" : "assets"}`}
        </p>
      </div>

      <SmartSearchBar />

      <AiInterpretationBanner />

      <FilterBar />

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div
            aria-label="Asset listings"
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {items.map((asset) => (
              <AssetCard key={asset.id} asset={asset} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} searchParams={raw} />
        </>
      )}
    </div>
  );
}
