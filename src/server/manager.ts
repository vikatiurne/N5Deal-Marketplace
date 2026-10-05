"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guards";
import { memberModerationError } from "@/lib/auth/permissions";
import {
  findAssetById,
  updateAsset as updateAssetRecord,
} from "@/lib/db/repositories/assets";
import { createAuditLog } from "@/lib/db/repositories/auditLog";
import { findUserById, updateUserStatus } from "@/lib/db/repositories/users";
import {
  ASSET_AUDIT_ACTION,
  moderateAssetSchema,
  moderateUserSchema,
  USER_AUDIT_ACTION,
  type ModerateAssetInput,
} from "@/lib/validation/manager";
import type { ActionResult } from "@/server/auth";

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input";
}

function revalidateModerationViews(targetUserId?: string) {
  revalidatePath("/manager");
  revalidatePath("/manager/users");
  revalidatePath("/manager/audit");
  if (targetUserId) revalidatePath(`/seller/buyers/${targetUserId}`);
  revalidatePath("/seller/buyers");
}

/**
 * Suspends, reactivates or soft-deletes a member and records the transition in
 * the audit trail.
 *
 * Soft delete is a status change, never a row delete: the seller's listings and
 * both parties' inquiries stay intact and readable in the manager console.
 */
export async function moderateUser(input: unknown): Promise<ActionResult> {
  const actor = await requireRole("MANAGER");

  const parsed = moderateUserSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { userId, status } = parsed.data;

  const target = await findUserById(userId);
  if (!target) return { ok: false, error: "Member not found." };

  // Guards both the manager-role lock and the no-op transition; no audit entry
  // is written when a request is rejected.
  const guard = memberModerationError(
    { role: target.role, status: target.status },
    status,
  );
  if (guard) return { ok: false, error: guard };

  await updateUserStatus(target.id, status);
  await createAuditLog({
    actorId: actor.id,
    action: USER_AUDIT_ACTION[status],
    targetType: "USER",
    targetId: target.id,
    meta: {
      label: target.email,
      from: target.status,
      to: status,
      role: target.role,
    },
  });

  revalidateModerationViews(target.id);
  return { ok: true };
}

/** Publishes, pauses or soft-removes a listing on behalf of the platform. */
export async function moderateAsset(input: unknown): Promise<ActionResult> {
  const actor = await requireRole("MANAGER");

  const parsed = moderateAssetSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };
  const { assetId, status } = parsed.data as ModerateAssetInput;

  const asset = await findAssetById(assetId);
  if (!asset) return { ok: false, error: "Asset not found." };

  if (asset.status === status) {
    return { ok: false, error: "Listing is already in this state." };
  }

  await updateAssetRecord(asset.id, { status });

  await createAuditLog({
    actorId: actor.id,
    action: ASSET_AUDIT_ACTION[status],
    targetType: "ASSET",
    targetId: asset.id,
    meta: { label: asset.title, from: asset.status, to: status },
  });

  revalidateModerationViews();
  revalidatePath("/manager/assets");
  revalidatePath("/seller/assets");
  revalidatePath(`/assets/${asset.id}`);
  revalidatePath("/assets");
  return { ok: true };
}
