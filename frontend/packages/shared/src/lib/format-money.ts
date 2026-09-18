/**
 * Formats an integer minor-unit amount (cents) as a localized currency string.
 * Every money value in Coifyn is stored/transmitted as integer minor units —
 * this is the one place that converts to a human-readable display string.
 */
export function formatMoney(amountMinor: number, currency = "USD", locale = "en-US"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amountMinor / 100);
}

/** Converts a dollars-and-cents display string (e.g. from an input) to integer cents. */
export function dollarsToMinor(dollars: string | number): number {
  const value = typeof dollars === "string" ? Number.parseFloat(dollars || "0") : dollars;
  if (Number.isNaN(value)) return 0;
  return Math.round(value * 100);
}

/** Converts integer minor units to a plain dollars string suitable for a number input. */
export function minorToDollars(amountMinor: number): string {
  return (amountMinor / 100).toFixed(2);
}
