import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/formatPrice";
import type { Asset } from "@/types";

export function AssetCard({ asset }: { asset: Asset }) {
  return (
    <Card className="flex h-full flex-col bg-surface transition-transform duration-200 hover:-translate-y-0.5">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20">
            {asset.licenseType}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            {asset.jurisdiction}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link
            href={`/assets/${asset.id}`}
            className="hover:text-primary hover:underline hover:underline-offset-4"
          >
            {asset.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <CardDescription className="line-clamp-2">
          {asset.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold text-primary">
          {formatPrice(asset.price, asset.currency)}
        </span>
        <Link
          href={`/assets/${asset.id}`}
          className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
        >
          View →
        </Link>
      </CardFooter>
    </Card>
  );
}
