import type { AssetStatus, LicenseType, Role, UserStatus } from "@/types";

import { type Locale } from "./config";
import { en, type MessageKey } from "./messages/en";
import { uk } from "./messages/uk";

export type { MessageKey };
export type MessageVars = Record<string, string | number>;

/** Role → message key (used wherever `ROLE_LABELS` used to be rendered). */
export const ROLE_KEYS: Record<Role, MessageKey> = {
  BUYER: "common.role.buyer",
  SELLER: "common.role.seller",
  MANAGER: "common.role.manager",
};

export const LICENSE_KEYS: Record<LicenseType, MessageKey> = {
  EMI: "common.license.emi",
  PI: "common.license.pi",
  MICA_CASP: "common.license.micaCasp",
  VASP: "common.license.vasp",
  BANK: "common.license.bank",
  OTHER: "common.license.other",
};

export const ASSET_STATUS_KEYS: Record<AssetStatus, MessageKey> = {
  DRAFT: "common.assetStatus.draft",
  PUBLISHED: "common.assetStatus.published",
  PAUSED: "common.assetStatus.paused",
  REMOVED: "common.assetStatus.removed",
};

export const USER_STATUS_KEYS: Record<UserStatus, MessageKey> = {
  ACTIVE: "common.userStatus.active",
  SUSPENDED: "common.userStatus.suspended",
  DELETED: "common.userStatus.deleted",
};

type Catalog = Readonly<Record<string, string | undefined>>;

const DICTS: Record<Locale, Catalog> = {
  en,
  uk,
};

// en: one/other; uk: one/few/many/other — `{count}`-vars pick the variant.
const PLURAL_RULES: Record<Locale, Intl.PluralRules> = {
  en: new Intl.PluralRules("en"),
  uk: new Intl.PluralRules("uk"),
};

/**
 * Missing keys fall back to English, then to the key itself, so a typo in a
 * catalog degrades to the English string instead of rendering "undefined".
 */
export function translate(
  locale: Locale,
  key: MessageKey,
  vars?: MessageVars,
): string {
  const dict = DICTS[locale];
  let lookupKey: string = key;
  if (vars && typeof vars.count === "number") {
    const pluralKey = `${key}_${PLURAL_RULES[locale].select(vars.count)}`;
    if (dict[pluralKey] !== undefined) lookupKey = pluralKey;
  }
  const template = dict[lookupKey] ?? dict[key] ?? en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export type TFunction = (key: MessageKey, vars?: MessageVars) => string;

export function createT(locale: Locale): TFunction {
  return (key, vars) => translate(locale, key, vars);
}
