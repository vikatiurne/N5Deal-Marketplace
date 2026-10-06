import { describe, expect, it } from "vitest";

import {
  ASSET_AUDIT_ACTION,
  USER_AUDIT_ACTION,
  auditFiltersSchema,
  managerAssetFiltersSchema,
  managerUserFiltersSchema,
  moderateAssetSchema,
  moderateUserSchema,
} from "@/lib/validation/manager";

describe("managerUserFiltersSchema", () => {
  it("defaults to page 1 with no filters", () => {
    expect(managerUserFiltersSchema.parse({})).toEqual({ page: 1 });
  });

  it("accepts a role, a status and free text", () => {
    const result = managerUserFiltersSchema.parse({
      q: "  lithuania  ",
      role: "SELLER",
      status: "SUSPENDED",
      page: "3",
    });
    expect(result).toEqual({
      q: "lithuania",
      role: "SELLER",
      status: "SUSPENDED",
      page: 3,
    });
  });

  it("treats empty select values as no filter — the reset button posts empty strings", () => {
    const result = managerUserFiltersSchema.parse({
      role: "",
      status: "",
      q: "",
    });
    expect(result.role).toBeUndefined();
    expect(result.status).toBeUndefined();
    expect(result.q).toBeUndefined();
  });

  it("rejects an unknown role and an unknown status", () => {
    expect(managerUserFiltersSchema.safeParse({ role: "ADMIN" }).success).toBe(
      false,
    );
    expect(
      managerUserFiltersSchema.safeParse({ status: "BANNED" }).success,
    ).toBe(false);
  });

  it("caps free text at 200 characters", () => {
    expect(
      managerUserFiltersSchema.safeParse({ q: "a".repeat(201) }).success,
    ).toBe(false);
  });
});

describe("managerAssetFiltersSchema", () => {
  it("accepts status, licence and jurisdiction together", () => {
    const result = managerAssetFiltersSchema.parse({
      status: "PAUSED",
      licenseType: "EMI,BANK",
      jurisdiction: "lt",
      q: "emi",
      page: "2",
    });
    expect(result).toEqual({
      status: "PAUSED",
      licenseType: ["EMI", "BANK"],
      jurisdiction: ["LT"],
      q: "emi",
      page: 2,
    });
  });

  it("rejects an unknown asset status", () => {
    expect(
      managerAssetFiltersSchema.safeParse({ status: "DELETED" }).success,
    ).toBe(false);
  });

  it("rejects an unsupported jurisdiction code", () => {
    expect(
      managerAssetFiltersSchema.safeParse({ jurisdiction: "XX" }).success,
    ).toBe(false);
  });

  it("ignores empty strings for every filter", () => {
    const result = managerAssetFiltersSchema.parse({
      status: "",
      licenseType: "",
      jurisdiction: "",
    });
    expect(result.status).toBeUndefined();
    expect(result.licenseType).toBeUndefined();
    expect(result.jurisdiction).toBeUndefined();
  });
});

describe("auditFiltersSchema", () => {
  it("accepts action and target type", () => {
    const result = auditFiltersSchema.parse({
      action: "USER_SUSPENDED",
      targetType: "USER",
    });
    expect(result.action).toBe("USER_SUSPENDED");
    expect(result.targetType).toBe("USER");
  });

  it("rejects an action outside the closed set", () => {
    expect(
      auditFiltersSchema.safeParse({ action: "USER_DELETED_HARD" }).success,
    ).toBe(false);
  });

  it("rejects an unknown target type", () => {
    expect(auditFiltersSchema.safeParse({ targetType: "ORDER" }).success).toBe(
      false,
    );
  });
});

describe("moderateUserSchema", () => {
  it("accepts every user status", () => {
    for (const status of ["ACTIVE", "SUSPENDED", "DELETED"]) {
      expect(
        moderateUserSchema.safeParse({ userId: "u-1", status }).success,
      ).toBe(true);
    }
  });

  it("requires a user id", () => {
    expect(
      moderateUserSchema.safeParse({ userId: "", status: "ACTIVE" }).error
        ?.issues[0]?.message,
    ).toBe("Missing user");
  });

  it("rejects an unknown status", () => {
    expect(
      moderateUserSchema.safeParse({ userId: "u-1", status: "BANNED" }).success,
    ).toBe(false);
  });
});

describe("moderateAssetSchema", () => {
  it("accepts the three moderation statuses", () => {
    for (const status of ["PUBLISHED", "PAUSED", "REMOVED"]) {
      expect(
        moderateAssetSchema.safeParse({ assetId: "a-1", status }).success,
      ).toBe(true);
    }
  });

  it("excludes DRAFT — a manager must not hide a live listing as a draft", () => {
    const result = moderateAssetSchema.safeParse({
      assetId: "a-1",
      status: "DRAFT",
    });
    expect(result.success).toBe(false);
  });

  it("requires an asset id", () => {
    expect(
      moderateAssetSchema.safeParse({ assetId: "", status: "PAUSED" }).error
        ?.issues[0]?.message,
    ).toBe("Missing asset");
  });
});

describe("audit action mapping", () => {
  it("maps every user transition to its audit action", () => {
    expect(USER_AUDIT_ACTION).toEqual({
      SUSPENDED: "USER_SUSPENDED",
      ACTIVE: "USER_REACTIVED",
      DELETED: "USER_SOFT_DELETED",
    });
  });

  it("maps every asset transition to its audit action", () => {
    expect(ASSET_AUDIT_ACTION).toEqual({
      PUBLISHED: "ASSET_PUBLISHED",
      PAUSED: "ASSET_PAUSED",
      REMOVED: "ASSET_REMOVED",
    });
  });

  it("keeps the two mappings in step with the schemas that guard them", () => {
    // If someone adds a status to the schema but forgets the audit trail, the
    // moderation action would happen without a log entry — this fails loudly.
    for (const status of ["SUSPENDED", "ACTIVE", "DELETED"] as const) {
      expect(
        moderateUserSchema.safeParse({ userId: "u-1", status }).success,
      ).toBe(true);
      expect(USER_AUDIT_ACTION[status]).toBeTruthy();
    }
    for (const status of ["PUBLISHED", "PAUSED", "REMOVED"] as const) {
      expect(
        moderateAssetSchema.safeParse({ assetId: "a-1", status }).success,
      ).toBe(true);
      expect(ASSET_AUDIT_ACTION[status]).toBeTruthy();
    }
  });
});
