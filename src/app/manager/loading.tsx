import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

/**
 * Skeleton for `/manager`. Mirrors the real page: heading, four stat cards,
 * then the platform breakdown table and the two recent-activity lists.
 */
export default function ManagerLoading() {
  return (
    <SkeletonRegion
      label="Loading platform overview"
      className="flex flex-col gap-8"
    >
      <div className="flex flex-col gap-1">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Card key={i} className="bg-surface">
            <CardHeader>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-9 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-surface">
        <CardContent className="pt-6">
          <Skeleton className="mb-4 h-6 w-48" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-9 w-full" />
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i} className="bg-surface">
            <CardContent className="flex flex-col divide-y divide-border pt-6">
              {Array.from({ length: 4 }, (_, j) => (
                <div key={j} className="flex flex-col gap-1.5 py-3">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="h-3 w-3/5" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </SkeletonRegion>
  );
}
