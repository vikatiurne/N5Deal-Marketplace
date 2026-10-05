"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EyeOff,
  MoreVertical,
  PauseCircle,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";

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
import { setAssetStatus } from "@/server/seller";
import type { Asset, AssetStatus } from "@/types";

interface AssetRowActionsProps {
  asset: Pick<Asset, "id" | "title" | "status">;
}

const NEXT_STATUS_LABEL: Record<AssetStatus, string> = {
  DRAFT: "Publish",
  PUBLISHED: "Unpublish",
  PAUSED: "Resume",
  REMOVED: "Restore as draft",
};

export function AssetRowActions({ asset }: AssetRowActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const canToggle = asset.status !== "REMOVED";
  const toggleTo: AssetStatus =
    asset.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  function changeStatus(status: AssetStatus, label: string) {
    setOpen(false);
    startTransition(async () => {
      const result = await setAssetStatus({ id: asset.id, status });
      if (!result.ok) {
        toast({
          title: "Action failed",
          description: result.error ?? "Try again.",
          variant: "destructive",
        });
        return;
      }
      router.refresh();
      toast({ title: label, description: asset.title });
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" asChild disabled={isPending}>
        <Link href={`/seller/assets/${asset.id}/edit`}>
          <Pencil className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Edit</span>
        </Link>
      </Button>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            aria-label={`Actions for ${asset.title}`}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Listing actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canToggle && (
            <DropdownMenuItem
              onSelect={() =>
                changeStatus(
                  toggleTo,
                  toggleTo === "PUBLISHED"
                    ? "Listing published"
                    : "Listing unpublished",
                )
              }
            >
              {toggleTo === "PUBLISHED" ? (
                <Send className="size-4" aria-hidden="true" />
              ) : (
                <EyeOff className="size-4" aria-hidden="true" />
              )}
              {NEXT_STATUS_LABEL[asset.status]}
            </DropdownMenuItem>
          )}
          {asset.status === "PUBLISHED" && (
            <DropdownMenuItem
              onSelect={() => changeStatus("PAUSED", "Listing paused")}
            >
              <PauseCircle className="size-4" aria-hidden="true" />
              Pause
            </DropdownMenuItem>
          )}
          {asset.status !== "REMOVED" && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => changeStatus("REMOVED", "Listing removed")}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Delete (soft)
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
