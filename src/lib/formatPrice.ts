/**
 * Formats an asset price for display.
 * Null price means the seller chose not to disclose it.
 */
export function formatPrice(price: number | null, currency = "EUR"): string {
  if (price === null) return "Price on request";
  try {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price.toLocaleString("en-IE")} ${currency}`;
  }
}
