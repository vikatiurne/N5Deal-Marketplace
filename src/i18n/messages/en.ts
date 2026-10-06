import { auth } from "./parts/en-auth";
import { buyer } from "./parts/en-buyer";
import { catalog } from "./parts/en-catalog";
import { common } from "./parts/en-common";
import { manager } from "./parts/en-manager";
import { seller } from "./parts/en-seller";

/**
 * English message catalog — the source of truth for the MessageKey union.
 * Zone strings live in ./parts; the uk aggregator must cover every key
 * (its type enforces completeness), and may add `*_few`/`*_many` plurals.
 */
export const en = {
  ...common,
  ...catalog,
  ...auth,
  ...buyer,
  ...seller,
  ...manager,
};

export type MessageKey = keyof typeof en;
