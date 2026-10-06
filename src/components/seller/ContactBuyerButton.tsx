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
          title: "Message not sent",
          description: result.error ?? "Try again.",
          variant: "destructive",
        });
        return;
      }

      const sentTitle =
        assets.find((asset) => asset.id === assetId)?.title ?? "the listing";
      setSent((prev) => [...prev, assetId]);
      setMessage("");
      setOpen(false);
      router.refresh();
      toast({
        title: "Message sent",
        description: `${buyerLabel} will see your note about “${sentTitle}”.`,
      });
    });
  }

  if (assets.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Publish a listing before contacting buyers — messages are always tied to
        one of your assets.
      </p>
    );
  }

  if (available.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Check className="size-4" aria-hidden="true" />
        Message sent ✓
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => setOpen(true)}>Contact buyer</Button>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Contact {buyerLabel}</DialogTitle>
            <DialogDescription>
              Buyer contact details stay private — the platform relays your
              message, attached to a listing.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label id="contact-asset-label">About which asset?</Label>
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
              <Label htmlFor="seller-message">Your message</Label>
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
              placeholder="We can share the audited statements and the licence file under NDA — who should we talk to on your side?"
              autoFocus
            />
            {tooShort && (
              <p id="seller-message-error" className="text-xs text-destructive">
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
              disabled={isPending || trimmed.length < MESSAGE_MIN || !assetId}
            >
              {isPending ? "Sending…" : "Send message"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
