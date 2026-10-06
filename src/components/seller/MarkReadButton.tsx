"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/client";
import { useToast } from "@/hooks/use-toast";
import { markInquiriesAsRead } from "@/server/seller";

export function MarkReadButton({
  inquiryIds,
  size = "sm",
}: {
  inquiryIds: string[];
  size?: "sm" | "icon";
}) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();
  const [isPending, startTransition] = useTransition();

  function markRead() {
    startTransition(async () => {
      const result = await markInquiriesAsRead({ inquiryIds });
      if (!result.ok) {
        toast({
          title: t("seller.markRead.error.title"),
          description: result.error ?? t("common.retry"),
          variant: "destructive",
        });
        return;
      }
      router.refresh();
      toast({
        title: t("seller.markRead.success.title"),
        description: t("seller.markRead.success.description", {
          count: inquiryIds.length,
        }),
      });
    });
  }

  if (inquiryIds.length === 0) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size={size}
      onClick={markRead}
      disabled={isPending}
    >
      <CheckCheck className="size-4" aria-hidden="true" />
      {size === "icon" ? (
        /* The visible label is gone in the icon variant, so the count has to
           be announced here instead — it used to be in *both* variants, which
           made the button read "Mark as read Mark 3 inquiries as read". */
        <span className="sr-only">
          {t("seller.markRead.button", { count: inquiryIds.length })}
        </span>
      ) : isPending ? (
        t("seller.markRead.pending")
      ) : (
        t("seller.markRead.button", { count: inquiryIds.length })
      )}
    </Button>
  );
}
