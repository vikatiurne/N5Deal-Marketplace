import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProfileCompleteness } from "@/lib/buyer/matching";

export function ProfileCompletenessCard({
  completeness,
}: {
  completeness: ProfileCompleteness;
}) {
  const complete = completeness.percent === 100;

  return (
    <Card className="flex h-full flex-col bg-surface">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          Profile completeness
          <Badge
            variant="outline"
            className={
              complete
                ? "border-primary/40 text-primary"
                : "border-warning/40 bg-warning/10 text-warning"
            }
          >
            {complete ? "Complete" : "Incomplete"}
          </Badge>
        </CardTitle>
        <CardDescription>
          {complete
            ? "Sellers can find you in the buyer directory."
            : "A complete profile gets you matched with relevant listings."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuenow={completeness.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile completeness"
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${completeness.percent}%` }}
            />
          </div>
          <span className="text-sm font-semibold tabular-nums text-primary">
            {completeness.percent}%
          </span>
        </div>

        {completeness.missing.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Missing: {completeness.missing.join(", ")}.
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <Link href="/buyer/profile">Edit profile</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
