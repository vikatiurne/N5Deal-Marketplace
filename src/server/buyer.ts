"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guards";
import { findAssetById } from "@/lib/db/repositories/assets";
import {
  createInquiry as createInquiryRecord,
  findInquiry,
} from "@/lib/db/repositories/inquiries";
import { updateUser } from "@/lib/db/repositories/users";
import { upsertBuyerProfile } from "@/lib/db/repositories/buyers";
import {
  buyerProfileSchema,
  inquirySchema,
  type BuyerProfileInput,
  type InquiryInput,
} from "@/lib/validation/buyer";
import type { ActionResult } from "@/server/auth";

function isPrismaUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && e.code === "P2002"
  );
}

/**
 * Creates the buyer's profile (or updates it). Company lives on User, the rest
 * on BuyerProfile — one form, one action, both writes.
 */
export async function updateBuyerProfile(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireRole("BUYER");

  const parsed = buyerProfileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const data: BuyerProfileInput = parsed.data;

  try {
    await updateUser(user.id, { company: data.company });
    await upsertBuyerProfile(user.id, {
      jurisdictions: data.jurisdictions,
      licenseTypes: data.licenseTypes,
      budgetMin: data.budgetMin ?? null,
      budgetMax: data.budgetMax ?? null,
      description: data.description,
    });
  } catch (e) {
    if (isPrismaUniqueError(e)) {
      return { ok: false, error: "Could not save profile — try again." };
    }
    throw e;
  }

  revalidatePath("/buyer");
  revalidatePath("/buyer/profile");
  revalidatePath("/assets");
  return { ok: true };
}

/**
 * Buyer → seller contact request about an asset. One inquiry per
 * (asset, buyer) — the unique constraint surfaces as a friendly error.
 */
export async function createInquiry(input: unknown): Promise<ActionResult> {
  const user = await requireRole("BUYER");

  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const data: InquiryInput = parsed.data;

  const asset = await findAssetById(data.assetId);
  if (!asset || asset.status !== "PUBLISHED") {
    return { ok: false, error: "This asset is no longer available." };
  }

  // Check first for a precise message; P2002 below covers the race.
  const existing = await findInquiry(data.assetId, user.id);
  if (existing) {
    return {
      ok: false,
      error: "You already sent an inquiry for this asset.",
    };
  }

  try {
    await createInquiryRecord({
      assetId: data.assetId,
      buyerId: user.id,
      initiatorRole: "BUYER",
      message: data.message,
    });
  } catch (e) {
    if (isPrismaUniqueError(e)) {
      return {
        ok: false,
        error: "You already sent an inquiry for this asset.",
      };
    }
    throw e;
  }

  revalidatePath("/buyer");
  revalidatePath("/buyer/inquiries");
  revalidatePath(`/assets/${data.assetId}`);
  revalidatePath("/assets");
  return { ok: true };
}
