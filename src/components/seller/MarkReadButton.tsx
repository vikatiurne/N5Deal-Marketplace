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
      {size === "icon" ? (
        <CheckCheck className="size-4" aria-hidden="true" />
      ) : (
        <>
          <CheckCheck className="size-4" aria-hidden="true" />
          {isPending ? "Marking…" : "Mark as read"}
        </>
      )}
      <span className="sr-only">
        Mark {inquiryIds.length} inquiries as read
      </span>
    </Button>
  );
}
