export function formatIDR(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(
  value: number | null | undefined,
  decimals = 2
): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(
  value: number | null | undefined,
  decimals = 1
): string {
  if (value === null || value === undefined) return "—";
  return `${formatNumber(value, decimals)}%`;
}

export function formatRatio(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${formatNumber(value, 2)}x`;
}
