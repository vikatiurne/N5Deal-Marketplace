import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";

import { AssetStatusBadge } from "@/components/seller/AssetStatusBadge";
import { MarkReadButton } from "@/components/seller/MarkReadButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import {
  countIncomingInquiries,
  listIncomingInquiries,
} from "@/lib/db/repositories/inquiries";
import { formatDateTime } from "@/lib/formatDate";

export const metadata: Metadata = {
  title: "Inbox",
};

export default async function SellerInquiriesPage() {
  const user = await requireRole("SELLER");

  const [inquiries, total] = await Promise.all([
    listIncomingInquiries({ sellerId: user.id }),
    countIncomingInquiries({ sellerId: user.id }),
  ]);

  const unreadTotal = inquiries.filter((i) => i.readAt === null).length;

  // Group by asset, keeping the order of the newest inquiry per asset.
  const groups = inquiries.reduce<
    Array<{
      asset: (typeof inquiries)[number]["asset"];
      items: typeof inquiries;
    }>
  >((acc, inquiry) => {
    const existing = acc.find((g) => g.asset.id === inquiry.asset.id);
    if (existing) existing.items.push(inquiry);
    else acc.push({ asset: inquiry.asset, items: [inquiry] });
    return acc;
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Inquiries inbox
          </h1>
          <p className="text-sm text-muted-foreground">
            {total} received
            {unreadTotal > 0 ? ` · ${unreadTotal} unread` : ""} · grouped by
            listing
          </p>
        </div>
        <MarkReadButton
          inquiryIds={inquiries
            .filter((i) => i.readAt === null)
            .map((i) => i.id)}
        />
      </div>

      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border bg-surface px-6 py-16 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Inbox
              className="size-6 text-muted-foreground"
              aria-hidden="true"
            />
          </span>
          <div className="flex flex-col gap-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Nothing in the inbox
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              When a buyer contacts you about a listing, the request lands here.
            </p>
          </div>
          <Button asChild>
            <Link href="/seller/assets">Review my listings</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => {
            const unreadIds = group.items
              .filter((i) => i.readAt === null)
              .map((i) => i.id);

            return (
              <Card key={group.asset.id} className="bg-surface">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex flex-col gap-1">
                      <CardTitle className="text-base">
                        <Link
                          href={`/assets/${group.asset.id}`}
                          className="hover:text-primary hover:underline hover:underline-offset-4"
                        >
                          {group.asset.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs">
                          {group.asset.licenseType} · {group.asset.jurisdiction}
                        </span>
                        <AssetStatusBadge status={group.asset.status} />
                      </CardDescription>
                    </div>
                    <MarkReadButton inquiryIds={unreadIds} />
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4">
                  {group.items.map((inquiry) => (
                    <article
                      key={inquiry.id}
                      className="flex flex-col gap-2 rounded-md border border-border bg-background/40 p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          {inquiry.buyer.company ?? inquiry.buyer.displayName}
                          <Badge
                            variant="outline"
                            className={
                              inquiry.readAt === null
                                ? "border-primary/40 text-primary"
                                : "text-muted-foreground"
                            }
                          >
                            {inquiry.readAt === null ? "Unread" : "Read"}
                          </Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(inquiry.createdAt)}
                        </span>
                      </div>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                        {inquiry.message}
                      </p>
                      {inquiry.readAt === null && (
                        <MarkReadButton inquiryIds={[inquiry.id]} size="icon" />
                      )}
                    </article>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
