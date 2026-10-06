import { intlLocale, type Locale } from "@/i18n/config";
import { translate } from "@/i18n/core";

/**
 * Formats an asset price for display.
 * Null price means the seller chose not to disclose it.
 */
export function formatPrice(
  price: number | null,
  currency: string,
  locale: Locale,
): string {
  if (price === null) return translate(locale, "format.priceOnRequest");
  return formatMoney(price, currency, locale);
}

/** Money amount with no null handling — used for budgets and thresholds. */
export function formatMoney(
  amount: number,
  currency: string,
  locale: Locale,
): string {
  const tag = intlLocale(locale);
  try {
    return new Intl.NumberFormat(tag, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(tag)} ${currency}`;
  }
}

/** Buyer budget range, tolerating open bounds. */
export function formatBudgetRange(
  min: number | null,
  max: number | null,
  locale: Locale,
): string {
  if (min === null && max === null) {
    return translate(locale, "format.budgetNotSpecified");
  }
  if (min !== null && max !== null) {
    return `${formatMoney(min, "EUR", locale)} – ${formatMoney(max, "EUR", locale)}`;
  }
  return min !== null
    ? `${translate(locale, "format.from")} ${formatMoney(min, "EUR", locale)}`
    : `${translate(locale, "format.upTo")} ${formatMoney(max ?? 0, "EUR", locale)}`;
}
