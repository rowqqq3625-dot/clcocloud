import "server-only";

function parseEmails(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

function readNumber(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return value;
}

function readBoolean(raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return fallback;
}

export const ADMIN_ALLOWED_EMAILS: Set<string> = parseEmails(process.env.ADMIN_ALLOWED_EMAILS);

export const ADMIN_GATE_PATH: string = process.env.ADMIN_GATE_PATH || "/admin-gate";
export const ADMIN_PANEL_PATH: string = process.env.ADMIN_PANEL_PATH || "/admin-panel";

export const ADMIN_SESSION_TTL_MINUTES: number = readNumber(process.env.ADMIN_SESSION_TTL_MINUTES, 60);
export const ADMIN_ENTRY_TTL_MINUTES = 5;
export const ADMIN_DATE_CODE_TIMEZONE: string = process.env.ADMIN_DATE_CODE_TIMEZONE || "Asia/Seoul";

export const ADMIN_GEO_FAIL_CLOSED: boolean = readBoolean(process.env.ADMIN_GEO_FAIL_CLOSED, true);
/**
 * Opt-in escape hatch for environments where the KR geo gate would otherwise
 * block a legitimate operator (local dev with no `x-vercel-ip-country` header,
 * preview deploys accessed from outside KR, etc). Defaults to true in
 * development so `npm run dev` on localhost just works without extra config;
 * production deploys must set ADMIN_GEO_BYPASS=true explicitly to disable the
 * country check.
 */
export const ADMIN_GEO_BYPASS: boolean = readBoolean(
  process.env.ADMIN_GEO_BYPASS,
  process.env.NODE_ENV !== "production"
);
export const ADMIN_RATE_LIMIT_MAX_FAILS: number = readNumber(process.env.ADMIN_RATE_LIMIT_MAX_FAILS, 5);
export const ADMIN_RATE_LIMIT_LOCK_MINUTES: number = readNumber(process.env.ADMIN_RATE_LIMIT_LOCK_MINUTES, 30);

/**
 * Cookie-security flags. On HTTP localhost we MUST drop the Secure attribute
 * (browsers ignore Secure cookies on HTTP) and the `__Host-` prefix (RFC
 * mandates Secure for that prefix). Production deployments are always HTTPS
 * so the strict defaults kick in automatically.
 */
const IS_PROD = process.env.NODE_ENV === "production";
export const ADMIN_COOKIE_SECURE: boolean = IS_PROD;
export const ADMIN_SESSION_COOKIE = IS_PROD ? "__Host-clco-admin-session" : "clco-admin-session";
export const ADMIN_ENTRY_COOKIE = "clco-admin-entry";
export const ADMIN_CSRF_COOKIE = "clco-admin-csrf";
export const ADMIN_CSRF_HEADER = "x-admin-csrf";

export type RequiredAdminEnv =
  | "ADMIN_LOGIN_ID_HASH"
  | "ADMIN_PASSWORD_HASH"
  | "ADMIN_COOKIE_SECRET"
  | "ADMIN_CSRF_SECRET";

export function requireAdminEnv(name: RequiredAdminEnv): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Admin config missing required env: ${name}`);
  }
  return value;
}

export function isAdminCandidateEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_ALLOWED_EMAILS.has(email.trim().toLowerCase());
}
