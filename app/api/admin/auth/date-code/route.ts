import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth-session";
import { ADMIN_PANEL_PATH, isAdminCandidateEmail } from "@/lib/admin/config";
import { logAdminAction, logAdminSecurityEvent } from "@/lib/admin/audit";
import { verifyCsrf } from "@/lib/admin/csrf";
import { verifyAdminDateCode } from "@/lib/admin/date-code";
import { getClientIp, isKoreaRequest } from "@/lib/admin/geo";
import {
  AdminRateLimitError,
  checkAdminRateLimit,
  recordAdminFailure,
  resetAdminFailures,
} from "@/lib/admin/rate-limit";
import {
  clearAdminEntryCookie,
  consumeEntryChallenge,
  verifyAdminEntryToken,
} from "@/lib/admin/entry";
import { issueAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";

const IS_DEV = process.env.NODE_ENV !== "production";

function deny(req: NextRequest, stage?: string): NextResponse {
  let exposeStage = IS_DEV;
  if (!exposeStage && stage) {
    const session = getSessionFromRequest(req);
    exposeStage = Boolean(session?.email && isAdminCandidateEmail(session.email));
  }
  return NextResponse.json(
    exposeStage && stage
      ? { error: "접근할 수 없습니다.", debugStage: stage }
      : { error: "접근할 수 없습니다." },
    { status: 401 }
  );
}

// Opt-in geo gate (see admin/entry/start/route.ts for rationale).
const GEO_REQUIRED = (process.env.ADMIN_GEO_REQUIRED || "").trim().toLowerCase() === "true";

const Schema = z.object({
  code: z.string().regex(/^\d{4}$/),
});

export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) return deny(req, "FAIL_CSRF");
  if (GEO_REQUIRED && !isKoreaRequest(req.headers)) return deny(req, "FAIL_GEO");

  const ipKey = `${getClientIp(req.headers) || "unknown"}:date`;
  try {
    await checkAdminRateLimit(ipKey, "admin_date_code");
  } catch (err) {
    if (err instanceof AdminRateLimitError) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
    }
    throw err;
  }

  const challenge = await verifyAdminEntryToken(req);
  if (!challenge || !challenge.password_passed) {
    await recordAdminFailure(ipKey, "admin_date_code");
    return deny(req,"FAIL_ENTRY_TOKEN");
  }

  let parsed: z.infer<typeof Schema>;
  try {
    const body = await req.json();
    parsed = Schema.parse(body);
  } catch {
    await recordAdminFailure(ipKey, "admin_date_code");
    return deny(req,"FAIL_BODY_PARSE");
  }

  if (!verifyAdminDateCode(parsed.code)) {
    await recordAdminFailure(ipKey, "admin_date_code");
    await logAdminSecurityEvent({
      eventType: "ADMIN_DATE_CODE_FAILED",
      email: challenge.admin_email,
      req,
    });
    return deny(req,"FAIL_DATE_CODE");
  }

  const response = NextResponse.json({ ok: true, next: ADMIN_PANEL_PATH });
  const session = await issueAdminSession(challenge.admin_email, req, response);
  if (!session) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
  }

  await consumeEntryChallenge(challenge.id);
  clearAdminEntryCookie(response);
  await resetAdminFailures(ipKey, "admin_date_code");

  await logAdminAction({
    email: challenge.admin_email,
    action: "ADMIN_LOGIN_SUCCESS",
    targetType: "admin_session",
    targetId: session.id,
    req,
  });

  return response;
}
