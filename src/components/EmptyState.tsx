import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * The app's single empty state (task 09).
 *
 * It used to be a hardcoded component with no props, used on exactly one page,
 * while nine other pages hand-rolled their own dashed box — with four different
 * `py-*` values, three different icon choices and two places with no CTA at
 * all. The shape is now fixed here so every empty list looks the same.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
  action,
  className,
}: {
  /** Icon component — pass one of the lucide icons, never a raw node. */
  icon: LucideIcon;
  title: string;
  description: string;
  /** Renders an outlined Link button. Ignored when `action` is given. */
  actionHref?: string;
  actionLabel?: string;
  /** Escape hatch for secondary actions (two buttons in one row). */
  action?: React.ReactNode;
  className?: string;
}) {
  const link =
    actionHref && actionLabel ? (
      <Button variant="outline" asChild>
        <Link href={actionHref}>{actionLabel}</Link>
      </Button>
    ) : null;

  return (
    <div
      className={`flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-surface px-6 py-16 text-center ${className ?? ""}`}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      </div>
      {(link || action) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {link}
          {action}
        </div>
      )}
    </div>
  );
}
