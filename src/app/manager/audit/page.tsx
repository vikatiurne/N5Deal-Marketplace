import type { Metadata } from "next";
import Link from "next/link";

import { Pagination } from "@/components/assets/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { requireRole } from "@/lib/auth/guards";
import {
  countAuditEntriesByKind,
  countAuditLogsByAction,
  listAuditLogs,
} from "@/lib/db/repositories/auditLog";
import { formatDateTime } from "@/lib/formatDate";
import { auditFiltersSchema } from "@/lib/validation/manager";
import type { AuditAction, AuditTargetType } from "@/types";

export const metadata: Metadata = {
  title: "Audit log · Manager",
};

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<AuditAction, string> = {
  USER_SUSPENDED: "Member suspended",
  USER_REACTIVED: "Member reactivated",
  USER_SOFT_DELETED: "Member soft-deleted",
  ASSET_PUBLISHED: "Listing published",
  ASSET_PAUSED: "Listing paused",
  ASSET_REMOVED: "Listing removed",
};

const TARGET_LABELS: Record<AuditTargetType, string> = {
  USER: "Member",
  ASSET: "Listing",
};

/** Server-rendered filter — a GET form keeps this page free of client JS. */
function AuditFilterForm({
  action,
  targetType,
  pathname,
}: {
  action: string;
  targetType: string;
  pathname: string;
}) {
  return (
    <form
      method="get"
      action={pathname}
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-action">Action</Label>
        {/* Native select: this form is a plain GET submit, no client state. */}
        <select
          id="audit-action"
          name="action"
          defaultValue={action}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All actions</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-target">Target</Label>
        <select
          id="audit-target"
          name="targetType"
          defaultValue={targetType}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">All targets</option>
          {Object.entries(TARGET_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">Apply</Button>
      {(action || targetType) && (
        <Button type="button" variant="outline" asChild>
          <Link href="/manager/audit">Reset</Link>
        </Button>
      )}
    </form>
  );
}

export default async function ManagerAuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("MANAGER");

  const params = await searchParams;
  const parsed = auditFiltersSchema.safeParse(params);
  const filters = parsed.success ? parsed.data : { page: 1 };
  const page = filters.page ?? 1;

  const [{ items, total }, actionCounts, kindCounts] = await Promise.all([
    listAuditLogs({ ...filters, pageSize: PAGE_SIZE }),
    countAuditLogsByAction(),
    countAuditEntriesByKind(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const actionFilter = typeof params.action === "string" ? params.action : "";
  const targetFilter =
    typeof params.targetType === "string" ? params.targetType : "";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          {total} recorded {total === 1 ? "action" : "actions"} · entries are
          append-only and never edited or removed.
        </p>
      </div>

      <Card className="bg-surface">
        <CardContent className="flex flex-col gap-4 pt-6">
          <AuditFilterForm
            action={actionFilter}
            targetType={targetFilter}
            pathname="/manager/audit"
          />
          <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex gap-1.5">
              <dt className="font-medium text-foreground">Member actions</dt>
              <dd className="tabular-nums">{kindCounts.user}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-foreground">Listing actions</dt>
              <dd className="tabular-nums">{kindCounts.asset}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <Card className="bg-surface">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No audit entries yet. Moderate a member or a listing and it will
              show up here immediately.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-surface">
          <CardContent className="pt-6">
            <ul className="flex flex-col divide-y divide-border">
              {items.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">
                        {ACTION_LABELS[entry.action]}
                      </span>{" "}
                      <span className="text-muted-foreground">·</span>{" "}
                      <Badge variant="outline" className="mx-1">
                        {TARGET_LABELS[entry.targetType]}
                      </Badge>
                      <span className="font-medium">{entry.targetLabel}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      by {entry.actorEmail}
                      {entry.details?.from && entry.details.to ? (
                        <>
                          {" · "}
                          {entry.details.from} → {entry.details.to}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums sm:text-right">
                    {formatDateTime(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <nav aria-label="Action totals" className="flex flex-wrap gap-2">
        {(Object.entries(actionCounts) as [AuditAction, number][]).map(
          ([action, count]) => (
            <Link
              key={action}
              href={`/manager/audit?action=${action}`}
              aria-current={actionFilter === action ? "page" : undefined}
              className={
                actionFilter === action
                  ? "rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs text-primary"
                  : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              }
            >
              {ACTION_LABELS[action]}
              <span className="ml-1.5 tabular-nums">{count}</span>
            </Link>
          ),
        )}
      </nav>

      <Pagination
        page={page}
        totalPages={totalPages}
        searchParams={params}
        basePath="/manager/audit"
      />
    </div>
  );
}
