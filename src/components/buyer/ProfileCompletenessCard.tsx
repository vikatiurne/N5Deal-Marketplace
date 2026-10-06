import Link from "next/link";

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
import { localizePath } from "@/i18n/config";
import type { MessageKey } from "@/i18n/core";
import { getLocale, getT } from "@/i18n/server";
import type { ProfileCompleteness } from "@/lib/buyer/matching";

const MISSING_LABEL_KEYS: Record<string, MessageKey> = {
  Company: "buyer.field.company",
  Jurisdictions: "buyer.field.jurisdictions",
  "License types": "buyer.field.licenseTypes",
  Budget: "buyer.field.budget",
  Description: "common.description",
};

export async function ProfileCompletenessCard({
  completeness,
}: {
  completeness: ProfileCompleteness;
}) {
  const [locale, t] = await Promise.all([getLocale(), getT()]);
  const complete = completeness.percent === 100;

  return (
    <Card className="flex h-full flex-col bg-surface">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          {t("buyer.completeness.title")}
          <Badge
            variant="outline"
            className={
              complete
                ? "border-primary/40 text-primary"
                : "border-warning/40 bg-warning/10 text-warning"
            }
          >
            {complete
              ? t("buyer.completeness.complete")
              : t("buyer.completeness.incomplete")}
          </Badge>
        </CardTitle>
        <CardDescription>
          {complete
            ? t("buyer.completeness.completeDescription")
            : t("buyer.completeness.incompleteDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <div className="flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuenow={completeness.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("buyer.completeness.title")}
            className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${completeness.percent}%` }}
            />
          </div>
          <span className="text-sm font-semibold tabular-nums text-primary">
            {completeness.percent}%
          </span>
        </div>

        {completeness.missing.length > 0 && (
          <p className="mt-3 text-sm text-muted-foreground">
            {t("buyer.completeness.missing", {
              fields: completeness.missing
                .map((label) => t(MISSING_LABEL_KEYS[label]))
                .join(", "),
            })}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button variant="outline" size="sm" asChild>
          <Link href={localizePath(locale, "/buyer/profile")}>
            {t("buyer.completeness.edit")}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
