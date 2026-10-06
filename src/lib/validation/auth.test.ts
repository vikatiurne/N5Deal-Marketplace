import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "@/lib/validation/auth";

describe("loginSchema", () => {
  it("accepts a normal sign-in", () => {
    const result = loginSchema.parse({
      email: "buyer1@n5deal.test",
      password: "password123",
    });
    expect(result.email).toBe("buyer1@n5deal.test");
  });

  it("normalises the email so lookups are case-insensitive", () => {
    expect(
      loginSchema.parse({ email: "  Buyer1@N5Deal.Test ", password: "x" })
        .email,
    ).toBe("buyer1@n5deal.test");
  });

  it("rejects a malformed email", () => {
    expect(() =>
      loginSchema.parse({ email: "not-an-email", password: "x" }),
    ).toThrow("Enter a valid email");
  });

  it("rejects an empty password with the required message", () => {
    const result = loginSchema.safeParse({ email: "a@b.co", password: "" });
    expect(result.error?.issues[0]?.message).toBe("Password is required");
  });

  it("rejects an empty email", () => {
    expect(loginSchema.safeParse({ email: "", password: "x" }).success).toBe(
      false,
    );
  });

  it("drops keys the schema does not declare", () => {
    const result = loginSchema.parse({
      email: "a@b.co",
      password: "x",
      isManager: true,
    });
    expect(result).toEqual({ email: "a@b.co", password: "x" });
  });
});

describe("registerSchema", () => {
  const valid = {
    email: "New.User@Example.com",
    password: "longenough",
    displayName: "New Seller",
    role: "SELLER" as const,
  };

  it("accepts a valid buyer registration", () => {
    const result = registerSchema.parse({ ...valid, role: "BUYER" });
    expect(result.email).toBe("new.user@example.com");
    expect(result.displayName).toBe("New Seller");
  });

  it("accepts a valid seller registration", () => {
    expect(registerSchema.parse(valid).role).toBe("SELLER");
  });

  it("refuses to self-register as MANAGER — the platform role is not open", () => {
    const result = registerSchema.safeParse({ ...valid, role: "MANAGER" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown role", () => {
    expect(registerSchema.safeParse({ ...valid, role: "ADMIN" }).success).toBe(
      false,
    );
  });

  it("requires a password of at least 8 characters", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "short12" }).error
        ?.issues[0]?.message,
    ).toBe("Password must be at least 8 characters");
  });

  it("accepts exactly 8 characters", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "12345678" }).success,
    ).toBe(true);
  });

  it("requires a display name of at least 2 characters", () => {
    expect(
      registerSchema.safeParse({ ...valid, displayName: "A" }).error?.issues[0]
        ?.message,
    ).toBe("Display name must be at least 2 characters");
  });

  it("caps the display name at 80 characters", () => {
    expect(
      registerSchema.safeParse({ ...valid, displayName: "a".repeat(81) })
        .success,
    ).toBe(false);
    expect(
      registerSchema.safeParse({ ...valid, displayName: "a".repeat(80) })
        .success,
    ).toBe(true);
  });

  it("trims the display name", () => {
    expect(
      registerSchema.parse({ ...valid, displayName: "  Ada  " }).displayName,
    ).toBe("Ada");
  });

  it("rejects a whitespace-only display name", () => {
    expect(
      registerSchema.safeParse({ ...valid, displayName: "   " }).success,
    ).toBe(false);
  });

  it("reports every problem at once so the form can show all of them", () => {
    const result = registerSchema.safeParse({
      email: "bad",
      password: "1",
      displayName: "",
      role: "MANAGER",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBeGreaterThanOrEqual(3);
  });
});
