"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guards";
import {
  createAsset as createAssetRecord,
  findOwnedAsset,
  updateAsset as updateAssetRecord,
} from "@/lib/db/repositories/assets";
import { findBuyerProfile } from "@/lib/db/repositories/buyers";
import {
  createInquiry as createMessageRecord,
  findInquiry,
  markInquiriesRead,
} from "@/lib/db/repositories/inquiries";
import {
  assetFormSchema,
  assetStatusActionSchema,
  markReadSchema,
  saveIntentSchema,
  sellerMessageSchema,
  type AssetFormInput,
} from "@/lib/validation/seller";
import type { ActionResult } from "@/server/auth";

/** 403 semantics: no mutation, no throw, no information leak. */
const FORBIDDEN: ActionResult = {
  ok: false,
  error: "You can only manage your own listings.",
};

function isPrismaUniqueError(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && e.code === "P2002"
  );
}

function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Invalid input";
}

/**
 * `intent: "draft"` creates an unpublished listing; `"publish"` puts it live
 * immediately.
 */
export async function createAsset(input: unknown): Promise<ActionResult> {
  const user = await requireRole("SELLER");

  const form = assetFormSchema.safeParse(input);
  if (!form.success) {
    return { ok: false, error: firstIssue(form.error) };
  }

  const intent = saveIntentSchema.safeParse(
    (input as { intent?: unknown })?.intent ?? "draft",
  );
  if (!intent.success) return { ok: false, error: "Invalid save intent" };

  const data: AssetFormInput = form.data;
  await createAssetRecord({
    sellerId: user.id,
    title: data.title,
    licenseType: data.licenseType,
    jurisdiction: data.jurisdiction,
    price: data.price ?? null,
    currency: data.currency,
    description: data.description,
    status: intent.data === "publish" ? "PUBLISHED" : "DRAFT",
  });

  revalidatePath("/seller");
  revalidatePath("/seller/assets");
  revalidatePath("/assets");
  return { ok: true, redirectTo: "/seller/assets" };
}

/**
 * Edits an owned listing. `"publish"` publishes it; `"draft"` keeps it
 * unpublished — which means unpublishing an already-published listing.
 */
export async function updateAssetDetails(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireRole("SELLER");

  const form = assetFormSchema.safeParse(input);
  if (!form.success) {
    return { ok: false, error: firstIssue(form.error) };
  }

  const raw = input as { id?: unknown; intent?: unknown };
  if (typeof raw.id !== "string" || raw.id.length === 0) {
    return { ok: false, error: "Missing asset" };
  }

  const intent = saveIntentSchema.safeParse(raw.intent ?? "draft");
  if (!intent.success) return { ok: false, error: "Invalid save intent" };

  // Ownership gate before any write.
  const owned = await findOwnedAsset(raw.id, user.id);
  if (!owned) return FORBIDDEN;

  const data: AssetFormInput = form.data;
  const status =
    intent.data === "publish"
      ? "PUBLISHED"
      : owned.status === "PUBLISHED"
        ? "DRAFT"
        : owned.status;

  await updateAssetRecord(owned.id, {
    title: data.title,
    licenseType: data.licenseType,
    jurisdiction: data.jurisdiction,
    price: data.price ?? null,
    currency: data.currency,
    description: data.description,
    status,
  });

  revalidatePath("/seller");
  revalidatePath("/seller/assets");
  revalidatePath(`/seller/assets/${owned.id}/edit`);
  revalidatePath(`/assets/${owned.id}`);
  revalidatePath("/assets");
  return { ok: true };
}

/** Publish / unpublish / pause / soft-delete (REMOVED) of an owned asset. */
export async function setAssetStatus(input: unknown): Promise<ActionResult> {
  const user = await requireRole("SELLER");

  const parsed = assetStatusActionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const owned = await findOwnedAsset(parsed.data.id, user.id);
  if (!owned) return FORBIDDEN;

  await updateAssetRecord(owned.id, { status: parsed.data.status });

  revalidatePath("/seller");
  revalidatePath("/seller/assets");
  revalidatePath(`/seller/assets/${owned.id}/edit`);
  revalidatePath(`/assets/${owned.id}`);
  revalidatePath("/assets");
  return { ok: true };
}

/**
 * Seller → buyer message about one of the seller's own assets. Same Inquiry
 * table, opposite direction (initiatorRole SELLER).
 */
export async function sendBuyerMessage(input: unknown): Promise<ActionResult> {
  const user = await requireRole("SELLER");

  const parsed = sellerMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const { buyerId, assetId, message } = parsed.data;

  const owned = await findOwnedAsset(assetId, user.id);
  if (!owned) return FORBIDDEN;

  // Cannot message a buyer who has no account on the platform.
  const buyer = await findBuyerProfile(buyerId);
  if (!buyer) {
    return { ok: false, error: "This buyer is no longer available." };
  }

  const existing = await findInquiry(assetId, buyerId, "SELLER");
  if (existing) {
    return {
      ok: false,
      error: "You already sent a message to this buyer about this asset.",
    };
  }

  try {
    await createMessageRecord({
      assetId,
      buyerId,
      initiatorRole: "SELLER",
      message,
    });
  } catch (e) {
    if (isPrismaUniqueError(e)) {
      return {
        ok: false,
        error: "You already sent a message to this buyer about this asset.",
      };
    }
    throw e;
  }

  revalidatePath("/seller");
  revalidatePath(`/seller/buyers/${buyerId}`);
  return { ok: true };
}

/** Marks received inquiries as read; the repository filters by ownership. */
export async function markInquiriesAsRead(
  input: unknown,
): Promise<ActionResult> {
  const user = await requireRole("SELLER");

  const parsed = markReadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  await markInquiriesRead(parsed.data.inquiryIds, user.id);

  revalidatePath("/seller");
  revalidatePath("/seller/assets");
  revalidatePath("/seller/inquiries");
  return { ok: true };
}
