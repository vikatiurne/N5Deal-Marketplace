import { describe, expect, it } from "vitest";

import { assetFiltersSchema } from "@/lib/validation/assets";

/**
 * The public marketplace reads its whole state from the query string, so this
 * schema is the boundary between untrusted URL input and the repository. These
 * tests cover the awkward shapes a real browser produces: repeated params,
 * comma lists, empty strings from un-ticked filters and out-of-range values.
 */

describe("assetFiltersSchema — empty input", () => {
  it("applies defaults for a bare query string", () => {
    const result = assetFiltersSchema.parse({});
    expect(result).toEqual({ sort: "newest", page: 1 });
    expect(result.licenseType).toBeUndefined();
    expect(result.jurisdiction).toBeUndefined();
    expect(result.priceMin).toBeUndefined();
    expect(result.q).toBeUndefined();
  });

  it("treats empty strings as absent, not as zero or an empty filter", () => {
    const result = assetFiltersSchema.parse({
      licenseType: "",
      jurisdiction: "",
      priceMin: "",
      priceMax: "",
      q: "   ",
    });
    expect(result.priceMin).toBeUndefined();
    expect(result.priceMax).toBeUndefined();
    expect(result.q).toBeUndefined();
    expect(result.licenseType).toBeUndefined();
    expect(result.jurisdiction).toBeUndefined();
  });
});

describe("assetFiltersSchema — licence type", () => {
  it("accepts a single value", () => {
    expect(
      assetFiltersSchema.parse({ licenseType: "EMI" }).licenseType,
    ).toEqual(["EMI"]);
  });

  it("accepts a comma-separated list", () => {
    expect(
      assetFiltersSchema.parse({ licenseType: "EMI,PI,VASP" }).licenseType,
    ).toEqual(["EMI", "PI", "VASP"]);
  });

  it("accepts repeated query params", () => {
    expect(
      assetFiltersSchema.parse({ licenseType: ["EMI", "BANK"] }).licenseType,
    ).toEqual(["EMI", "BANK"]);
  });

  it("trims whitespace around items", () => {
    expect(
      assetFiltersSchema.parse({ licenseType: " EMI , PI " }).licenseType,
    ).toEqual(["EMI", "PI"]);
  });

  it("drops empty items produced by stray commas", () => {
    expect(
      assetFiltersSchema.parse({ licenseType: "EMI,,PI," }).licenseType,
    ).toEqual(["EMI", "PI"]);
  });

  it("rejects an unknown licence", () => {
    expect(() => assetFiltersSchema.parse({ licenseType: "NOPE" })).toThrow();
  });

  it("rejects the whole list when one value is unknown", () => {
    expect(() =>
      assetFiltersSchema.parse({ licenseType: "EMI,NOPE" }),
    ).toThrow();
  });

  it("accepts every documented licence", () => {
    const all = ["EMI", "PI", "MICA_CASP", "VASP", "BANK", "OTHER"].join(",");
    expect(
      assetFiltersSchema.parse({ licenseType: all }).licenseType,
    ).toHaveLength(6);
  });
});

