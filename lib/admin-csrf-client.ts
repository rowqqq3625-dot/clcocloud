/**
 * Client-side CSRF helpers for /api/admin/* requests.
 *
 * The admin CSRF cookie is set with HttpOnly=false specifically so client
 * components can echo it back via the X-Admin-CSRF header for double-submit
 * verification (see lib/admin/csrf.ts).
 *
 * This module must NOT import `server-only`.
 */

export const ADMIN_CSRF_COOKIE = "clco-admin-csrf";
export const ADMIN_CSRF_HEADER = "X-Admin-CSRF";

export function readAdminCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq) === ADMIN_CSRF_COOKIE) {
      return decodeURIComponent(part.slice(eq + 1));
    }
  }
  return undefined;
}

/** Returns a header bag with the CSRF token set if available. */
export function adminCsrfHeaders(extra?: HeadersInit): HeadersInit {
  const token = readAdminCsrfToken();
  const base: Record<string, string> = token ? { [ADMIN_CSRF_HEADER]: token } : {};
  if (!extra) return base;
  return { ...base, ...(extra as Record<string, string>) };
}
