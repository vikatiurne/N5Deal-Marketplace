import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";
import { getT } from "@/i18n/server";

/**
 * Skeleton for `/buyer`. Mirrors the real page: heading, two overview cards,
 * then a "Matched assets" section with the same 3-column grid as `/assets`.
 */
export default async function BuyerLoading() {
  const t = await getT();

  return (
    <SkeletonRegion label={t("buyer.loading")} className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-40" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-surface">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-20 rounded-4xl" />
            </div>
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="flex-1">
            <div className="flex items-center gap-3">
              <Skeleton className="h-2 flex-1 rounded-full" />
              <Skeleton className="h-5 w-10" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-8 w-28 rounded-md" />
          </CardFooter>
        </Card>

        <Card className="bg-surface">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="flex flex-1 items-center gap-3">
            <Skeleton className="size-10 rounded-full" />
            <Skeleton className="h-9 w-12" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-8 w-32 rounded-md" />
          </CardFooter>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div
              key={i}
              className="flex min-h-52 flex-col gap-4 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-5 w-16 rounded-4xl" />
                <Skeleton className="h-5 w-10 rounded-4xl" />
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
      </div>
    </SkeletonRegion>
  );
}
