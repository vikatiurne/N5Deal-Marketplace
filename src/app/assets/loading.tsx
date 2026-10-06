import { Card, CardContent } from "@/components/ui/card";
import {
  Skeleton,
  SkeletonBadge,
  SkeletonHeading,
  SkeletonRegion,
} from "@/components/ui/skeleton";
import { getT } from "@/i18n/server";

/**
 * Skeleton for `/assets`. Mirrors the real page one-for-one — heading, AI
 * search card, filter card, 3-column card grid at the same page size — so
 * replacing it with data causes no reflow. The previous version drew a single
 * generic `h-40` block for two different cards and fixed the cards at `h-56`,
 * which did not match the real card height at all.
 */
export default async function AssetsLoading() {
  const t = await getT();
  return (
    <SkeletonRegion label={t("assets.loading")} className="flex flex-col gap-6">
      <SkeletonHeading />

      {/* SmartSearchBar: label row, input + button row, hint line. */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-56" />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Skeleton className="h-9 w-full sm:flex-1" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
            <Skeleton className="h-3 w-72" />
          </div>
        </CardContent>
      </Card>

      {/* FilterBar: three fields plus a sort select. */}
      <Card className="bg-surface">
        <CardContent className="flex flex-col gap-4 pt-6">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto_auto]">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-9 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AssetCard grid — real card is flex-col with a description that
          clamps to two lines and a pinned footer. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex min-h-52 flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <SkeletonBadge />
              <SkeletonBadge className="w-10" />
            </div>
            <Skeleton className="h-6 w-3/4" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
            </div>
            <div className="mt-auto flex items-center justify-between gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonRegion>
  );
}
