import { z } from "zod";

import { LicenseType } from "@/types";

/** ISO codes offered in buyer forms — mirrors the seed data and FilterBar. */
export const JURISDICTION_OPTIONS = [
  "LT",
  "CY",
  "MT",
  "EE",
  "PL",
  "SE",
  "FI",
  "CZ",
] as const;

export type JurisdictionCode = (typeof JURISDICTION_OPTIONS)[number];

const jurisdictionValues = [...JURISDICTION_OPTIONS] as [
  JurisdictionCode,
  ...JurisdictionCode[],
];

const licenseTypeValues = Object.values(LicenseType) as [
  LicenseType,
  ...LicenseType[],
];

/** Empty input ("") means "not set", not zero. */
const optionalBudget = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.coerce.number().int().min(0, "Budget cannot be negative").optional());

export const buyerProfileSchema = z
  .object({
    company: z
      .string()
      .trim()
      .min(2, "Company must be at least 2 characters")
      .max(120, "Company is too long"),
    jurisdictions: z
      .array(z.enum(jurisdictionValues))
      .min(1, "Select at least one jurisdiction")
      .max(jurisdictionValues.length),
    licenseTypes: z
      .array(z.enum(licenseTypeValues))
      .min(1, "Select at least one license type")
      .max(licenseTypeValues.length),
    budgetMin: optionalBudget,
    budgetMax: optionalBudget,
    description: z
      .string()
      .trim()
      .min(20, "Describe your interests in at least 20 characters")
      .max(2000, "Description is too long"),
  })
  .refine(
    (data) =>
      data.budgetMin === undefined ||
      data.budgetMax === undefined ||
      data.budgetMin <= data.budgetMax,
    {
      message: "Minimum budget must not exceed maximum budget",
      path: ["budgetMin"],
    },
  );

export type BuyerProfileInput = z.infer<typeof buyerProfileSchema>;

export const inquirySchema = z.object({
  assetId: z.string().min(1, "Missing asset").max(64),
  message: z
    .string()
    .trim()
    .min(20, "Message must be at least 20 characters")
    .max(2000, "Message is too long"),
});

export type InquiryInput = z.infer<typeof inquirySchema>;
