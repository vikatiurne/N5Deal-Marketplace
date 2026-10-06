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
import { useT } from "@/i18n/client";
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
  const t = useT();
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
          title: t("contact.failed.title"),
          description: result.error ?? t("contact.failed.description"),
          variant: "destructive",
        });
        return;
      }

      setSent(true);
      setOpen(false);
      setMessage("");
      router.refresh();
      toast({
        title: t("contact.sent.title"),
        description: t("contact.sent.description", {
          sellerName,
          assetTitle,
        }),
      });
    });
  }

  if (sent) {
    return (
      <Button variant="outline" disabled>
        <Check className="size-4" aria-hidden="true" />
        {t("contact.sentBadge")}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>{t("contact.button")}</Button>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("contact.title")}</DialogTitle>
            <DialogDescription>
              {t("contact.description", { assetTitle, sellerName })}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="inquiry-message">
                {t("contact.messageLabel")}
              </Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  tooShort ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {t("contact.counter", {
                  count: trimmed.length,
                  min: MESSAGE_MIN,
                })}
              </span>
            </div>
            <Textarea
              id="inquiry-message"
              name="message"
              aria-invalid={tooShort || undefined}
              aria-describedby={tooShort ? "inquiry-message-error" : undefined}
              rows={5}
              required
              minLength={MESSAGE_MIN}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("contact.placeholder")}
              autoFocus
            />
            {tooShort && (
              <p
                id="inquiry-message-error"
                className="text-xs text-destructive"
              >
                {t("contact.tooShort", { min: MESSAGE_MIN })}
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
              {t("contact.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || trimmed.length < MESSAGE_MIN}
            >
              {isPending ? t("contact.sending") : t("contact.send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
