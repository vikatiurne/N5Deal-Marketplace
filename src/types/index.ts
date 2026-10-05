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

/** Paginated list result shared by repository list functions. */
export interface Paged<T> {
  items: T[];
  total: number;
}
