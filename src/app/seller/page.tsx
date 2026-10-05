import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Inbox, PlusCircle } from "lucide-react";

import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
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
import { requireRole } from "@/lib/auth/guards";
import { countAssetsByStatus } from "@/lib/db/repositories/assets";
import {
  countIncomingInquiries,
  listIncomingInquiries,
} from "@/lib/db/repositories/inquiries";
import { findUserById } from "@/lib/db/repositories/users";
import { formatDateTime } from "@/lib/formatDate";
import type { AssetStatus } from "@/types";

export const metadata: Metadata = {
  title: "Seller workspace",
};

const LATEST_INQUIRIES = 5;

export default async function SellerHomePage() {
  const user = await requireRole("SELLER");

  const [account, statusCounts, totalInquiries, latest] = await Promise.all([
    findUserById(user.id),
    countAssetsByStatus(user.id),
    countIncomingInquiries({ sellerId: user.id }),
    listIncomingInquiries({ sellerId: user.id, limit: LATEST_INQUIRIES }),
  ]);

  const unreadCount = latest.filter((i) => i.readAt === null).length;
  const statuses: AssetStatus[] = ["PUBLISHED", "DRAFT", "PAUSED", "REMOVED"];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Seller workspace
          </h1>
          <p className="text-sm text-muted-foreground">
            {account?.displayName ?? user.email}
            {account?.company ? ` · ${account.company}` : null}
          </p>
        </div>
        <Button asChild>
          <Link href="/seller/assets/new">
            <PlusCircle className="size-4" aria-hidden="true" />
            New asset
          </Link>
        </Button>
      </div>

      <section
        aria-label="Listings by status"
        className="grid gap-4 sm:grid-cols-2"
      >
        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BriefcaseBusiness
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Listings
            </CardTitle>
            <CardDescription>
              Your assets by publication status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col gap-2">
              {statuses.map((status) => (
                <li
                  key={status}
                  className="flex items-center justify-between gap-2 rounded-md border border-border bg-muted/40 px-3 py-2"
                >
                  <AssetStatusBadge status={status} />
                  <span className="text-sm font-semibold tabular-nums">
                    {statusCounts[status]}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href="/seller/assets">Manage assets</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Inbox
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              Inquiries received
            </CardTitle>
            <CardDescription>
              Buyer contact requests across all your listings.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-end gap-3">
            <span className="text-4xl font-semibold tabular-nums">
              {totalInquiries}
            </span>
            {unreadCount > 0 && (
              <span className="pb-1 text-sm text-muted-foreground">
                {unreadCount} unread in latest {LATEST_INQUIRIES}
              </span>
            )}
          </CardContent>
          <CardFooter>
            <Button variant="outline" size="sm" asChild>
              <Link href="/seller/inquiries">Open inbox</Link>
            </Button>
          </CardFooter>
        </Card>
      </section>

      <section aria-label="Latest inquiries" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            Latest inquiries
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/seller/inquiries">View all</Link>
          </Button>
        </div>

        {latest.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No inquiries yet. Publish a listing and buyers will find it.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {latest.map((inquiry) => (
              <li key={inquiry.id}>
                <Card className="bg-surface">
                  <CardContent className="flex flex-col gap-2 pt-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-medium">
                        {inquiry.buyer.company ?? inquiry.buyer.displayName}
                        <span className="font-normal text-muted-foreground">
                          {" · "}
                          <Link
                            href={`/assets/${inquiry.asset.id}`}
                            className="hover:text-foreground hover:underline hover:underline-offset-4"
                          >
                            {inquiry.asset.title}
                          </Link>
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(inquiry.createdAt)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {inquiry.message}
                    </p>
                    {inquiry.readAt === null && (
                      <Badge
                        variant="outline"
                        className="w-fit border-primary/40 text-primary"
                      >
                        Unread
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
