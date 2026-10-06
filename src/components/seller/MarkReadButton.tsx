"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  const [isPending, startTransition] = useTransition();

  function markRead() {
    startTransition(async () => {
      const result = await markInquiriesAsRead({ inquiryIds });
      if (!result.ok) {
        toast({
          title: "Could not update",
          description: result.error ?? "Try again.",
          variant: "destructive",
        });
        return;
      }
      router.refresh();
      toast({
        title: "Marked as read",
        description:
          inquiryIds.length === 1
            ? "1 inquiry moved out of your unread count."
            : `${inquiryIds.length} inquiries moved out of your unread count.`,
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
        <span className="sr-only">Mark {inquiryIds.length} as read</span>
      ) : isPending ? (
        "Marking…"
      ) : (
        `Mark ${inquiryIds.length} as read`
      )}
    </Button>
  );
}
