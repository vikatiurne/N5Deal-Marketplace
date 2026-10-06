import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { LicenseTypeBadge } from "@/components/assets/LicenseTypeBadge";
import { EmptyState } from "@/components/EmptyState";

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
import { listInquiriesForBuyer } from "@/lib/db/repositories/inquiries";
import { formatPrice } from "@/lib/formatPrice";

export const metadata: Metadata = {
  title: "My inquiries",
};

const DATE_FORMAT = new Intl.DateTimeFormat("en-IE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export default async function BuyerInquiriesPage() {
  const user = await requireRole("BUYER");

  const inquiries = await listInquiriesForBuyer(user.id);

  if (inquiries.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">My inquiries</h1>
        <EmptyState
          icon={Inbox}
          title="No inquiries yet"
          description="Open a listing and send the seller a message — it will appear here with its status."
          action={
            <Button asChild>
              <Link href="/assets">Browse assets</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">My inquiries</h1>
        <p className="text-sm text-muted-foreground">
          {inquiries.length} {inquiries.length === 1 ? "inquiry" : "inquiries"}{" "}
          · sellers reply out of band, contact details are never shared here.
        </p>
      </div>

      <ul className="flex flex-col gap-4">
        {inquiries.map((inquiry) => (
          <li key={inquiry.id}>
            <Card className="bg-surface">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="text-base">
                      <Link
                        href={`/assets/${inquiry.asset.id}`}
                        className="hover:text-primary hover:underline hover:underline-offset-4"
                      >
                        {inquiry.asset.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {inquiry.seller.displayName}
                      {inquiry.seller.company
                        ? ` · ${inquiry.seller.company}`
                        : null}{" "}
                      ·{" "}
                      {formatPrice(inquiry.asset.price, inquiry.asset.currency)}
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-primary/40 text-primary"
                  >
                    Sent
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90">
                  {inquiry.message}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{DATE_FORMAT.format(inquiry.createdAt)}</span>
                  <span aria-hidden="true">·</span>
                  <LicenseTypeBadge value={inquiry.asset.licenseType} />
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">
                    {inquiry.asset.jurisdiction}
                  </span>
                  {inquiry.asset.status !== "PUBLISHED" && (
                    <Badge variant="outline" className="text-muted-foreground">
                      asset {inquiry.asset.status.toLowerCase()}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
