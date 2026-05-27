import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import {
  ADMIN_COOKIE_SECURE,
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_TTL_MINUTES,
} from "./config";
import { getClientIp, getCountryFromRequest, isKoreaRequest } from "./geo";
import { hashToken, hashUserAgent, randomToken } from "./hash";

// Opt-in geo gate for live admin sessions. The session cookie itself is
// httpOnly/secure/strict-SameSite and only issued after OAuth + entry token
// + scrypt password + date code, so geo is secondary.
const GEO_REQUIRED = (process.env.ADMIN_GEO_REQUIRED || "").trim().toLowerCase() === "true";

export type AdminSessionRow = {
  id: string;
  admin_email: string;
  issued_at: string;
  expires_at: string;
  revoked_at: string | null;
  country: string | null;
};

export class AdminAuthError extends Error {
  constructor(public readonly code: string) {
    super(code);
    this.name = "AdminAuthError";
  }
}

function getSessionTokenFromRequest(req: NextRequest | Request): string | undefined {
  if ("cookies" in req && (req as NextRequest).cookies) {
    return (req as NextRequest).cookies.get(ADMIN_SESSION_COOKIE)?.value;
  }
  const raw = req.headers.get("cookie");
  if (!raw) return undefined;
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq) === ADMIN_SESSION_COOKIE) return decodeURIComponent(part.slice(eq + 1));
  }
  return undefined;
}

export async function issueAdminSession(
  email: string,
  req: NextRequest | Request,
  res: NextResponse
): Promise<AdminSessionRow | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const token = randomToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_TTL_MINUTES * 60_000).toISOString();
  const ua = req.headers.get("user-agent");

  const { data: sessionId, error } = await supabase.rpc("admin_issue_session", {
    p_admin_email: email.toLowerCase(),
    p_session_token_hash: tokenHash,
    p_expires_at: expiresAt,
    p_ip: getClientIp(req.headers),
    p_country: getCountryFromRequest(req.headers),
    p_user_agent_hash: hashUserAgent(ua),
  });

  if (error || !sessionId) return null;

  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: ADMIN_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_MINUTES * 60,
  });

  const { data: row } = await supabase
    .from("admin_sessions")
    .select("id, admin_email, issued_at, expires_at, revoked_at, country")
    .eq("id", sessionId)
    .maybeSingle();

  return (row as AdminSessionRow) ?? null;
}

/**
 * Validates that the request carries a live, current admin session and is
 * coming from KR. Returns the row on success, null on any failure.
 */
export async function getCurrentAdminSession(req: NextRequest | Request): Promise<AdminSessionRow | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const token = getSessionTokenFromRequest(req);
  if (!token) return null;

  // 1. country must be KR for every authenticated request (opt-in)
  if (GEO_REQUIRED && !isKoreaRequest(req.headers)) return null;

  const tokenHash = hashToken(token);
  const { data: session } = await supabase
    .from("admin_sessions")
    .select("id, admin_email, issued_at, expires_at, revoked_at, country")
    .eq("session_token_hash", tokenHash)
    .maybeSingle();

  if (!session) return null;
  if (session.revoked_at) return null;
  if (new Date(session.expires_at).getTime() <= Date.now()) return null;

  // 2. Must match the singleton current pointer — otherwise this session has
  //    been superseded by a newer login on another device.
  const { data: pointer } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "current_admin_session")
    .maybeSingle();

  const currentId = (pointer?.value as { session_id?: string } | null)?.session_id;
  if (!currentId || currentId !== session.id) return null;

  return session as AdminSessionRow;
}

export async function requireAdminSession(req: NextRequest | Request): Promise<AdminSessionRow> {
  const session = await getCurrentAdminSession(req);
  if (!session) throw new AdminAuthError("ADMIN_UNAUTHORIZED");
  return session;
}

export async function destroyAdminSession(
  req: NextRequest | Request,
  res: NextResponse,
  reason: string = "MANUAL_LOGOUT"
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const token = getSessionTokenFromRequest(req);
  if (supabase && token) {
    const tokenHash = hashToken(token);
    await supabase
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString(), revoked_reason: reason })
      .eq("session_token_hash", tokenHash)
      .is("revoked_at", null);

    // Clear the singleton pointer if it pointed to this session.
    const { data: pointer } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "current_admin_session")
      .maybeSingle();
    const pointerId = (pointer?.value as { session_id?: string } | null)?.session_id;
    const { data: row } = await supabase
      .from("admin_sessions")
      .select("id")
      .eq("session_token_hash", tokenHash)
      .maybeSingle();
    if (row && pointerId === row.id) {
      await supabase
        .from("admin_settings")
        .update({ value: { session_id: null } })
        .eq("key", "current_admin_session");
    }
  }
  res.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: ADMIN_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
}
