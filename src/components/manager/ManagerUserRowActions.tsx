"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Ban, RotateCcw, Trash2 } from "lucide-react";

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
import { useT } from "@/i18n/client";
import type { MessageKey } from "@/i18n/core";
import { moderateUser } from "@/server/manager";
import type { Role, UserStatus } from "@/types";

interface ManagerUserRowActionsProps {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: Role;
    status: UserStatus;
  };
}

const DONE_KEYS: Record<UserStatus, MessageKey> = {
  ACTIVE: "manager.action.userReactivated",
  SUSPENDED: "manager.action.userSuspended",
  DELETED: "manager.action.userSoftDeleted",
};

export function ManagerUserRowActions({ user }: ManagerUserRowActionsProps) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  // Which destructive action is waiting for confirmation.
  const [confirming, setConfirming] = useState<UserStatus | null>(null);

  // Manager accounts are locked: no manager may suspend or delete one.
  const locked = user.role === "MANAGER";

  function run(status: UserStatus) {
    startTransition(async () => {
      const result = await moderateUser({ userId: user.id, status });
      if (!result.ok) {
        toast({
          title: t("manager.toast.failed"),
          description: result.error ?? t("common.retry"),
          variant: "destructive",
        });
        return;
      }
      router.refresh();
      toast({ title: t(DONE_KEYS[status]), description: user.email });
    });
  }

  const canSuspend = user.status === "ACTIVE";
  const canReactivate =
    user.status === "SUSPENDED" || user.status === "DELETED";
  const canDelete = user.status !== "DELETED";

  function askConfirmation(status: UserStatus) {
    setOpen(false);
    setConfirming(status);
  }

  const confirmCopy = {
    SUSPENDED: {
      title: t("manager.userActions.suspendTitle", { email: user.email }),
      description: t("manager.userActions.suspendDescription"),
      label: t("manager.userActions.suspendConfirm"),
    },
    DELETED: {
      title: t("manager.userActions.deleteTitle", { email: user.email }),
      description: t("manager.userActions.deleteDescription"),
      label: t("manager.userActions.deleteConfirm"),
    },
    ACTIVE: {
      title: t("manager.userActions.reactivateTitle", { email: user.email }),
      description: t("manager.userActions.reactivateDescription"),
      label: t("manager.userActions.reactivateConfirm"),
    },
  } as const;

  const copy = confirming ? confirmCopy[confirming] : null;

  return (
    <>
      <div className="flex items-center justify-end">
        {canReactivate && (
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => run("ACTIVE")}
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">
              {t("manager.userActions.reactivate")}
            </span>
          </Button>
        )}

        {locked ? (
          <Button
            variant="ghost"
            size="sm"
            disabled
            title={t("manager.userActions.lockedHint")}
          >
            <Ban className="size-4" aria-hidden="true" />
            {t("manager.userActions.locked")}
          </Button>
        ) : (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending || (!canSuspend && !canDelete)}
                aria-label={t("manager.userActions.aria", {
                  email: user.email,
                })}
              >
                {t("manager.moderate")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t("manager.moderation")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canSuspend && (
                <DropdownMenuItem onSelect={() => askConfirmation("SUSPENDED")}>
                  <Ban className="size-4" aria-hidden="true" />
                  {t("manager.userActions.suspend")}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => askConfirmation("DELETED")}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  {t("manager.userActions.softDelete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {copy && confirming && (
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
