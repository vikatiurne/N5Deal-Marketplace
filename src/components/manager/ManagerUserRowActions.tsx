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

const DONE_LABEL: Record<UserStatus, string> = {
  ACTIVE: "Member reactivated",
  SUSPENDED: "Member suspended",
  DELETED: "Member soft-deleted",
};

export function ManagerUserRowActions({ user }: ManagerUserRowActionsProps) {
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
          title: "Action failed",
          description: result.error ?? "Try again.",
          variant: "destructive",
        });
        return;
      }
      router.refresh();
      toast({ title: DONE_LABEL[status], description: user.email });
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
      title: `Suspend ${user.email}?`,
      description:
        "They will be signed out immediately and cannot sign in again until a manager reactivates the account. Their listings and inquiries are kept.",
      label: "Suspend member",
    },
    DELETED: {
      title: `Soft-delete ${user.email}?`,
      description:
        "The account can no longer sign in and drops out of the buyer directory and matching. Nothing is deleted: listings and inquiries stay in the database and can be restored.",
      label: "Soft-delete member",
    },
    ACTIVE: {
      title: `Reactivate ${user.email}?`,
      description:
        "The account gets full access again, including the buyer directory.",
      label: "Reactivate member",
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
            <span className="sr-only sm:not-sr-only">Reactivate</span>
          </Button>
        )}

        {locked ? (
          <Button
            variant="ghost"
            size="sm"
            disabled
            title="Manager accounts cannot be suspended or deleted"
          >
            <Ban className="size-4" aria-hidden="true" />
            Locked
          </Button>
        ) : (
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                disabled={isPending || (!canSuspend && !canDelete)}
                aria-label={`Actions for ${user.email}`}
              >
                Moderate
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Moderation</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canSuspend && (
                <DropdownMenuItem onSelect={() => askConfirmation("SUSPENDED")}>
                  <Ban className="size-4" aria-hidden="true" />
                  Suspend
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onSelect={() => askConfirmation("DELETED")}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Soft-delete
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
