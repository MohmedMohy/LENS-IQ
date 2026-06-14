export function formatCurrency(
  amount: number,
  currency = "EGP",
  locale = "en-EG"
): string {
  return `${amount.toLocaleString(locale, {
    maximumFractionDigits: 0,
  })} ${currency}`;
}
