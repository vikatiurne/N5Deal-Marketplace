import { z } from "zod";

import {
  AssetStatus,
  AuditAction,
  AuditTargetType,
  JURISDICTIONS,
  LicenseType,
  Role,
  UserStatus,
} from "@/types";

const roleValues = Object.values(Role) as [Role, ...Role[]];
const userStatusValues = Object.values(UserStatus) as [
  UserStatus,
  ...UserStatus[],
];
const assetStatusValues = Object.values(AssetStatus) as [
  AssetStatus,
  ...AssetStatus[],
];
const auditActionValues = Object.values(AuditAction) as [
  AuditAction,
  ...AuditAction[],
];
const auditTargetValues = Object.values(AuditTargetType) as [
  AuditTargetType,
  ...AuditTargetType[],
];
const licenseTypeValues = Object.values(LicenseType) as [
  LicenseType,
  ...LicenseType[],
];
const jurisdictionValues = [...JURISDICTIONS] as [
  (typeof JURISDICTIONS)[number],
  ...(typeof JURISDICTIONS)[number][],
];

const pageNumber = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") return 1;
  return value;
}, z.coerce.number().int().min(1).default(1));

const trimmedText = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : value),
  z
    .string()
    .max(200)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
);

/** `?licenseType=EMI`, `?licenseType=EMI,PI` or repeated params all work. */
function toStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  const list = Array.isArray(value) ? value : [value];
  const items = list
    .flatMap((v) => String(v).split(","))
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
  return items.length > 0 ? items : undefined;
}

const licenseTypeArray = z.preprocess(
  toStringArray,
  z.array(z.enum(licenseTypeValues)).optional(),
);

const jurisdictionArray = z.preprocess(
  (value) => toStringArray(value)?.map((v) => v.toUpperCase()),
  z.array(z.enum(jurisdictionValues)).optional(),
);

/** /manager/users — role, status, free text (email / company / display name). */
export const managerUserFiltersSchema = z.object({
  q: trimmedText,
  role: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.enum(roleValues).optional(),
  ),
  status: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.enum(userStatusValues).optional(),
  ),
  page: pageNumber,
});

export type ManagerUserFilters = z.infer<typeof managerUserFiltersSchema>;

/** /manager/assets — status, license, jurisdiction, free text. */
export const managerAssetFiltersSchema = z.object({
  q: trimmedText,
  status: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.enum(assetStatusValues).optional(),
  ),
  licenseType: licenseTypeArray,
  jurisdiction: jurisdictionArray,
  page: pageNumber,
});

export type ManagerAssetFilters = z.infer<typeof managerAssetFiltersSchema>;

/** /manager/audit — filter the trail by action and/or target kind. */
export const auditFiltersSchema = z.object({
  action: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.enum(auditActionValues).optional(),
  ),
  targetType: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.enum(auditTargetValues).optional(),
  ),
  page: pageNumber,
});

export type AuditFilters = z.infer<typeof auditFiltersSchema>;

/** Suspend / reactivate / soft-delete a member. */
export const moderateUserSchema = z.object({
  userId: z.string().min(1, "Missing user"),
  status: z.enum(userStatusValues),
});

export type ModerateUserInput = z.infer<typeof moderateUserSchema>;

/**
 * Asset moderation statuses. DRAFT is intentionally excluded: a private seller
 * draft is not a moderation state, and a manager should not be able to hide a
 * live listing by turning it into one.
 */
export const moderationStatusValues = [
  "PUBLISHED",
  "PAUSED",
  "REMOVED",
] as const;

export const moderateAssetSchema = z.object({
  assetId: z.string().min(1, "Missing asset"),
  status: z.enum(moderationStatusValues),
});

export type ModerateAssetInput = z.infer<typeof moderateAssetSchema>;

/** Which audit action a status transition produces. */
export const USER_AUDIT_ACTION: Record<
  "SUSPENDED" | "ACTIVE" | "DELETED",
  AuditAction
> = {
  SUSPENDED: "USER_SUSPENDED",
  ACTIVE: "USER_REACTIVED",
  DELETED: "USER_SOFT_DELETED",
};

export const ASSET_AUDIT_ACTION: Record<
  "PUBLISHED" | "PAUSED" | "REMOVED",
  AuditAction
> = {
  PUBLISHED: "ASSET_PUBLISHED",
  PAUSED: "ASSET_PAUSED",
  REMOVED: "ASSET_REMOVED",
};
