import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";

import { BuyerFilterBar } from "@/components/seller/BuyerFilterBar";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { LicenseTypeBadge } from "@/components/assets/LicenseTypeBadge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { listBuyers } from "@/lib/db/repositories/buyers";
import { formatBudgetRange } from "@/lib/formatPrice";
import { buyerSearchSchema } from "@/lib/validation/seller";

export const metadata: Metadata = {
  title: "Buyers",
};

const PAGE_SIZE = 12;

type RawParams = Record<string, string | string[] | undefined>;

export default async function SellerBuyersPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  await requireRole("SELLER");

  const raw = await searchParams;
  const parsed = buyerSearchSchema.safeParse(raw);
  const filters = parsed.success ? parsed.data : { page: 1 };

  const { items: buyers, total } = await listBuyers({
    pageSize: PAGE_SIZE,
    ...filters,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Buyers</h1>
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No buyers match the filters"
            : `${total} ${total === 1 ? "buyer" : "buyers"} with a public profile`}
        </p>
      </div>

      <BuyerFilterBar />

      {buyers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No buyers match"
          description="Widen the budget range or clear the jurisdiction and license filters."
          actionHref="/seller/buyers"
          actionLabel="Reset filters"
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {buyers.map((buyer) => (
            <li key={buyer.userId}>
              <Card className="flex h-full flex-col bg-surface">
                <CardHeader>
                  <CardTitle className="text-base">
                    <Link
                      href={`/seller/buyers/${buyer.userId}`}
                      className="hover:text-primary hover:underline hover:underline-offset-4"
                    >
                      {buyer.company ?? buyer.displayName}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    {buyer.company ? `${buyer.displayName} · ` : ""}
                    {formatBudgetRange(buyer.budgetMin, buyer.budgetMax)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="flex flex-wrap gap-1.5">
                    {buyer.jurisdictions.map((code) => (
                      <Badge
                        key={code}
                        variant="outline"
                        className="font-mono text-muted-foreground"
                      >
                        {code}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {buyer.licenseTypes.map((license) => (
                      <LicenseTypeBadge key={license} value={license} />
                    ))}
                  </div>
                  {buyer.description && (
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {buyer.description}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="mt-auto w-fit"
                  >
                    <Link href={`/seller/buyers/${buyer.userId}`}>
                      View profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
