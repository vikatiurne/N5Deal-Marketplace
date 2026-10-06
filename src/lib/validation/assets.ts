import { z } from "zod";

import { LicenseType } from "@/types";

const licenseTypeValues = Object.values(LicenseType) as [
  (typeof LicenseType)[keyof typeof LicenseType],
  ...(typeof LicenseType)[keyof typeof LicenseType][],
];

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
  (value) => {
    const items = toStringArray(value);
    return items?.map((v) => v.toUpperCase());
  },
  z
    .array(
      // Deliberately not the closed JURISDICTIONS enum: a new ISO code should
      // not need a deploy. Letters only, though — "12" is two characters but
      // not a country, and `contains`-style filters would silently match none.
      z
        .string()
        .regex(/^[A-Z]{2}$/, "Jurisdiction must be a 2-letter ISO code"),
    )
    .optional(),
);

/** Empty input ("") is treated as absent, not as zero. */
const optionalInt = z.preprocess((value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
}, z.coerce.number().int().min(0).optional());

export const assetFiltersSchema = z
  .object({
    licenseType: licenseTypeArray,
    jurisdiction: jurisdictionArray,
    priceMin: optionalInt,
    priceMax: optionalInt,
    q: z
      .preprocess(
        (value) => (typeof value === "string" ? value.trim() : value),
        z.string().max(200).optional(),
      )
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
    page: z.preprocess((value) => {
      if (value === undefined || value === null || value === "") return 1;
      return value;
    }, z.coerce.number().int().min(1).default(1)),
  })
  .refine(
    (data) =>
      data.priceMin === undefined ||
      data.priceMax === undefined ||
      data.priceMin <= data.priceMax,
    {
      message: "priceMin must not exceed priceMax",
      path: ["priceMin"],
    },
  );

export type AssetFiltersInput = z.infer<typeof assetFiltersSchema>;
