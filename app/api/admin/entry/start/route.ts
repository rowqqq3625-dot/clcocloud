import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";
import {
  ADMIN_GATE_PATH,
  isAdminCandidateEmail,
} from "@/lib/admin/config";
import { verifyCsrf } from "@/lib/admin/csrf";
import { getClientIp, isKoreaRequest } from "@/lib/admin/geo";

// Opt-in geo gate. The `isAdminCandidateEmail` check above is already
// gated by a valid OAuth session, so the geo restriction is redundant
// for verified admin candidates. Set ADMIN_GEO_REQUIRED=true to re-enable
// the KR-only check on top of the email allowlist.
const GEO_REQUIRED = (process.env.ADMIN_GEO_REQUIRED || "").trim().toLowerCase() === "true";
import {
  AdminRateLimitError,
  checkAdminRateLimit,
  recordAdminFailure,
} from "@/lib/admin/rate-limit";
import { createAdminEntryToken } from "@/lib/admin/entry";
import { logAdminSecurityEvent } from "@/lib/admin/audit";

export const runtime = "nodejs";

const GENERIC = NextResponse.json({ error: "접근할 수 없습니다." }, { status: 404 });

export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) {
    return NextResponse.json({ error: "접근할 수 없습니다." }, { status: 404 });
  }

  const session = getSessionFromRequest(req);
  if (!session?.email || !isAdminCandidateEmail(session.email)) {
    await logAdminSecurityEvent({
      eventType: "ADMIN_ENTRY_DENIED",
      email: session?.email ?? null,
      payload: { reason: "not_candidate" },
      req,
    });
    return GENERIC;
  }

  const ipKey = `${getClientIp(req.headers) || "unknown"}:entry`;
  try {
    await checkAdminRateLimit(ipKey, "admin_entry");
  } catch (err) {
    if (err instanceof AdminRateLimitError) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
    }
    throw err;
  }

  if (GEO_REQUIRED && !isKoreaRequest(req.headers)) {
    await recordAdminFailure(ipKey, "admin_entry");
    await logAdminSecurityEvent({
      eventType: "NON_KR_BLOCKED",
      email: session.email,
      req,
    });
    return NextResponse.json({ error: "GEO_BLOCKED" }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, next: ADMIN_GATE_PATH });
  const token = await createAdminEntryToken(session.email, req, response);
  if (!token) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
  }
  return response;
}
