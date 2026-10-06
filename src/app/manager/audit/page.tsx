import { ScrollText } from "lucide-react";
import Link from "next/link";

import { Pagination } from "@/components/assets/Pagination";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { localizePath } from "@/i18n/config";
import {
  ASSET_STATUS_KEYS,
  USER_STATUS_KEYS,
  type MessageKey,
  type TFunction,
} from "@/i18n/core";
import { getLocale, getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth/guards";
import {
  countAuditEntriesByKind,
  countAuditLogsByAction,
  listAuditLogs,
} from "@/lib/db/repositories/auditLog";
import { formatDateTime } from "@/lib/formatDate";
import { auditFiltersSchema } from "@/lib/validation/manager";
import type {
  AssetStatus,
  AuditAction,
  AuditTargetType,
  UserStatus,
} from "@/types";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("manager.audit.meta.title") };
}

const PAGE_SIZE = 25;

const ACTION_KEYS: Record<AuditAction, MessageKey> = {
  USER_SUSPENDED: "manager.action.userSuspended",
  USER_REACTIVED: "manager.action.userReactivated",
  USER_SOFT_DELETED: "manager.action.userSoftDeleted",
  ASSET_PUBLISHED: "manager.action.assetPublished",
  ASSET_PAUSED: "manager.action.assetPaused",
  ASSET_REMOVED: "manager.action.assetRemoved",
};

const TARGET_KEYS: Record<AuditTargetType, MessageKey> = {
  USER: "manager.audit.targetUser",
  ASSET: "manager.audit.targetAsset",
};

/** Statuses arrive as raw `from`/`to` values in the audit metadata. */
function statusLabel(
  t: TFunction,
  targetType: AuditTargetType,
  value: string,
): string {
  if (targetType === "USER" && value in USER_STATUS_KEYS) {
    return t(USER_STATUS_KEYS[value as UserStatus]);
  }
  if (targetType === "ASSET" && value in ASSET_STATUS_KEYS) {
    return t(ASSET_STATUS_KEYS[value as AssetStatus]);
  }
  return value;
}

/** Server-rendered filter — a GET form keeps this page free of client JS. */
async function AuditFilterForm({
  action,
  targetType,
  pathname,
}: {
  action: string;
  targetType: string;
  pathname: string;
}) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = localizePath(locale, pathname);

  return (
    <form method="get" action={href} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-action">{t("manager.audit.actionLabel")}</Label>
        {/* Native select: this form is a plain GET submit, no client state. */}
        <select
          id="audit-action"
          name="action"
          defaultValue={action}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">{t("manager.audit.allActions")}</option>
          {Object.entries(ACTION_KEYS).map(([value, key]) => (
            <option key={value} value={value}>
              {t(key)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="audit-target">{t("manager.audit.targetLabel")}</Label>
        <select
          id="audit-target"
          name="targetType"
          defaultValue={targetType}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        >
          <option value="">{t("manager.audit.allTargets")}</option>
          {Object.entries(TARGET_KEYS).map(([value, key]) => (
            <option key={value} value={value}>
              {t(key)}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">{t("manager.filters.apply")}</Button>
      {(action || targetType) && (
        <Button type="button" variant="outline" asChild>
          <Link href={href}>{t("manager.filters.reset")}</Link>
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
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);

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
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("manager.audit.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("manager.audit.subtitle", { count: total })}
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
              <dt className="font-medium text-foreground">
                {t("manager.audit.memberActions")}
              </dt>
              <dd className="tabular-nums">{kindCounts.user}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-foreground">
                {t("manager.audit.listingActions")}
              </dt>
              <dd className="tabular-nums">{kindCounts.asset}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {items.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={t("manager.audit.emptyTitle")}
          description={t("manager.audit.emptyDescription")}
        />
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
                        {t(ACTION_KEYS[entry.action])}
                      </span>{" "}
                      <span className="text-muted-foreground">·</span>{" "}
                      <Badge variant="outline" className="mx-1">
                        {t(TARGET_KEYS[entry.targetType])}
                      </Badge>
                      <span className="font-medium">{entry.targetLabel}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("manager.audit.byActor", { email: entry.actorEmail })}
                      {entry.details?.from && entry.details.to ? (
                        <>
                          {" · "}
                          {statusLabel(
                            t,
                            entry.targetType,
                            entry.details.from,
                          )}{" "}
                          → {statusLabel(t, entry.targetType, entry.details.to)}
                        </>
                      ) : null}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums sm:text-right">
                    {formatDateTime(entry.createdAt, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <nav
        aria-label={t("manager.audit.totalsNav")}
        className="flex flex-wrap gap-2"
      >
        {(Object.entries(actionCounts) as [AuditAction, number][]).map(
          ([action, count]) => (
            <Link
              key={action}
              href={href(`/manager/audit?action=${action}`)}
              aria-current={actionFilter === action ? "page" : undefined}
              className={
                actionFilter === action
                  ? "rounded-full border border-primary/50 bg-primary/10 px-3 py-1 text-xs text-primary"
                  : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              }
            >
              {t(ACTION_KEYS[action])}
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
