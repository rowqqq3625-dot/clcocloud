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

const DENY = () => NextResponse.json({ error: "접근할 수 없습니다." }, { status: 401 });

// Opt-in geo gate. Verified admin candidates already proved identity via
// OAuth + entry token; geo enforcement is secondary and opt-in via env.
const GEO_REQUIRED = (process.env.ADMIN_GEO_REQUIRED || "").trim().toLowerCase() === "true";

// TEMPORARY: dev-only diagnostic logging. Logs WHICH check failed so we can
// distinguish "wrong password" from "expired entry token" without leaking
// info to the client. Strip before any production deploy.
const IS_DEV = process.env.NODE_ENV !== "production";
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
    return DENY();
  }
  if (GEO_REQUIRED && !isKoreaRequest(req.headers)) {
    devLog("FAIL_GEO");
    return DENY();
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
    return DENY();
  }

  let parsed: z.infer<typeof Schema>;
  try {
    const body = await req.json();
    parsed = Schema.parse(body);
  } catch {
    devLog("FAIL_BODY_PARSE");
    await recordAdminFailure(ipKey, "admin_password");
    return DENY();
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
    return DENY();
  }

  devLog("OK");
  await markEntryPasswordPassed(challenge.id);
  await resetAdminFailures(ipKey, "admin_password");
  return NextResponse.json({ ok: true });
}
