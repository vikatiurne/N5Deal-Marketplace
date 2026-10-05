import { z } from "zod";

import { LicenseType } from "@/types";

/**
 * Pure, isomorphic half of the smart-search feature: schemas, the explanation
 * builder and the URL serialiser. Both the server parser and the client
 * components import from here — which is why nothing in this file may touch the
 * LLM client, `process.env` secrets or the database.
 */

const licenseTypeValues = Object.values(LicenseType) as [
  LicenseType,
  ...LicenseType[],
];

/**
 * The only shape we accept from the model. Nothing from the LLM reaches the
 * repository or the URL without passing through this schema.
 */
export const smartFiltersSchema = z
  .object({
    licenseType: z.enum(licenseTypeValues).optional(),
    jurisdiction: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{2}$/, "jurisdiction must be an ISO-2 code")
      .transform((v) => v.toUpperCase())
      .optional(),
    priceMin: z.number().int().nonnegative().optional(),
    priceMax: z.number().int().nonnegative().optional(),
    keywords: z.array(z.string().trim().min(1).max(80)).max(8).optional(),
  })
  .strict()
  .refine(
    (data) =>
      data.priceMin === undefined ||
      data.priceMax === undefined ||
      data.priceMin <= data.priceMax,
    { message: "priceMin must not exceed priceMax", path: ["priceMin"] },
  );

export type SmartFilters = z.infer<typeof smartFiltersSchema>;

export interface SmartSearchResult {
  filters: SmartFilters;
  /** Human-readable sentence describing the interpretation. */
  explanation: string;
  /** True when the LLM was unavailable or returned something unusable. */
  degraded: boolean;
}

export const smartSearchRequestSchema = z.object({
  query: z
    .string()
    .trim()
    .min(3, "Describe what you are looking for")
    .max(300, "Query is too long"),
});

function price(value: number | undefined): string | null {
  if (value === undefined) return null;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

const COUNTRY_NAMES: Record<string, string> = {
  LT: "Lithuania",
  CY: "Cyprus",
  MT: "Malta",
  EE: "Estonia",
  PL: "Poland",
  SE: "Sweden",
  FI: "Finland",
  CZ: "Czechia",
};

/**
 * Builds the explanation locally from the *validated* filters. Deriving it here
 * instead of asking the model keeps the sentence factual — the model can no
 * longer invent a constraint that is not in the URL.
 */
export function describeFilters(filters: SmartFilters): string {
  const parts: string[] = [];

  if (filters.licenseType) parts.push(`${filters.licenseType} licences`);
  const country = filters.jurisdiction
    ? (COUNTRY_NAMES[filters.jurisdiction] ?? filters.jurisdiction)
    : null;
  if (country) parts.push(`in ${country}`);

  const min = price(filters.priceMin);
  const max = price(filters.priceMax);
  if (min && max) parts.push(`between ${min} and ${max}`);
  else if (max) parts.push(`under ${max}`);
  else if (min) parts.push(`over ${min}`);

  if (filters.keywords?.length) {
    parts.push(`matching "${filters.keywords.join('", "')}"`);
  }

  if (parts.length === 0) return "all published listings";
  const sentence = parts.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1);
}

/** Drops empty keyword arrays so the URL never carries `q=`. */
function normalizeFilters(filters: SmartFilters): SmartFilters {
  const out: SmartFilters = { ...filters };
  if (out.keywords?.length === 0) delete out.keywords;
  return out;
}

/**
 * Serialises filters into the query string the `/assets` page already
 * understands. Keywords become `q` — the same parameter the plain search box
 * uses, so the AI path degrades into the normal one.
 */
export function buildFilterQuery(
  filters: SmartFilters,
  extra: Record<string, string> = {},
): string {
  const params = new URLSearchParams();
  const clean = normalizeFilters(filters);

  if (clean.licenseType) params.set("licenseType", clean.licenseType);
  if (clean.jurisdiction) params.set("jurisdiction", clean.jurisdiction);
  if (clean.priceMin !== undefined)
    params.set("priceMin", String(clean.priceMin));
  if (clean.priceMax !== undefined) {
    params.set("priceMax", String(clean.priceMax));
  }
  if (clean.keywords?.length) params.set("q", clean.keywords.join(" "));

  for (const [key, value] of Object.entries(extra)) {
    params.set(key, value);
  }

  return params.toString();
}