describe("assetFiltersSchema — jurisdiction", () => {
  it("upper-cases lower-case codes", () => {
    expect(
      assetFiltersSchema.parse({ jurisdiction: "lt" }).jurisdiction,
    ).toEqual(["LT"]);
  });

  it("handles a comma list with mixed case", () => {
    expect(
      assetFiltersSchema.parse({ jurisdiction: "lt, cy ,mt" }).jurisdiction,
    ).toEqual(["LT", "CY", "MT"]);
  });

  it("rejects a code that is not two letters", () => {
    const result = assetFiltersSchema.safeParse({ jurisdiction: "LTU" });
    expect(result.success).toBe(false);
  });

  it("rejects a numeric jurisdiction — two digits are not a country", () => {
    // Caught by this suite: `length(2)` used to accept "12" as a valid code.
    const result = assetFiltersSchema.safeParse({ jurisdiction: 12 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(
      "Jurisdiction must be a 2-letter ISO code",
    );
  });

  it("rejects digits mixed with letters", () => {
    expect(assetFiltersSchema.safeParse({ jurisdiction: "L1" }).success).toBe(
      false,
    );
  });

  it("accepts a country code outside the seeded list — new ISO codes need no deploy", () => {
    const result = assetFiltersSchema.safeParse({ jurisdiction: "SI" });
    expect(result.success).toBe(true);
    expect(result.data?.jurisdiction).toEqual(["SI"]);
  });
});

describe("assetFiltersSchema — price", () => {
  it("coerces numeric strings", () => {
    const result = assetFiltersSchema.parse({
      priceMin: "1000",
      priceMax: "5000",
    });
    expect(result.priceMin).toBe(1000);
    expect(result.priceMax).toBe(5000);
  });

  it("accepts 0 as a real bound", () => {
    const result = assetFiltersSchema.parse({ priceMax: "0" });
    expect(result.priceMax).toBe(0);
  });

  it("rejects a negative price", () => {
    expect(() => assetFiltersSchema.parse({ priceMin: "-1" })).toThrow();
  });

  it("rejects a fractional price", () => {
    expect(() => assetFiltersSchema.parse({ priceMax: "10.5" })).toThrow();
  });

  it("rejects non-numeric input", () => {
    expect(() => assetFiltersSchema.parse({ priceMax: "cheap" })).toThrow();
  });

  it("rejects min above max and points at the offending field", () => {
    const result = assetFiltersSchema.safeParse({
      priceMin: "500000",
      priceMax: "100000",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["priceMin"]);
    expect(result.error?.issues[0]?.message).toBe(
      "priceMin must not exceed priceMax",
    );
  });

  it("accepts min equal to max", () => {
    const result = assetFiltersSchema.safeParse({
      priceMin: "100",
      priceMax: "100",
    });
    expect(result.success).toBe(true);
  });

  it("accepts only one bound", () => {
    expect(assetFiltersSchema.safeParse({ priceMin: "100" }).success).toBe(
      true,
    );
    expect(assetFiltersSchema.safeParse({ priceMax: "100" }).success).toBe(
      true,
    );
  });
});

describe("assetFiltersSchema — free text", () => {
  it("trims the query", () => {
    expect(assetFiltersSchema.parse({ q: "  emi  " }).q).toBe("emi");
  });

  it("keeps an inner-space query intact", () => {
    expect(assetFiltersSchema.parse({ q: "emi in lithuania" }).q).toBe(
      "emi in lithuania",
    );
  });

  it("rejects a query longer than 200 characters", () => {
    expect(() => assetFiltersSchema.parse({ q: "a".repeat(201) })).toThrow();
  });

  it("accepts exactly 200 characters", () => {
    expect(assetFiltersSchema.parse({ q: "a".repeat(200) }).q).toHaveLength(
      200,
    );
  });
});

describe("assetFiltersSchema — sort and page", () => {
  it.each(["newest", "price_asc", "price_desc"] as const)(
    "accepts sort=%s",
    (sort) => {
      expect(assetFiltersSchema.parse({ sort }).sort).toBe(sort);
    },
  );

  it("rejects an unknown sort", () => {
    expect(() => assetFiltersSchema.parse({ sort: "cheapest" })).toThrow();
  });

  it("coerces the page number", () => {
    expect(assetFiltersSchema.parse({ page: "3" }).page).toBe(3);
  });

  it("defaults an empty page to 1", () => {
    expect(assetFiltersSchema.parse({ page: "" }).page).toBe(1);
  });

  it("rejects page 0 and page -1", () => {
    expect(() => assetFiltersSchema.parse({ page: "0" })).toThrow();
    expect(() => assetFiltersSchema.parse({ page: "-1" })).toThrow();
  });

  it("rejects a fractional page", () => {
    expect(() => assetFiltersSchema.parse({ page: "1.5" })).toThrow();
  });
});

describe("assetFiltersSchema — full query string from the UI", () => {
  it("parses what the filter bar actually emits", () => {
    // /assets?licenseType=EMI,PI&jurisdiction=LT,EE&priceMax=500000&q=emi&sort=price_asc&page=2
    const result = assetFiltersSchema.parse({
      licenseType: "EMI,PI",
      jurisdiction: "LT,EE",
      priceMax: "500000",
      q: "emi",
      sort: "price_asc",
      page: "2",
    });

    expect(result).toEqual({
      licenseType: ["EMI", "PI"],
      jurisdiction: ["LT", "EE"],
      priceMax: 500000,
      q: "emi",
      sort: "price_asc",
      page: 2,
    });
  });

  it("strips unknown params instead of failing — extra tracking params are harmless", () => {
    const result = assetFiltersSchema.parse({
      licenseType: "EMI",
      utm_source: "newsletter",
      ai: "1",
    });
    expect(result.licenseType).toEqual(["EMI"]);
    expect(result).not.toHaveProperty("utm_source");
  });
});
