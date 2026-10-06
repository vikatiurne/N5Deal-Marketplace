import { describe, expect, it } from "vitest";

import {
  assetFormSchema,
  assetStatusActionSchema,
  buyerSearchSchema,
  markReadSchema,
  saveIntentSchema,
  sellerMessageSchema,
} from "@/lib/validation/seller";

const validAsset = {
  title: "Cyprus EMI with a crypto on-ramp",
  licenseType: "EMI" as const,
  jurisdiction: "CY" as const,
  price: "1250000",
  currency: "EUR" as const,
  description:
    "Established electronic money institution holding an EU settlement licence and a VASP partnership.",
};

describe("assetFormSchema", () => {
  it("accepts a complete listing", () => {
    const result = assetFormSchema.parse(validAsset);
    expect(result.price).toBe(1_250_000);
    expect(result.currency).toBe("EUR");
  });

  it("treats an empty price as 'price on request', not zero", () => {
    const result = assetFormSchema.parse({ ...validAsset, price: "" });
    expect(result.price).toBeUndefined();
  });

  it("accepts an explicit 0 price", () => {
    expect(assetFormSchema.parse({ ...validAsset, price: "0" }).price).toBe(0);
  });

  it("rejects a negative price with the domain message", () => {
    expect(
      assetFormSchema.safeParse({ ...validAsset, price: "-1" }).error?.issues[0]
        ?.message,
    ).toBe("Price cannot be negative");
  });

  it("requires a title of at least 5 characters", () => {
    expect(
      assetFormSchema.safeParse({ ...validAsset, title: "EMI" }).error
        ?.issues[0]?.message,
    ).toBe("Title must be at least 5 characters");
  });

  it("caps the title at 120 characters", () => {
    expect(
      assetFormSchema.safeParse({ ...validAsset, title: "a".repeat(121) })
        .success,
    ).toBe(false);
    expect(
      assetFormSchema.safeParse({ ...validAsset, title: "a".repeat(120) })
        .success,
    ).toBe(true);
  });

  it("requires a description of at least 40 characters", () => {
    expect(
      assetFormSchema.safeParse({ ...validAsset, description: "short" }).error
        ?.issues[0]?.message,
    ).toBe("Description must be at least 40 characters");
  });

  it("counts the trimmed description length", () => {
    expect(
      assetFormSchema.safeParse({
        ...validAsset,
        description: `  ${"x".repeat(45)}  `,
      }).success,
    ).toBe(true);
  });

  it("only allows the three supported currencies", () => {
    expect(
      assetFormSchema.safeParse({ ...validAsset, currency: "GBP" }).success,
    ).toBe(true);
    expect(
      assetFormSchema.safeParse({ ...validAsset, currency: "BTC" }).success,
    ).toBe(false);
  });

  it("rejects an unsupported jurisdiction", () => {
    expect(
      assetFormSchema.safeParse({ ...validAsset, jurisdiction: "US" }).success,
    ).toBe(false);
  });

  it("rejects an unsupported licence type", () => {
    expect(
      assetFormSchema.safeParse({ ...validAsset, licenseType: "FUND" }).success,
    ).toBe(false);
  });
});

describe("saveIntentSchema", () => {
  it("accepts draft and publish", () => {
    expect(saveIntentSchema.parse("draft")).toBe("draft");
    expect(saveIntentSchema.parse("publish")).toBe("publish");
  });

  it("rejects anything else — the button value is user-controllable", () => {
    expect(() => saveIntentSchema.parse("delete")).toThrow();
    expect(() => saveIntentSchema.parse("")).toThrow();
  });
});

describe("assetStatusActionSchema", () => {
  it("accepts every asset status", () => {
    for (const status of ["DRAFT", "PUBLISHED", "PAUSED", "REMOVED"]) {
      expect(
        assetStatusActionSchema.safeParse({ id: "a-1", status }).success,
      ).toBe(true);
    }
  });

  it("requires an id", () => {
    expect(
      assetStatusActionSchema.safeParse({ id: "", status: "PAUSED" }).error
        ?.issues[0]?.message,
    ).toBe("Missing asset");
  });

  it("rejects an unknown status", () => {
    expect(
      assetStatusActionSchema.safeParse({ id: "a-1", status: "DELETED" })
        .success,
    ).toBe(false);
  });
});

describe("buyerSearchSchema", () => {
  it("accepts the filters the seller search bar emits", () => {
    const result = buyerSearchSchema.parse({
      q: "  lithuania ",
      jurisdiction: "lt,ee",
      licenseType: "EMI",
      budgetMin: "",
      budgetMax: "2500000",
      page: "2",
    });
    expect(result).toEqual({
      q: "lithuania",
      jurisdiction: ["LT", "EE"],
      licenseType: ["EMI"],
      budgetMin: undefined,
      budgetMax: 2_500_000,
      page: 2,
    });
  });

  it("defaults an empty query to undefined", () => {
    expect(buyerSearchSchema.parse({ q: "   " }).q).toBeUndefined();
  });

  it("defaults the page to 1", () => {
    expect(buyerSearchSchema.parse({}).page).toBe(1);
  });

  it("rejects an unknown licence in a comma list", () => {
    expect(
      buyerSearchSchema.safeParse({ licenseType: "EMI,NOPE" }).success,
    ).toBe(false);
  });

  it("rejects a negative budget floor", () => {
    expect(
      buyerSearchSchema.safeParse({ budgetMin: "-1" }).error?.issues[0]
        ?.message,
    ).toBe("Value cannot be negative");
  });

  it("rejects page 0", () => {
    expect(buyerSearchSchema.safeParse({ page: "0" }).success).toBe(false);
  });
});

describe("sellerMessageSchema", () => {
  it("accepts a contact message", () => {
    const result = sellerMessageSchema.parse({
      buyerId: "buyer-1",
      assetId: "asset-1",
      message:
        "We can share the licence file under NDA — who should we talk to?",
    });
    expect(result.buyerId).toBe("buyer-1");
  });

  it("requires both ids", () => {
    const result = sellerMessageSchema.safeParse({
      buyerId: "",
      assetId: "",
      message: "x".repeat(25),
    });
    expect(result.error?.issues.map((i) => i.path[0])).toEqual([
      "buyerId",
      "assetId",
    ]);
  });

  it("requires a message of at least 20 characters", () => {
    expect(
      sellerMessageSchema.safeParse({
        buyerId: "b-1",
        assetId: "a-1",
        message: "hi",
      }).error?.issues[0]?.message,
    ).toBe("Message must be at least 20 characters");
  });
});

describe("markReadSchema", () => {
  it("accepts a non-empty list of ids", () => {
    expect(markReadSchema.parse({ inquiryIds: ["a", "b"] }).inquiryIds).toEqual(
      ["a", "b"],
    );
  });

  it("refuses an empty list — marking nothing read is a no-op, not an action", () => {
    expect(
      markReadSchema.safeParse({ inquiryIds: [] }).error?.issues[0]?.message,
    ).toBe("Nothing to mark as read");
  });

  it("rejects an empty id inside the list", () => {
    expect(markReadSchema.safeParse({ inquiryIds: ["a", ""] }).success).toBe(
      false,
    );
  });
});
