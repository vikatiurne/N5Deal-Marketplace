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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useT } from "@/i18n/client";
import { useToast } from "@/hooks/use-toast";
import { sendBuyerMessage } from "@/server/seller";
import { cn } from "@/lib/utils";
import type { AssetStatus } from "@/types";

const MESSAGE_MIN = 20;

export interface ContactableAsset {
  id: string;
  title: string;
  status: AssetStatus;
}

interface ContactBuyerButtonProps {
  buyerId: string;
  buyerLabel: string;
  assets: ContactableAsset[];
  /** Assets this seller already messaged the buyer about. */
  sentAssetIds: string[];
}

/**
 * Seller → buyer direction of Inquiry (initiatorRole SELLER): same table, same
 * validation, opposite author.
 */
export function ContactBuyerButton({
  buyerId,
  buyerLabel,
  assets,
  sentAssetIds,
}: ContactBuyerButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const [sent, setSent] = useState<string[]>(sentAssetIds);
  const available = assets.filter((asset) => !sent.includes(asset.id));
  const [assetId, setAssetId] = useState(
    available[0]?.id ?? assets[0]?.id ?? "",
  );
  const [message, setMessage] = useState("");

  const trimmed = message.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MESSAGE_MIN;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!assetId) return;

    startTransition(async () => {
      const result = await sendBuyerMessage({ buyerId, assetId, message });

      if (!result.ok) {
        toast({
          title: t("seller.contact.error.title"),
          description: result.error ?? t("common.retry"),
          variant: "destructive",
        });
        return;
      }

      const sentTitle =
        assets.find((asset) => asset.id === assetId)?.title ??
        t("seller.contact.listingFallback");
      setSent((prev) => [...prev, assetId]);
      setMessage("");
      setOpen(false);
      router.refresh();
      toast({
        title: t("seller.contact.sentTitle"),
        description: t("seller.contact.sentDescription", {
          buyer: buyerLabel,
          asset: sentTitle,
        }),
      });
    });
  }

  if (assets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        {t("seller.contact.noAssets")}
      </p>
    );
  }

  if (available.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Check className="size-4" aria-hidden="true" />
        {t("seller.contact.allSent")}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>{t("seller.contact.open")}</Button>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>
              {t("seller.contact.dialogTitle", { buyer: buyerLabel })}
            </DialogTitle>
            <DialogDescription>
              {t("seller.contact.dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label id="contact-asset-label">
              {t("seller.contact.assetLabel")}
            </Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger aria-labelledby="contact-asset-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {available.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id}>
                    {asset.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor="seller-message">
                {t("seller.contact.messageLabel")}
              </Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  tooShort ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {t("seller.contact.counter", {
                  count: trimmed.length,
                  min: MESSAGE_MIN,
                })}
              </span>
            </div>
            <Textarea
              id="seller-message"
              name="message"
              rows={5}
              required
              aria-invalid={tooShort || undefined}
              aria-describedby={tooShort ? "seller-message-error" : undefined}
              minLength={MESSAGE_MIN}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("seller.contact.placeholder")}
              autoFocus
            />
            {tooShort && (
              <p id="seller-message-error" className="text-xs text-destructive">
                {t("seller.contact.tooShort", { min: MESSAGE_MIN })}
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
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isPending || trimmed.length < MESSAGE_MIN || !assetId}
            >
              {isPending
                ? t("seller.contact.sending")
                : t("seller.contact.send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
