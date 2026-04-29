import { formatDistanceToNow, format, parseISO } from "date-fns";

export function formatUsd(amount: number | null | undefined): string {
  if (amount == null) return "Unlimited"; // Fallback for null spend caps
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 6,
    maximumFractionDigits: 6,
  }).format(amount);
}

export function formatTimeAgo(isoDate: string | null | undefined): string {
  if (!isoDate) return "N/A";
  try {
    return formatDistanceToNow(parseISO(isoDate), { addSuffix: true });
  } catch {
    return "N/A";
  }
}

export function formatDateTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "N/A";
  try {
    return format(parseISO(isoDate), "yyyy-MM-dd HH:mm:ss");
  } catch {
    return "N/A";
  }
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}
