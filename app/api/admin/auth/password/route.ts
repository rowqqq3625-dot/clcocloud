import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminEnv } from "@/lib/admin/config";
import { verifyCsrf } from "@/lib/admin/csrf";
import { getClientIp, isKoreaRequest } from "@/lib/admin/geo";
import { verifyScrypt } from "@/lib/admin/hash";
import {
  AdminRateLimitError,
  checkAdminRateLimit,
  recordAdminFailure,
  resetAdminFailures,
} from "@/lib/admin/rate-limit";
import {
  markEntryPasswordPassed,
  verifyAdminEntryToken,
} from "@/lib/admin/entry";
import { logAdminSecurityEvent } from "@/lib/admin/audit";

export const runtime = "nodejs";

// TEMPORARY: dev-only diagnostic. Logs WHICH check failed and surfaces the
// stage code in the response body so the gate form can show it during local
// debugging. In production we keep the generic 401 to avoid leaking info.
const IS_DEV = process.env.NODE_ENV !== "production";
const DENY = (stage?: string) =>
  NextResponse.json(
    IS_DEV && stage
      ? { error: "접근할 수 없습니다.", debugStage: stage }
      : { error: "접근할 수 없습니다." },
    { status: 401 }
  );
function devLog(stage: string, extra?: Record<string, unknown>) {
  if (!IS_DEV) return;
  // eslint-disable-next-line no-console
  console.log(`[admin-pw] ${stage}`, extra || "");
}

const Schema = z.object({
  loginId: z.string().min(1).max(120),
  password: z.string().min(1).max(200),
});

export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) {
    devLog("FAIL_CSRF");
    return DENY("FAIL_CSRF");
  }
  if (!isKoreaRequest(req.headers)) {
    devLog("FAIL_GEO");
    return DENY("FAIL_GEO");
  }

  const ipKey = `${getClientIp(req.headers) || "unknown"}:pw`;
  try {
    await checkAdminRateLimit(ipKey, "admin_password");
  } catch (err) {
    if (err instanceof AdminRateLimitError) {
      devLog("FAIL_RATE_LIMIT");
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 429 });
    }
    throw err;
  }

  const challenge = await verifyAdminEntryToken(req);
  if (!challenge) {
    devLog("FAIL_ENTRY_TOKEN");
    await recordAdminFailure(ipKey, "admin_password");
    return DENY("FAIL_ENTRY_TOKEN");
  }

  let parsed: z.infer<typeof Schema>;
  try {
    const body = await req.json();
    parsed = Schema.parse(body);
  } catch {
    devLog("FAIL_BODY_PARSE");
    await recordAdminFailure(ipKey, "admin_password");
    return DENY("FAIL_BODY_PARSE");
  }

  // Always evaluate BOTH hashes — flattens timing between "id wrong" / "pw wrong".
  const idOk = verifyScrypt(parsed.loginId, requireAdminEnv("ADMIN_LOGIN_ID_HASH"));
  const pwOk = verifyScrypt(parsed.password, requireAdminEnv("ADMIN_PASSWORD_HASH"));

  if (!idOk || !pwOk) {
    const storedId = process.env.ADMIN_LOGIN_ID_HASH || "";
    const storedPw = process.env.ADMIN_PASSWORD_HASH || "";
    devLog("FAIL_CREDENTIALS", {
      idOk,
      pwOk,
      idLen: parsed.loginId.length,
      pwLen: parsed.password.length,
      // First 35 chars of stored hash — enough to identify which version
      // is loaded but reveals nothing about plaintext (HMAC-style commitment).
      idHashPrefix: storedId.slice(0, 35),
      pwHashPrefix: storedPw.slice(0, 35),
      idBytes: Array.from(parsed.loginId).map((c) => c.charCodeAt(0)).join(","),
      // pwBytes intentionally omitted — would leak partial info on PW.
    });
    await recordAdminFailure(ipKey, "admin_password");
    await logAdminSecurityEvent({
      eventType: "ADMIN_PASSWORD_FAILED",
      email: challenge.admin_email,
      req,
    });
    return DENY("FAIL_CREDENTIALS");
  }

  devLog("OK");
  await markEntryPasswordPassed(challenge.id);
  await resetAdminFailures(ipKey, "admin_password");
  return NextResponse.json({ ok: true });
}
