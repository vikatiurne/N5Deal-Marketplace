"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  EyeOff,
  MoreVertical,
  PauseCircle,
  Pencil,
  RotateCcw,
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
import { useLocaleHref, useT } from "@/i18n/client";
import type { MessageKey } from "@/i18n/core";
import { useToast } from "@/hooks/use-toast";
import { setAssetStatus } from "@/server/seller";
import type { Asset, AssetStatus } from "@/types";

interface AssetRowActionsProps {
  asset: Pick<Asset, "id" | "title" | "status">;
}

const NEXT_STATUS_LABEL: Record<AssetStatus, MessageKey> = {
  DRAFT: "seller.rowActions.next.DRAFT",
  PUBLISHED: "seller.rowActions.next.PUBLISHED",
  PAUSED: "seller.rowActions.next.PAUSED",
  REMOVED: "seller.rowActions.next.REMOVED",
};

export function AssetRowActions({ asset }: AssetRowActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useT();
  const localizedHref = useLocaleHref();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const isRemoved = asset.status === "REMOVED";
  const toggleTo: AssetStatus =
    asset.status === "PUBLISHED" || isRemoved ? "DRAFT" : "PUBLISHED";

  const toggleDoneLabel = isRemoved
    ? t("seller.rowActions.toast.restored")
    : toggleTo === "PUBLISHED"
      ? t("seller.rowActions.toast.published")
      : t("seller.rowActions.toast.unpublished");

  function changeStatus(status: AssetStatus, label: string) {
    setOpen(false);
    startTransition(async () => {
      const result = await setAssetStatus({ id: asset.id, status });
      if (!result.ok) {
        toast({
          title: t("seller.rowActions.error.title"),
          description: result.error ?? t("common.retry"),
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
        <Link href={localizedHref(`/seller/assets/${asset.id}/edit`)}>
          <Pencil className="size-4" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">
            {t("seller.rowActions.edit")}
          </span>
        </Link>
      </Button>

      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            aria-label={t("seller.rowActions.menuAria", { title: asset.title })}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {t("seller.rowActions.menuLabel")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => changeStatus(toggleTo, toggleDoneLabel)}
          >
            {isRemoved ? (
              <RotateCcw className="size-4" aria-hidden="true" />
            ) : toggleTo === "PUBLISHED" ? (
              <Send className="size-4" aria-hidden="true" />
            ) : (
              <EyeOff className="size-4" aria-hidden="true" />
            )}
            {t(NEXT_STATUS_LABEL[asset.status])}
          </DropdownMenuItem>
          {asset.status === "PUBLISHED" && (
            <DropdownMenuItem
              onSelect={() =>
                changeStatus("PAUSED", t("seller.rowActions.toast.paused"))
              }
            >
              <PauseCircle className="size-4" aria-hidden="true" />
              {t("seller.rowActions.pause")}
            </DropdownMenuItem>
          )}
          {!isRemoved && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() =>
                changeStatus("REMOVED", t("seller.rowActions.toast.removed"))
              }
            >
              <Trash2 className="size-4" aria-hidden="true" />
              {t("seller.rowActions.deleteSoft")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
