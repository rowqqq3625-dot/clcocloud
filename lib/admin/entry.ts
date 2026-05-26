import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  ADMIN_COOKIE_SECURE,
  ADMIN_ENTRY_COOKIE,
  ADMIN_ENTRY_TTL_MINUTES,
} from "./config";
import { getClientIp, getCountryFromRequest } from "./geo";
import { hashToken, hashUserAgent, randomToken } from "./hash";

export type AdminEntryChallenge = {
  id: string;
  admin_email: string;
  password_passed: boolean;
  date_code_passed: boolean;
  expires_at: string;
  consumed_at: string | null;
};

export async function createAdminEntryToken(
  email: string,
  req: NextRequest | Request,
  res: NextResponse
): Promise<string | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const token = randomToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ADMIN_ENTRY_TTL_MINUTES * 60_000).toISOString();
  const ua = req.headers.get("user-agent");

  const { error } = await supabase.from("admin_auth_challenges").insert({
    admin_email: email.toLowerCase(),
    entry_token_hash: tokenHash,
    ip: getClientIp(req.headers),
    country: getCountryFromRequest(req.headers),
    user_agent_hash: hashUserAgent(ua),
    expires_at: expiresAt,
  });

  if (error) return null;

  res.cookies.set(ADMIN_ENTRY_COOKIE, token, {
    httpOnly: true,
    secure: ADMIN_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_ENTRY_TTL_MINUTES * 60,
  });

  return token;
}

function getEntryTokenFromRequest(req: NextRequest | Request): string | undefined {
  if ("cookies" in req && (req as NextRequest).cookies) {
    return (req as NextRequest).cookies.get(ADMIN_ENTRY_COOKIE)?.value;
  }
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq) === ADMIN_ENTRY_COOKIE) return decodeURIComponent(part.slice(eq + 1));
  }
  return undefined;
}

export async function verifyAdminEntryToken(
  req: NextRequest | Request,
  expectedEmail?: string | null
): Promise<AdminEntryChallenge | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const token = getEntryTokenFromRequest(req);
  if (!token) return null;

  const tokenHash = hashToken(token);
  const { data } = await supabase
    .from("admin_auth_challenges")
    .select("id, admin_email, password_passed, date_code_passed, expires_at, consumed_at")
    .eq("entry_token_hash", tokenHash)
    .maybeSingle();

  if (!data) return null;
  if (data.consumed_at) return null;
  if (new Date(data.expires_at).getTime() <= Date.now()) return null;
  if (expectedEmail && data.admin_email.toLowerCase() !== expectedEmail.toLowerCase()) return null;

  return data as AdminEntryChallenge;
}

export async function markEntryPasswordPassed(challengeId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase
    .from("admin_auth_challenges")
    .update({ password_passed: true })
    .eq("id", challengeId);
}

export async function consumeEntryChallenge(challengeId: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase
    .from("admin_auth_challenges")
    .update({ date_code_passed: true, consumed_at: new Date().toISOString() })
    .eq("id", challengeId);
}

export function clearAdminEntryCookie(res: NextResponse): void {
  res.cookies.set(ADMIN_ENTRY_COOKIE, "", {
    httpOnly: true,
    secure: ADMIN_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
