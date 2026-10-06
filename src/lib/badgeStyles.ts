import { AssetStatus, LicenseType, Role, UserStatus } from "@/types";

/**
 * Single source of truth for badge colours and labels (task 09).
 *
 * Before this module the same four class strings were copy-pasted across seven
 * files and `licenseType` was rendered in two different ways (coloured pill in
 * some places, plain monospace text in others). Every badge in the app now
 * pulls its colours from here.
 *
 * Colour rules:
 * - Each `LicenseType` gets its own hue, chosen to clear WCAG AA 4.5:1 as text
 *   on its own 10% tint over `--surface`. The ratio is noted per entry.
 * - Amber and emerald stay reserved for *status* (paused, incomplete,
 *   published, active), so no licence colour can be read as a state.
 *
 * Every record is exhaustive on purpose: adding a `LicenseType` to the domain
 * now fails to compile until it gets a colour and a label here.
 */

/**
 * Human-readable labels. `MICA_CASP` used to reach the UI verbatim — a database
 * value rather than a licence name.
 */
export const LICENSE_LABELS: Record<LicenseType, string> = {
  EMI: "EMI",
  PI: "PI",
  MICA_CASP: "MiCA CASP",
  VASP: "VASP",
  BANK: "Bank",
  OTHER: "Other",
};

export const LICENSE_BADGE_STYLES: Record<LicenseType, string> = {
  // Contrast of the text colour on its own 10% tint over --surface.
  EMI: "border-sky-400/40 bg-sky-400/10 text-sky-400 hover:bg-sky-400/20", // 7.24:1
  PI: "border-violet-400/40 bg-violet-400/10 text-violet-400 hover:bg-violet-400/20", // 5.82:1
  MICA_CASP:
    "border-fuchsia-400/40 bg-fuchsia-400/10 text-fuchsia-400 hover:bg-fuchsia-400/20", // 6.44:1
  VASP: "border-rose-400/40 bg-rose-400/10 text-rose-400 hover:bg-rose-400/20", // 5.97:1
  BANK: "border-cyan-400/40 bg-cyan-400/10 text-cyan-400 hover:bg-cyan-400/20", // 8.46:1
  OTHER:
    "border-slate-400/40 bg-slate-400/10 text-slate-400 hover:bg-slate-400/20", // 6.15:1
};

export const ASSET_STATUS_LABELS: Record<AssetStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  PAUSED: "Paused",
  REMOVED: "Removed",
};

export const ASSET_STATUS_STYLES: Record<AssetStatus, string> = {
  DRAFT: "border-border bg-muted text-muted-foreground hover:bg-muted",
  PUBLISHED: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
  PAUSED: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
  REMOVED:
    "border-destructive/40 bg-destructive/10 text-destructive-text hover:bg-destructive/20",
};

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DELETED: "Deleted",
};

export const USER_STATUS_STYLES: Record<UserStatus, string> = {
  ACTIVE: "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20",
  SUSPENDED: "border-warning/40 bg-warning/10 text-warning hover:bg-warning/20",
  DELETED:
    "border-destructive/40 bg-destructive/10 text-destructive-text hover:bg-destructive/20",
};

export const ROLE_LABELS: Record<Role, string> = {
  BUYER: "Buyer",
  SELLER: "Seller",
  MANAGER: "Manager",
};

/** Roles were all rendered as the same plain outline badge — now distinct. */
export const ROLE_STYLES: Record<Role, string> = {
  BUYER: "border-sky-400/40 bg-sky-400/10 text-sky-400",
  SELLER: "border-violet-400/40 bg-violet-400/10 text-violet-400",
  MANAGER: "border-primary/40 bg-primary/10 text-primary",
};
