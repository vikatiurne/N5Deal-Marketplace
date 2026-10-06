import { cn } from "cn";

/**
 * Loading placeholder primitive (task 09).
 *
 * Skeletons in this app are built from the *same* box model as the real
 * content — same card, grid and row classes — so the swap from skeleton to data
 * does not move anything. Generic centred spinners did.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/**
 * Wraps a skeleton region with the live-region semantics a spinner would have
 * provided. `aria-hidden` on the bars means only this text reaches a screen
 * reader.
 */
function SkeletonRegion({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={className}
    >
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Matches the page heading block used by every route. */
function SkeletonHeading() {
  return (
    <div className="flex flex-col gap-1">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

/** Badge pill, as rendered by AssetCard / LicenseTypeBadge. */
function SkeletonBadge({ className }: { className?: string }) {
  return <Skeleton className={cn("h-5 w-16 rounded-4xl", className)} />;
}

export { Skeleton, SkeletonRegion, SkeletonHeading, SkeletonBadge };
