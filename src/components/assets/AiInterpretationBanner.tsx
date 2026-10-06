"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";

/**
 * Shows how the AI read the query. The explanation lives in the URL (`exp=`),
 * so the banner survives a refresh or a shared link — there is no client state
 * to lose. Dismissing strips `ai`/`exp` and keeps the filters.
 */
export function AiInterpretationBanner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const t = useT();
  const explanation = params.get("exp");
  const [dismissed, setDismissed] = useState(false);

  if (!explanation || dismissed) return null;

  function dismiss() {
    setDismissed(true);
    const next = new URLSearchParams(params.toString());
    next.delete("ai");
    next.delete("exp");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }

  return (
    <div
      role="status"
      className="flex items-start justify-between gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3"
    >
      <p className="text-sm">
        <Sparkles
          className="mr-1.5 inline size-4 text-primary"
          aria-hidden="true"
        />
        <span className="font-medium">{t("ai.label")}</span> {explanation}
      </p>
      <Button
        variant="ghost"
        size="icon"
        onClick={dismiss}
        aria-label={t("ai.dismiss")}
        className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
