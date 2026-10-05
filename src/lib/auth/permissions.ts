import type { Role, UserStatus } from "@/types";

/**
 * Moderation rules that are domain decisions rather than plumbing. Kept out of
 * the server action file ("use server" modules may only export async
 * functions) so they can be unit-tested directly.
 */
export const MODERATION_ERRORS = {
  managerLocked: "Manager accounts cannot be suspended or deleted.",
  noChange: "Member is already in this state.",
} as const;

/**
 * May this status transition be applied to the target member?
 *
 * Returning a message (instead of a boolean) keeps the caller free to put the
 * exact wording into the ActionResult and to skip writing the audit entry.
 * Reactivate (`ACTIVE`) is always allowed — otherwise a locked-out manager
 * account could never be recovered from the console.
 */
export function memberModerationError(
  target: { role: Role; status: UserStatus },
  next: UserStatus,
): string | null {
  if (target.status === next) return MODERATION_ERRORS.noChange;
  if (target.role === "MANAGER" && next !== "ACTIVE") {
    return MODERATION_ERRORS.managerLocked;
  }
  return null;
}
