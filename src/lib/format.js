// Global formatters for numbers and currency

export const fmtCurrency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value) {
  const num = Number(value);
  if (isNaN(num)) return "$0.00";
  return fmtCurrency.format(num);
}

export function formatDateMDY(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US"); // → MM/DD/YYYY
}
