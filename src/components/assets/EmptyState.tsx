import Link from "next/link";
import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <SearchX className="size-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">
          No assets match your filters
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Try widening the price range, removing a license type, or clearing the
          search text.
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/assets">Reset filters</Link>
      </Button>
    </div>
  );
}
