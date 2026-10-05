"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createInquiry } from "@/server/buyer";
import { cn } from "@/lib/utils";

const MESSAGE_MIN = 20;

interface ContactSellerButtonProps {
  assetId: string;
  assetTitle: string;
  sellerName: string;
  /** Buyer already has an inquiry for this asset — button is locked. */
  alreadySent: boolean;
}

export function ContactSellerButton({
  assetId,
  assetTitle,
  sellerName,
  alreadySent,
}: ContactSellerButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  // Local mirror so the button locks immediately, before revalidation lands.
  const [sent, setSent] = useState(alreadySent);

  const trimmed = message.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MESSAGE_MIN;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    startTransition(async () => {
      const result = await createInquiry({ assetId, message });

      if (!result.ok) {
        toast({
          title: "Inquiry not sent",
          description: result.error ?? "Please try again.",
          variant: "destructive",
        });
        return;
      }

      setSent(true);
      setOpen(false);
      setMessage("");
      router.refresh();
      toast({
        title: "Inquiry sent",
        description: `${sellerName} will see your message about “${assetTitle}”.`,
      });
    });
  }

  if (sent) {
    return (
      <Button variant="outline" disabled>
        <Check className="size-4" aria-hidden="true" />
        Inquiry sent ✓
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Contact seller</Button>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Contact seller</DialogTitle>
            <DialogDescription>
              Send an inquiry about “{assetTitle}” to {sellerName}. Seller
              contact details stay private — the platform relays your message.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="inquiry-message">Your message</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  tooShort ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {trimmed.length} / min {MESSAGE_MIN}
              </span>
            </div>
            <Textarea
              id="inquiry-message"
              name="message"
              rows={5}
              required
              minLength={MESSAGE_MIN}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="We are interested in this licence. Could you share the last two years of audited financials and details on the regulatory history?"
              autoFocus
            />
            {tooShort && (
              <p className="text-xs text-destructive">
                Add a bit more detail — at least {MESSAGE_MIN} characters.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || trimmed.length < MESSAGE_MIN}
            >
              {isPending ? "Sending…" : "Send inquiry"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
