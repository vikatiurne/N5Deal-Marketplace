import { ManagerUserFilterBar } from "@/components/manager/ManagerUserFilterBar";
import { EmptyState } from "@/components/EmptyState";
import { Users } from "lucide-react";
import { ROLE_STYLES } from "@/lib/badgeStyles";
import { ManagerUserRowActions } from "@/components/manager/ManagerUserRowActions";
import { ManagerUserStatusBadge } from "@/components/manager/ManagerUserStatusBadge";
import { Pagination } from "@/components/assets/Pagination";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableCaption,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { localizePath } from "@/i18n/config";
import { ROLE_KEYS } from "@/i18n/core";
import { getLocale, getT } from "@/i18n/server";
import { requireRole } from "@/lib/auth/guards";
import { listUsers } from "@/lib/db/repositories/users";
import { formatDate } from "@/lib/formatDate";
import { managerUserFiltersSchema } from "@/lib/validation/manager";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("manager.users.meta.title") };
}

const PAGE_SIZE = 20;

export default async function ManagerUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("MANAGER");
  const [locale, t] = await Promise.all([getLocale(), getT()]);

  const params = await searchParams;
  const parsed = managerUserFiltersSchema.safeParse(params);
  // Bad query values fall back to an unfiltered first page instead of 500.
  const filters = parsed.success ? parsed.data : { page: 1 };
  const page = filters.page ?? 1;

  const { items, total } = await listUsers({ ...filters, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("manager.users.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("manager.users.subtitle", { count: total })}
        </p>
      </div>

      <ManagerUserFilterBar />

      {items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("manager.users.emptyTitle")}
          description={t("manager.users.emptyDescription")}
          actionHref={localizePath(locale, "/manager/users")}
          actionLabel={t("manager.filters.resetAll")}
        />
      ) : (
        <Card className="bg-surface">
          <CardContent className="pt-6">
            <Table>
              <TableCaption className="text-xs">
                {t("manager.users.caption")}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.role")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.email")}</TableHead>
                  <TableHead>{t("manager.users.company")}</TableHead>
                  <TableHead className="text-right">
                    {t("manager.users.joined")}
                  </TableHead>
                  <TableHead className="text-right">
                    {t("common.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Badge variant="outline" className={ROLE_STYLES[u.role]}>
                        {t(ROLE_KEYS[u.role])}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ManagerUserStatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.company ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatDate(u.createdAt, locale)}
                    </TableCell>
                    <TableCell>
                      <ManagerUserRowActions
                        user={{
                          id: u.id,
                          email: u.email,
                          displayName: u.displayName,
                          role: u.role,
                          status: u.status,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        searchParams={params}
        basePath="/manager/users"
      />
    </div>
  );
}
