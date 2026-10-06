import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { LicenseTypeBadge } from "@/components/assets/LicenseTypeBadge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { localizePath } from "@/i18n/config";
import { getLocale, getT } from "@/i18n/server";
import { formatPrice } from "@/lib/formatPrice";
import type { Asset } from "@/types";

export async function AssetCard({ asset }: { asset: Asset }) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const href = (path: string) => localizePath(locale, path);
  return (
    <Card className="group/card flex h-full flex-col bg-surface shadow-card transition-[transform,box-shadow,border-color] duration-200 ease-soft hover:-translate-y-0.5 hover:shadow-card-hover focus-within:-translate-y-0.5 focus-within:shadow-card-hover">
      <CardHeader className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <LicenseTypeBadge value={asset.licenseType} />
          <Badge variant="outline" className="font-mono text-muted-foreground">
            {asset.jurisdiction}
          </Badge>
        </div>
        <CardTitle className="text-lg leading-snug">
          <Link
            href={href(`/assets/${asset.id}`)}
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
          {formatPrice(asset.price, asset.currency, locale)}
        </span>
        <Link
          href={href(`/assets/${asset.id}`)}
          className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4"
        >
          {t("assets.view")}
        </Link>
      </CardFooter>
    </Card>
  );
}
