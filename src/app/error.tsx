"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";

/**
 * Route-level error boundary (task 09 §3).
 *
 * `reset()` re-renders the segment without a full reload, which is the right
 * first move for a transient failure; the "Back to listings" link is the
 * escape hatch when the segment is permanently broken. The digest is only
 * rendered in production, where Next.js attaches one for log correlation.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-xl border border-border bg-surface px-6 py-16 text-center"
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle
          className="size-6 text-destructive-text"
          aria-hidden="true"
        />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold tracking-tight">
          Something went wrong
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          This page failed to render. Try again — if it keeps failing, the error
          is in the server log.
        </p>
        {error.digest && (
          <p className="font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Try again
        </button>
        <Link
          href="/assets"
          className="inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Back to listings
        </Link>
      </div>
    </div>
  );
}
