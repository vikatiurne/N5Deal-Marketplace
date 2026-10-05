"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PauseCircle, RotateCcw, Send, Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/manager/ConfirmDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { moderateAsset } from "@/server/manager";
import type { AssetStatus } from "@/types";

interface ManagerAssetRowActionsProps {
  asset: { id: string; title: string; status: AssetStatus };
}

/** Only the three moderation statuses — a manager cannot create seller drafts. */
type ModerationStatus = "PUBLISHED" | "PAUSED" | "REMOVED";

const DONE_LABEL: Record<ModerationStatus, string> = {
  PUBLISHED: "Listing published",
  PAUSED: "Listing paused",
  REMOVED: "Listing removed",
};

export function ManagerAssetRowActions({ asset }: ManagerAssetRowActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState<ModerationStatus | null>(null);

  function run(status: ModerationStatus) {
    startTransition(async () => {
      const result = await moderateAsset({ assetId: asset.id, status });
      if (!result.ok) {
        toast({
          title: "Action failed",
          description: result.error ?? "Try again.",
          variant: "destructive",
        });
        return;
      }
      router.refresh();
      toast({ title: DONE_LABEL[status], description: asset.title });
    });
  }

  function askConfirmation(status: ModerationStatus) {
    setOpen(false);
    setConfirming(status);
  }

  const canPause = asset.status === "PUBLISHED";
  const canPublish = asset.status !== "PUBLISHED";
  const canRemove = asset.status !== "REMOVED";

  const removeCopy = {
    title: `Remove "${asset.title}"?`,
    description:
      "The listing disappears from the public marketplace but stays in this table and in the seller's account. It can be reinstated later.",
    label: "Remove listing",
  } as const;

  const pauseCopy = {
    title: `Pause "${asset.title}"?`,
    description:
      "The listing is unpublished while paused. The seller can resume it themselves at any time.",
    label: "Pause listing",
  } as const;

  const copy = confirming === "REMOVED" ? removeCopy : pauseCopy;

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="sm" asChild disabled={isPending}>
          <Link href={`/assets/${asset.id}`}>
            View
            <span className="sr-only"> {asset.title}</span>
          </Link>
        </Button>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending || (!canPause && !canPublish && !canRemove)}
              aria-label={`Moderate ${asset.title}`}
            >
              Moderate
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Moderation</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canPublish && (
              <DropdownMenuItem onSelect={() => run("PUBLISHED")}>
                {asset.status === "REMOVED" ? (
                  <RotateCcw className="size-4" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                {asset.status === "REMOVED" ? "Reinstate & publish" : "Publish"}
              </DropdownMenuItem>
            )}
            {canPause && (
              <DropdownMenuItem onSelect={() => askConfirmation("PAUSED")}>
                <PauseCircle className="size-4" aria-hidden="true" />
                Pause
              </DropdownMenuItem>
            )}
            {canRemove && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => askConfirmation("REMOVED")}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remove (soft)
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {confirming && (
        <ConfirmDialog
          open
          onOpenChange={(next) => {
            if (!next) setConfirming(null);
          }}
          title={copy.title}
          description={copy.description}
          confirmLabel={copy.label}
          isPending={isPending}
          onConfirm={() => {
            const status = confirming;
            setConfirming(null);
            run(status);
          }}
          trigger={<span className="hidden" />}
        />
      )}
    </>
  );
}
