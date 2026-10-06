import { describe, expect, it } from "vitest";

import { buyerProfileSchema, inquirySchema } from "@/lib/validation/buyer";

const validProfile = {
  company: "Baltic Capital Partners",
  jurisdictions: ["LT", "EE"],
  licenseTypes: ["EMI", "MICA_CASP"],
  budgetMin: "1000000",
  budgetMax: "5000000",
  description:
    "Looking for an established EMI in the Baltics with passporting rights across the EEA.",
};

describe("buyerProfileSchema — happy path", () => {
  it("accepts and coerces a complete profile", () => {
    const result = buyerProfileSchema.parse(validProfile);
    expect(result.jurisdictions).toEqual(["LT", "EE"]);
    expect(result.budgetMin).toBe(1_000_000);
    expect(result.budgetMax).toBe(5_000_000);
  });

  it("treats an empty budget as 'not set' rather than zero", () => {
    const result = buyerProfileSchema.parse({
      ...validProfile,
      budgetMin: "",
      budgetMax: "",
    });
    expect(result.budgetMin).toBeUndefined();
    expect(result.budgetMax).toBeUndefined();
  });

  it("accepts a profile with only the mandatory fields", () => {
    const result = buyerProfileSchema.safeParse({
      company: "Acme",
      jurisdictions: ["LT"],
      licenseTypes: ["EMI"],
      description: "x".repeat(25),
    });
    expect(result.success).toBe(true);
  });

  it("allows a 0 budget floor", () => {
    const result = buyerProfileSchema.safeParse({
      ...validProfile,
      budgetMin: "0",
    });
    expect(result.success).toBe(true);
    expect(result.data?.budgetMin).toBe(0);
  });
});

describe("buyerProfileSchema — required selections", () => {
  it("requires at least one jurisdiction", () => {
    const result = buyerProfileSchema.safeParse({
      ...validProfile,
      jurisdictions: [],
    });
    expect(result.error?.issues[0]?.message).toBe(
      "Select at least one jurisdiction",
    );
  });

  it("requires at least one licence type", () => {
    const result = buyerProfileSchema.safeParse({
      ...validProfile,
      licenseTypes: [],
    });
    expect(result.error?.issues[0]?.message).toBe(
      "Select at least one license type",
    );
  });

  it("rejects an unsupported jurisdiction", () => {
    expect(
      buyerProfileSchema.safeParse({ ...validProfile, jurisdictions: ["XX"] })
        .success,
    ).toBe(false);
  });

  it("rejects an unsupported licence type", () => {
    expect(
      buyerProfileSchema.safeParse({
        ...validProfile,
        licenseTypes: ["MORTGAGE"],
      }).success,
    ).toBe(false);
  });
});

describe("buyerProfileSchema — text limits", () => {
  it("requires a company name of at least 2 characters", () => {
    expect(
      buyerProfileSchema.safeParse({ ...validProfile, company: "A" }).error
        ?.issues[0]?.message,
    ).toBe("Company must be at least 2 characters");
  });

  it("caps the company name at 120 characters", () => {
    expect(
      buyerProfileSchema.safeParse({
        ...validProfile,
        company: "a".repeat(121),
      }).success,
    ).toBe(false);
  });

  it("requires at least 20 characters of interest description", () => {
    const result = buyerProfileSchema.safeParse({
      ...validProfile,
      description: "too short",
    });
    expect(result.error?.issues[0]?.message).toBe(
      "Describe your interests in at least 20 characters",
    );
  });

  it("counts the trimmed length, not the padded one", () => {
    const result = buyerProfileSchema.safeParse({
      ...validProfile,
      description: `   ${"x".repeat(25)}   `,
    });
    expect(result.success).toBe(true);
  });

  it("caps the description at 2000 characters", () => {
    expect(
      buyerProfileSchema.safeParse({
        ...validProfile,
        description: "x".repeat(2001),
      }).success,
    ).toBe(false);
  });
});

describe("buyerProfileSchema — budget range", () => {
  it("rejects a minimum above the maximum and points at budgetMin", () => {
    const result = buyerProfileSchema.safeParse({
      ...validProfile,
      budgetMin: "5000000",
      budgetMax: "1000000",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["budgetMin"]);
  });

  it("accepts equal bounds", () => {
    expect(
      buyerProfileSchema.safeParse({
        ...validProfile,
        budgetMin: "1000",
        budgetMax: "1000",
      }).success,
    ).toBe(true);
  });

  it("rejects a negative budget", () => {
    expect(
      buyerProfileSchema.safeParse({ ...validProfile, budgetMin: "-5" }).error
        ?.issues[0]?.message,
    ).toBe("Budget cannot be negative");
  });

  it("validates the range even when only one bound is given", () => {
    expect(
      buyerProfileSchema.safeParse({
        ...validProfile,
        budgetMin: "10",
        budgetMax: undefined,
      }).success,
    ).toBe(true);
  });
});

describe("inquirySchema", () => {
  it("accepts a message of at least 20 characters", () => {
    const result = inquirySchema.parse({
      assetId: "asset-123",
      message: "We can share the audited statements under NDA.",
    });
    expect(result.assetId).toBe("asset-123");
  });

  it("requires an asset id", () => {
    const result = inquirySchema.safeParse({
      assetId: "",
      message: "x".repeat(25),
    });
    expect(result.error?.issues[0]?.message).toBe("Missing asset");
  });

  it("requires a message of at least 20 characters", () => {
    const result = inquirySchema.safeParse({
      assetId: "a-1",
      message: "too short",
    });
    expect(result.error?.issues[0]?.message).toBe(
      "Message must be at least 20 characters",
    );
  });

  it("counts the trimmed length", () => {
    expect(
      inquirySchema.safeParse({
        assetId: "a-1",
        message: `   ${"x".repeat(25)}  `,
      }).success,
    ).toBe(true);
  });

  it("caps the message at 2000 characters", () => {
    expect(
      inquirySchema.safeParse({ assetId: "a-1", message: "x".repeat(2001) })
        .success,
    ).toBe(false);
  });

  it("rejects an oversized asset id", () => {
    expect(
      inquirySchema.safeParse({
        assetId: "a".repeat(65),
        message: "x".repeat(25),
      }).success,
    ).toBe(false);
  });
});
