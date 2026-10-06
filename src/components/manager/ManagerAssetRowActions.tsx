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
import { useLocaleHref, useT } from "@/i18n/client";
import type { MessageKey } from "@/i18n/core";
import { moderateAsset } from "@/server/manager";
import type { AssetStatus } from "@/types";

interface ManagerAssetRowActionsProps {
  asset: { id: string; title: string; status: AssetStatus };
}

/** Only the three moderation statuses — a manager cannot create seller drafts. */
type ModerationStatus = "PUBLISHED" | "PAUSED" | "REMOVED";

const DONE_KEYS: Record<ModerationStatus, MessageKey> = {
  PUBLISHED: "manager.action.assetPublished",
  PAUSED: "manager.action.assetPaused",
  REMOVED: "manager.action.assetRemoved",
};

export function ManagerAssetRowActions({ asset }: ManagerAssetRowActionsProps) {
  const t = useT();
  const localizedHref = useLocaleHref();
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
          title: t("manager.toast.failed"),
          description: result.error ?? t("common.retry"),
          variant: "destructive",
        });
        return;
      }
      router.refresh();
      toast({ title: t(DONE_KEYS[status]), description: asset.title });
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
    title: t("manager.assetActions.removeTitle", { title: asset.title }),
    description: t("manager.assetActions.removeDescription"),
    label: t("manager.assetActions.removeConfirm"),
  } as const;

  const pauseCopy = {
    title: t("manager.assetActions.pauseTitle", { title: asset.title }),
    description: t("manager.assetActions.pauseDescription"),
    label: t("manager.assetActions.pauseConfirm"),
  } as const;

  const copy = confirming === "REMOVED" ? removeCopy : pauseCopy;

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="sm" asChild disabled={isPending}>
          <Link href={localizedHref(`/assets/${asset.id}`)}>
            {t("manager.assetActions.view")}
            <span className="sr-only"> {asset.title}</span>
          </Link>
        </Button>

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isPending || (!canPause && !canPublish && !canRemove)}
              aria-label={t("manager.assetActions.aria", {
                title: asset.title,
              })}
            >
              {t("manager.moderate")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t("manager.moderation")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {canPublish && (
              <DropdownMenuItem onSelect={() => run("PUBLISHED")}>
                {asset.status === "REMOVED" ? (
                  <RotateCcw className="size-4" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                {asset.status === "REMOVED"
                  ? t("manager.assetActions.reinstatePublish")
                  : t("manager.assetActions.publish")}
              </DropdownMenuItem>
            )}
            {canPause && (
              <DropdownMenuItem onSelect={() => askConfirmation("PAUSED")}>
                <PauseCircle className="size-4" aria-hidden="true" />
                {t("manager.assetActions.pause")}
              </DropdownMenuItem>
            )}
            {canRemove && (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => askConfirmation("REMOVED")}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                {t("manager.assetActions.removeSoft")}
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
