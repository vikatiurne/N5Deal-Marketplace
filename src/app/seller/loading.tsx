import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

/**
 * Skeleton for `/seller`. Mirrors the real page: heading with a trailing
 * "New asset" button, two stat cards, then the latest-inquiries list.
 */
export default function SellerLoading() {
  return (
    <SkeletonRegion
      label="Loading seller dashboard"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <Card key={i} className="bg-surface">
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-52" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-10 w-20" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-32 rounded-md" />
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i}>
              <Card className="bg-surface">
                <CardContent className="flex flex-col gap-2 pt-6">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </SkeletonRegion>
  );
}
