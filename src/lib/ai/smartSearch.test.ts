import { describe, expect, it } from "vitest";

import type { LlmClient } from "@/lib/ai/llmClient";
import { parseQuery } from "@/lib/ai/smartSearch";
import {
  buildFilterQuery,
  describeFilters,
  smartFiltersSchema,
} from "@/lib/ai/smartFilters";

/** Returns the canned completion the model would have produced. */
function mockClient(reply: string): LlmClient {
  return async () => reply;
}

/** Simulates a broken provider (timeout, 500, no key). */
const failingClient: LlmClient = async () => {
  throw new Error("LLM responded 503");
};

describe("parseQuery — happy path (mocked client)", () => {
  it("extracts licence, country and a price ceiling", async () => {
    const result = await parseQuery(
      "EMI in Lithuania under 500k",
      mockClient(
        JSON.stringify({
          licenseType: "EMI",
          jurisdiction: "LT",
          priceMax: 500000,
        }),
      ),
    );

    expect(result.filters).toEqual({
      licenseType: "EMI",
      jurisdiction: "LT",
      priceMax: 500000,
    });
    expect(result.degraded).toBe(false);
    expect(result.explanation).toBe("EMI licences in Lithuania under €500,000");
  });

  it("extracts a price range plus keywords", async () => {
    const result = await parseQuery(
      "crypto exchanges in Malta between 1 and 3 million with a tokenization stack",
      mockClient(
        JSON.stringify({
          licenseType: "VASP",
          jurisdiction: "MT",
          priceMin: 1000000,
          priceMax: 3000000,
          keywords: ["tokenization"],
        }),
      ),
    );

    expect(result.filters).toMatchObject({
      licenseType: "VASP",
      jurisdiction: "MT",
      priceMin: 1_000_000,
      priceMax: 3_000_000,
      keywords: ["tokenization"],
    });
    expect(buildFilterQuery(result.filters)).toBe(
      "licenseType=VASP&jurisdiction=MT&priceMin=1000000&priceMax=3000000&q=tokenization",
    );
  });

  it("keeps only the words when the request has no structured constraints", async () => {
    const result = await parseQuery(
      "turnaround opportunities",
      mockClient(JSON.stringify({ keywords: ["turnaround"] })),
    );

    expect(result.filters).toEqual({ keywords: ["turnaround"] });
    expect(result.degraded).toBe(false);
    expect(buildFilterQuery(result.filters)).toBe("q=turnaround");
  });
});

describe("parseQuery — untrusted output", () => {
  it("falls back to keyword search when the model returns prose", async () => {
    const result = await parseQuery(
      "EMI in Lithuania",
      mockClient("Sure! I think you want EMI licences in Lithuania."),
    );

    expect(result.degraded).toBe(true);
    expect(result.filters).toEqual({ keywords: ["EMI in Lithuania"] });
    expect(buildFilterQuery(result.filters)).toBe("q=EMI+in+Lithuania");
  });

  it("rejects invented keys instead of passing them through", async () => {
    const result = await parseQuery(
      "EMI in Lithuania",
      mockClient(
        JSON.stringify({ licenseType: "EMI", admin: true, password: "leak" }),
      ),
    );

    // `.strict()` rejects the whole object, so nothing leaks into the URL.
    expect(result.degraded).toBe(true);
    expect(result.filters).toEqual({ keywords: ["EMI in Lithuania"] });
  });

  it("rejects an invalid licence value", async () => {
    const result = await parseQuery(
      "a licence",
      mockClient(JSON.stringify({ licenseType: "GAMBLING_LICENSE" })),
    );
    expect(result.degraded).toBe(true);
  });

  it("rejects an impossible price range", async () => {
    const result = await parseQuery(
      "something cheap",
      mockClient(JSON.stringify({ priceMin: 900_000, priceMax: 100_000 })),
    );
    expect(result.degraded).toBe(true);
  });

  it("normalises a lowercase jurisdiction and strips code fences", async () => {
    const result = await parseQuery(
      "payment institutions in estonia",
      mockClient('```json\n{"licenseType":"PI","jurisdiction":"ee"}\n```'),
    );
    expect(result.filters).toEqual({ licenseType: "PI", jurisdiction: "EE" });
    expect(result.degraded).toBe(false);
  });

  it("treats an empty but valid object as unusable", async () => {
    const result = await parseQuery("hello there", mockClient("{}"));
    expect(result.degraded).toBe(true);
    expect(result.filters).toEqual({ keywords: ["hello there"] });
  });

  it("degrades gracefully when the provider throws", async () => {
    const result = await parseQuery(
      "EMI in Lithuania under 500k",
      failingClient,
    );
    expect(result.degraded).toBe(true);
    expect(result.filters).toEqual({
      keywords: ["EMI in Lithuania under 500k"],
    });
  });

  it("degrades when no client is available at all (no API key)", async () => {
    const result = await parseQuery("EMI in Lithuania");
    expect(result.degraded).toBe(true);
    expect(result.filters).toEqual({ keywords: ["EMI in Lithuania"] });
  });

  it("ignores queries below the minimum length", async () => {
    const result = await parseQuery("ab", mockClient("{}"));
    expect(result.filters).toEqual({});
    expect(result.explanation).toBe("all published listings");
  });
});

describe("describeFilters", () => {
  it("describes each supported shape", () => {
    expect(describeFilters({ licenseType: "BANK", jurisdiction: "PL" })).toBe(
      "BANK licences in Poland",
    );
    expect(describeFilters({ priceMin: 250_000 })).toBe("Over €250,000");
    expect(describeFilters({ priceMin: 100_000, priceMax: 200_000 })).toBe(
      "Between €100,000 and €200,000",
    );
    expect(describeFilters({})).toBe("all published listings");
    expect(describeFilters({ keywords: ["acquiring", "turnaround"] })).toBe(
      'Matching "acquiring", "turnaround"',
    );
  });

  it("falls back to the raw code for countries without a name map", () => {
    expect(describeFilters({ jurisdiction: "DE" })).toBe("In DE");
  });
});

describe("smartFiltersSchema", () => {
  it("accepts an empty object", () => {
    expect(smartFiltersSchema.parse({})).toEqual({});
  });

  it("rejects a non-integer price", () => {
    expect(smartFiltersSchema.safeParse({ priceMax: 1.5 }).success).toBe(false);
  });

  it("rejects a three-letter jurisdiction", () => {
    expect(smartFiltersSchema.safeParse({ jurisdiction: "LTU" }).success).toBe(
      false,
    );
  });
});
