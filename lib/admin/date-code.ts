import "server-only";
import { ADMIN_DATE_CODE_TIMEZONE } from "./config";
import { constantTimeEqual } from "./hash";

const FOUR_DIGITS = /^\d{4}$/;

/**
 * Returns today's MMDD in the configured admin timezone (default Asia/Seoul).
 * Implementation note: Intl.DateTimeFormat with 2-digit month/day yields a
 * locale-stable result independent of the host system timezone.
 *
 * The UI deliberately does NOT hint at the MMDD format — the field is just
 * labeled "암호" with no placeholder, so an unauthorized viewer cannot
 * trivially infer the rule from the prompt.
 */
export function getTodayAdminDateCode(
  timezone: string = ADMIN_DATE_CODE_TIMEZONE,
  now: Date = new Date()
): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(now);
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  if (!month || !day) {
    throw new Error("Failed to compute admin date code");
  }
  return `${month}${day}`;
}

/**
 * Strict 4-digit check + constant-time compare against today's code.
 */
export function verifyAdminDateCode(input: string, now: Date = new Date()): boolean {
  if (typeof input !== "string" || !FOUR_DIGITS.test(input)) return false;
  const today = getTodayAdminDateCode(undefined, now);
  return constantTimeEqual(input, today);
}
