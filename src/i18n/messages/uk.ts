import type { MessageKey } from "./en";
import { authUk } from "./parts/uk-auth";
import { buyerUk } from "./parts/uk-buyer";
import { catalogUk } from "./parts/uk-catalog";
import { commonUk } from "./parts/uk-common";
import { managerUk } from "./parts/uk-manager";
import { sellerUk } from "./parts/uk-seller";

/**
 * Ukrainian catalog. The annotation makes this the completeness gate for
 * every English key; extra `key_one` / `key_few` / `key_many` plural variants
 * (selected via Intl.PluralRules) are allowed on top of the base keys.
 */
export const uk: Record<MessageKey, string> & Record<string, string> = {
  ...commonUk,
  ...catalogUk,
  ...authUk,
  ...buyerUk,
  ...sellerUk,
  ...managerUk,
};
