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

export function formatDateMDY(ymd) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${m}/${d}/${y}`;
}

export function parseLocalDate(ymd) {
  if (!ymd) return null;

  const [y, m, d] = ymd.split("-").map(Number);

  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d);
}
