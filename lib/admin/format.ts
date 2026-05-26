import "server-only";

/**
 * Returns ISO timestamps for the start and end of "today" in the given
 * timezone (default Asia/Seoul). Used by dashboard aggregations that should
 * reflect KST-local day boundaries regardless of server TZ.
 */
export function getKstDayBounds(timezone = "Asia/Seoul", now: Date = new Date()): { startIso: string; endIso: string } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  const hh = Number(parts.find((p) => p.type === "hour")?.value);
  const mm = Number(parts.find((p) => p.type === "minute")?.value);
  const ss = Number(parts.find((p) => p.type === "second")?.value);

  // Reconstruct the UTC instant that corresponds to today's KST midnight.
  const utcMillis = now.getTime();
  const localMillis = Date.UTC(y, m - 1, d, hh, mm, ss);
  const tzOffsetMillis = localMillis - utcMillis; // ms ahead of UTC
  const startMillis = Date.UTC(y, m - 1, d, 0, 0, 0) - tzOffsetMillis;
  const endMillis = startMillis + 24 * 60 * 60 * 1000;

  return {
    startIso: new Date(startMillis).toISOString(),
    endIso: new Date(endMillis).toISOString(),
  };
}

// -----------------------------------------------------------------------
// PII display helpers — FULL VISIBILITY policy.
//
// The admin console shows customer email, name, and phone number raw,
// with no masking or formatting. The function names are kept (maskEmail,
// etc.) to avoid churning every call site. If a future policy reverts
// this decision, only this file needs to change.
// -----------------------------------------------------------------------

/** Returns the email string exactly as stored. */
export function maskEmail(input: string | null | undefined): string {
  if (!input) return "—";
  return input;
}

/**
 * Returns the phone with all digits intact, formatted as NNN-NNNN-NNNN for
 * 11-digit mobile, NN-NNN-NNNN for 9-digit Seoul landlines, NNN-NNN-NNNN for
 * 10-digit regional, etc. NO digits are ever hidden — only dashes are added
 * for readability.
 */
export function maskPhone(input: string | null | undefined): string {
  if (!input) return "—";
  const digits = input.replace(/[^\d]/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    // 010-XXX-XXXX style or 02-XXXX-XXXX for Seoul (02 is 2 digits)
    if (digits.startsWith("02")) {
      return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 9 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`;
  }
  // Unknown shape — return as-is rather than risk dropping/reshaping digits.
  return input;
}

/** Returns the name exactly as stored (trimmed only). */
export function maskName(input: string | null | undefined): string {
  if (!input) return "—";
  return input.trim();
}

/** Format an integer KRW value with thousands separator. */
export function formatKrw(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `₩${Math.trunc(value).toLocaleString("ko-KR")}`;
}

/** Format an ISO timestamp to KST "YYYY-MM-DD HH:mm". */
export function formatKstDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  const hh = parts.find((p) => p.type === "hour")?.value;
  const mm = parts.find((p) => p.type === "minute")?.value;
  return `${y}-${m}-${d} ${hh}:${mm}`;
}
