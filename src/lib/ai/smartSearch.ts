import type { LlmClient } from "./llmClient";
import {
  describeFilters,
  smartFiltersSchema,
  type SmartFilters,
  type SmartSearchResult,
} from "./smartFilters";

/**
 * Server-side natural-language → filter parser. Pulling in this module drags
 * the LLM client along, so it must never be reachable from a client component:
 * only the route handler and the unit tests import it. Anything the browser
 * needs (schemas, URL building) lives in `smartFilters.ts`.
 */

/** Raw completion provider — the only seam a test needs to replace. */
export type { LlmClient } from "./llmClient";

export const SMART_SEARCH_SYSTEM_PROMPT = `You translate a buyer's natural-language request into marketplace search filters.

Return ONE JSON object and nothing else. No prose, no markdown, no code fences.

Schema (all keys optional, never invent keys that are absent from the request):
{
  "licenseType": "EMI" | "PI" | "MICA_CASP" | "VASP" | "BANK" | "OTHER",
  "jurisdiction": "ISO-2 country code, e.g. LT",
  "priceMin": <integer, whole EUR>,
  "priceMax": <integer, whole EUR>,
  "keywords": ["<short title/description terms>"]
}

Rules:
- licenseType: only when the request names a licence ("EMI", "payment institution" -> "PI", "MiCA"/"CASP"/"token" -> "MICA_CASP", "VASP"/"crypto exchange" -> "VASP", "bank" -> "BANK").
- jurisdiction: ISO-2 code for the named country ("Lithuania" -> "LT").
- prices: whole euros, no currency symbols or separators ("under 500k" -> "priceMax": 500000, "1-3 million" -> priceMin 1000000, priceMax 3000000). Use only priceMax for "under/at most", only priceMin for "over/at least".
- keywords: 1-4 short search terms that would appear in a listing title or description. Omit the keywords if the request is fully covered by the structured fields.
- If the request says nothing searchable, return {}.`;

/** The graceful-degradation path: treat the whole query as free text. */
function fallback(query: string): SmartSearchResult {
  return {
    filters: { keywords: [query] },
    explanation: `all listings matching "${query}" (AI parsing unavailable)`,
    degraded: true,
  };
}

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

/**
 * Turns a natural-language request into marketplace filters.
 *
 * The LLM is treated as an untrusted source: its output is stripped of code
 * fences and Zod-parsed, and anything unexpected (bad JSON, extra keys,
 * impossible price range, thrown error, missing key) degrades to a keyword
 * search instead of propagating.
 *
 * @param client Injectable provider — defaults to the configured LLM.
 */
export async function parseQuery(
  query: string,
  client?: LlmClient,
): Promise<SmartSearchResult> {
  const trimmed = query.trim();

  if (trimmed.length < 3) {
    // Defensive only — the API route rejects short queries with a 400 first.
    // A two-character string is not worth a keyword search either.
    return {
      filters: {},
      explanation: "all published listings",
      degraded: true,
    };
  }

  const complete = client ?? (await createDefaultClient());
  if (!complete) return fallback(trimmed);

  let raw: string;
  try {
    raw = await complete({
      system: SMART_SEARCH_SYSTEM_PROMPT,
      user: trimmed,
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[smart-search] LLM call failed:", error);
    }
    return fallback(trimmed);
  }

  // Dev-only: the raw completion is the only thing worth debugging when the
  // interpretation looks wrong. Never logged in production.
  if (process.env.NODE_ENV !== "production") {
    console.debug(
      `[smart-search] raw response for ${JSON.stringify(trimmed)}:`,
      raw,
    );
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(stripCodeFences(raw));
  } catch {
    return fallback(trimmed);
  }

  const parsed = smartFiltersSchema.safeParse(parsedJson);
  if (!parsed.success) return fallback(trimmed);

  const filters: SmartFilters = parsed.data;
  if (Object.keys(filters).length === 0) {
    // Valid but empty — treat as "no idea", which is still a usable search.
    return {
      filters: { keywords: [trimmed] },
      explanation: `all listings matching "${trimmed}"`,
      degraded: true,
    };
  }

  return { filters, explanation: describeFilters(filters), degraded: false };
}

/**
 * Lazily imported so the module stays testable without an API key: the client
 * factory is only needed on the real request path.
 */
async function createDefaultClient(): Promise<LlmClient | null> {
  const { createLlmClient } = await import("./llmClient");
  return createLlmClient();
}
