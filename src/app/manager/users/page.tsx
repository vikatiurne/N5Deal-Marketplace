import type { Metadata } from "next";
import Link from "next/link";

import { ManagerUserFilterBar } from "@/components/manager/ManagerUserFilterBar";
import { ManagerUserRowActions } from "@/components/manager/ManagerUserRowActions";
import { ManagerUserStatusBadge } from "@/components/manager/ManagerUserStatusBadge";
import { Pagination } from "@/components/assets/Pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/guards";
import { listUsers } from "@/lib/db/repositories/users";
import { formatDate } from "@/lib/formatDate";
import { managerUserFiltersSchema } from "@/lib/validation/manager";

export const metadata: Metadata = {
  title: "Members · Manager",
};

const PAGE_SIZE = 20;

export default async function ManagerUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireRole("MANAGER");

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
        <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
        <p className="text-sm text-muted-foreground">
          {total} {total === 1 ? "account" : "accounts"} · suspend or
          soft-delete non-compliant members. Every action is audited.
        </p>
      </div>

      <ManagerUserFilterBar />

      {items.length === 0 ? (
        <Card className="bg-surface">
          <CardContent className="flex flex-col items-start gap-3 pt-6">
            <p className="text-sm text-muted-foreground">
              No members match these filters.
            </p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/manager/users">Reset filters</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-surface">
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Badge variant="outline">{u.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <ManagerUserStatusBadge status={u.status} />
                    </TableCell>
                    <TableCell className="font-medium">{u.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.company ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {formatDate(u.createdAt)}
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
