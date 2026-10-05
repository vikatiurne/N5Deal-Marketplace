import type { BuyerProfile, LicenseType } from "@/types";

export interface ProfileCompleteness {
  percent: number;
  filled: number;
  total: number;
  /** Human labels of the still-missing fields — drives the dashboard hint. */
  missing: string[];
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Five criteria decide "can this buyer be matched": company, jurisdictions,
 * license types, budget and a description. Kept pure so it is unit-testable.
 */
export function computeProfileCompleteness(input: {
  company: string | null;
  profile: BuyerProfile | null;
}): ProfileCompleteness {
  const { company, profile } = input;

  const checks: Array<{ label: string; done: boolean }> = [
    { label: "Company", done: hasText(company) },
    { label: "Jurisdictions", done: (profile?.jurisdictions.length ?? 0) > 0 },
    { label: "License types", done: (profile?.licenseTypes.length ?? 0) > 0 },
    {
      label: "Budget",
      done: profile?.budgetMin != null || profile?.budgetMax != null,
    },
    { label: "Description", done: hasText(profile?.description) },
  ];

  const filled = checks.filter((check) => check.done).length;

  return {
    percent: Math.round((filled / checks.length) * 100),
    filled,
    total: checks.length,
    missing: checks.filter((check) => !check.done).map((check) => check.label),
  };
}

export interface MatchCriteria {
  jurisdiction?: string[];
  licenseType?: LicenseType[];
  priceMin?: number;
  priceMax?: number;
}

/**
 * Turns a buyer profile into asset filters: jurisdiction ∩, licenseType ∩,
 * price inside the budget. Empty criteria are omitted so a half-filled profile
 * still returns results instead of nothing.
 */
export function buildMatchCriteria(
  profile: BuyerProfile | null,
): MatchCriteria {
  if (!profile) return {};

  const jurisdictions = [...new Set(profile.jurisdictions)].filter(
    (code) => code.length > 0,
  );
  const licenseTypes = [...new Set(profile.licenseTypes)];

  return {
    ...(jurisdictions.length > 0 ? { jurisdiction: jurisdictions } : {}),
    ...(licenseTypes.length > 0 ? { licenseType: licenseTypes } : {}),
    ...(profile.budgetMin != null ? { priceMin: profile.budgetMin } : {}),
    ...(profile.budgetMax != null ? { priceMax: profile.budgetMax } : {}),
  };
}

/** Human-readable summary of what the dashboard assets were matched on. */
export function describeCriteria(criteria: MatchCriteria): string[] {
  const parts: string[] = [];
  if (criteria.jurisdiction?.length)
    parts.push(`jurisdiction ${criteria.jurisdiction.join(", ")}`);
  if (criteria.licenseType?.length)
    parts.push(`license ${criteria.licenseType.join(", ")}`);
  if (criteria.priceMin != null)
    parts.push(`from €${criteria.priceMin.toLocaleString("en-IE")}`);
  if (criteria.priceMax != null)
    parts.push(`up to €${criteria.priceMax.toLocaleString("en-IE")}`);
  return parts;
}
