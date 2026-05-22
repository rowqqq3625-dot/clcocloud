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
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return "N/A";
    
    // Always render as KST (UTC + 9)
    const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = kstDate.getUTCFullYear();
    const MM = pad(kstDate.getUTCMonth() + 1);
    const dd = pad(kstDate.getUTCDate());
    const hh = pad(kstDate.getUTCHours());
    const mm = pad(kstDate.getUTCMinutes());
    const ss = pad(kstDate.getUTCSeconds());
    
    return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
  } catch {
    return "N/A";
  }
}

export function formatNumber(num: number | null | undefined): string {
  if (num == null) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}
