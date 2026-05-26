import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { logAdminSecurityEvent } from "./audit";
import { verifyCsrf } from "./csrf";
import {
  AdminAuthError,
  type AdminSessionRow,
  getCurrentAdminSession,
} from "./session";

type GuardOptions = {
  /** Require an X-Admin-CSRF header matching the cookie (default: true for non-GET). */
  csrf?: boolean;
};

type GuardSuccess = { ok: true; session: AdminSessionRow };
type GuardFailure = { ok: false; response: NextResponse };
export type GuardResult = GuardSuccess | GuardFailure;

const DENY = (status = 401) =>
  NextResponse.json({ error: "접근할 수 없습니다." }, { status });

/**
 * Single entry point for legacy /api/admin/* routes. Replaces
 * isAdminSession() + ad-hoc verifyAdmin() helpers.
 *
 *  - Verifies the admin session (DB-backed, current pointer, KR, expiry).
 *  - For non-GET methods, requires a valid CSRF token by default.
 *  - Logs a security event on failure.
 */
export async function guardAdminApi(
  req: NextRequest,
  options: GuardOptions = {}
): Promise<GuardResult> {
  const method = req.method.toUpperCase();
  const csrfRequired = options.csrf ?? method !== "GET";

  if (csrfRequired && !verifyCsrf(req)) {
    await logAdminSecurityEvent({
      eventType: "ADMIN_API_DENIED",
      payload: { reason: "csrf", method, path: req.nextUrl?.pathname ?? null },
      req,
    });
    return { ok: false, response: DENY() };
  }

  try {
    const session = await getCurrentAdminSession(req);
    if (!session) {
      await logAdminSecurityEvent({
        eventType: "ADMIN_API_DENIED",
        payload: { reason: "no_session", method, path: req.nextUrl?.pathname ?? null },
        req,
      });
      return { ok: false, response: DENY() };
    }
    return { ok: true, session };
  } catch (err) {
    if (err instanceof AdminAuthError) {
      return { ok: false, response: DENY() };
    }
    throw err;
  }
}
