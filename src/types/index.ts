// Const objects instead of TypeScript enums (erasableSyntaxOnly).
// String values mirror the Prisma enums in prisma/schema.prisma.

export const Role = {
  BUYER: "BUYER",
  SELLER: "SELLER",
  MANAGER: "MANAGER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const UserStatus = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  DELETED: "DELETED",
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const AssetStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  PAUSED: "PAUSED",
  REMOVED: "REMOVED",
} as const;
export type AssetStatus = (typeof AssetStatus)[keyof typeof AssetStatus];

export const LicenseType = {
  EMI: "EMI",
  PI: "PI",
  MICA_CASP: "MICA_CASP",
  VASP: "VASP",
  BANK: "BANK",
  OTHER: "OTHER",
} as const;
export type LicenseType = (typeof LicenseType)[keyof typeof LicenseType];

/** Closed set of manager moderation actions — mirrors the Prisma enum. */
export const AuditAction = {
  USER_SUSPENDED: "USER_SUSPENDED",
  USER_REACTIVED: "USER_REACTIVED",
  USER_SOFT_DELETED: "USER_SOFT_DELETED",
  ASSET_PUBLISHED: "ASSET_PUBLISHED",
  ASSET_PAUSED: "ASSET_PAUSED",
  ASSET_REMOVED: "ASSET_REMOVED",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const AuditTargetType = {
  USER: "USER",
  ASSET: "ASSET",
} as const;
export type AuditTargetType =
  (typeof AuditTargetType)[keyof typeof AuditTargetType];

/**
 * ISO country codes offered in filters and profile forms. Curated to the
 * markets the seed data and the public listing filters cover.
 */
export const JURISDICTIONS = [
  "LT",
  "CY",
  "MT",
  "EE",
  "PL",
  "SE",
  "FI",
  "CZ",
] as const;
export type Jurisdiction = (typeof JURISDICTIONS)[number];

/** Plain domain objects — repositories return these, never Prisma rows. */
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  displayName: string;
  company: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BuyerProfile {
  userId: string;
  jurisdictions: string[];
  licenseTypes: LicenseType[];
  budgetMin: number | null;
  budgetMax: number | null;
  description: string | null;
}

export interface Asset {
  id: string;
  sellerId: string;
  title: string;
  licenseType: LicenseType;
  jurisdiction: string;
  price: number | null;
  currency: string;
  description: string;
  status: AssetStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Inquiry {
  id: string;
  assetId: string;
  buyerId: string;
  /** BUYER: buyer → seller. SELLER: seller → buyer. */
  initiatorRole: Role;
  message: string;
  readAt: Date | null;
  createdAt: Date;
}

/** User without secrets — safe to hand to admin views and client components. */
export type UserPreview = Omit<User, "passwordHash">;

/** Paginated list result shared by repository list functions. */
export interface Paged<T> {
  items: T[];
  total: number;
}

/**
 * Append-only moderation trail. `meta` is a JSON-encoded string at rest and
 * is parsed into `details` for the UI.
 */
export interface AuditEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  actorDisplayName: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId: string;
  /** Human-readable target snapshot — audit rows must stay readable after the
   * target is renamed or (soft-)deleted. */
  targetLabel: string;
  meta: string | null;
  details: Record<string, string> | null;
  createdAt: Date;
}
