import { z } from "zod";

import { AssetStatus, JURISDICTIONS, LicenseType } from "@/types";

const jurisdictionValues = [...JURISDICTIONS] as [
  (typeof JURISDICTIONS)[number],
  ...(typeof JURISDICTIONS)[number][],
];

const licenseTypeValues = Object.values(LicenseType) as [
  LicenseType,
  ...LicenseType[],
];

const assetStatusValues = Object.values(AssetStatus) as [
  AssetStatus,
  ...AssetStatus[],
];

/** Empty input ("") means "price on request", not zero. */
const optionalPrice = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.coerce.number().int().min(0, "Price cannot be negative").optional());

const optionalInt = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.coerce.number().int().min(0, "Value cannot be negative").optional());

export const assetFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(120, "Title is too long"),
  licenseType: z.enum(licenseTypeValues),
  jurisdiction: z.enum(jurisdictionValues),
  price: optionalPrice,
  currency: z.enum(["EUR", "USD", "GBP"]),
  description: z
    .string()
    .trim()
    .min(40, "Description must be at least 40 characters")
    .max(2000, "Description is too long"),
});

export type AssetFormInput = z.infer<typeof assetFormSchema>;

/**
 * `publish` makes the listing visible; `draft` keeps it unpublished — on an
 * already-published asset it means "unpublish", which is what the button label
 * says in the UI.
 */
export const saveIntentSchema = z.enum(["draft", "publish"]);
export type SaveIntent = z.infer<typeof saveIntentSchema>;

export const assetStatusActionSchema = z.object({
  id: z.string().min(1, "Missing asset"),
  status: z.enum(assetStatusValues),
});

/** Accepts `?licenseType=EMI`, `?licenseType=EMI,PI` or repeated params. */
function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  const list = Array.isArray(value) ? value : [value];
  const items = list
    .flatMap((v) => String(v).split(","))
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  return items.length > 0 ? items : undefined;
}

const licenseTypeArray = z.preprocess(
  toStringArray,
  z.array(z.enum(licenseTypeValues)).optional(),
);

const jurisdictionArray = z.preprocess(
  (value) => toStringArray(value)?.map((v) => v.toUpperCase()),
  z
    .array(z.enum(jurisdictionValues))
    .optional()
    .describe("Jurisdiction must be one of the supported ISO codes"),
);

export const buyerSearchSchema = z.object({
  q: z
    .preprocess(
      (value) => (typeof value === "string" ? value.trim() : value),
      z.string().max(200).optional(),
    )
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  jurisdiction: jurisdictionArray,
  licenseType: licenseTypeArray,
  budgetMin: optionalInt,
  budgetMax: optionalInt,
  page: z.preprocess((value) => {
    if (value === undefined || value === null || value === "") return 1;
    return value;
  }, z.coerce.number().int().min(1).default(1)),
});

export type BuyerSearchInput = z.infer<typeof buyerSearchSchema>;

export const sellerMessageSchema = z.object({
  buyerId: z.string().min(1, "Missing buyer"),
  assetId: z.string().min(1, "Missing asset"),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(2000, "Message is too long"),
});

export type SellerMessageInput = z.infer<typeof sellerMessageSchema>;

export const markReadSchema = z.object({
  inquiryIds: z.array(z.string().min(1)).min(1, "Nothing to mark as read"),
});

export type MarkReadInput = z.infer<typeof markReadSchema>;
