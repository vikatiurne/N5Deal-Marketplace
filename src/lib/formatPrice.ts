/**
 * Formats an asset price for display.
 * Null price means the seller chose not to disclose it.
 */
export function formatPrice(price: number | null, currency = "EUR"): string {
  if (price === null) return "Price on request";
  return formatMoney(price, currency);
}

/** Money amount with no null handling — used for budgets and thresholds. */
export function formatMoney(amount: number, currency = "EUR"): string {
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString("en-IE")} ${currency}`;
  }
}

/** Buyer budget range, tolerating open bounds. */
export function formatBudgetRange(
  min: number | null,
  max: number | null,
): string {
  if (min === null && max === null) return "Budget not specified";
  if (min !== null && max !== null) {
    return `${formatMoney(min)} – ${formatMoney(max)}`;
  }
  return min !== null
    ? `from ${formatMoney(min)}`
    : `up to ${formatMoney(max ?? 0)}`;
}
