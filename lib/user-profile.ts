import "server-only";
import type { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { AuthSession } from "@/lib/auth-session";
import { getClientIp } from "@/lib/admin/geo";

export type UserProfile = {
  id: string;
  provider: string;
  provider_account_id: string;
  email: string | null;
  name: string | null;
  image: string | null;
  signed_up_at: string;
  last_seen_at: string;
};

/**
 * Insert on first sign-in, update email/name/image + last_seen_at on every
 * subsequent sign-in. signed_up_at is set by the DB default on insert and is
 * left untouched on conflict (we deliberately omit it from the payload).
 */
export async function upsertUserProfileOnLogin(
  profile: { provider: string; providerAccountId: string; email?: string | null; name?: string | null; image?: string | null },
  request: NextRequest | Request
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const payload = {
    provider: profile.provider,
    provider_account_id: profile.providerAccountId,
    email: profile.email ?? null,
    name: profile.name ?? null,
    image: profile.image ?? null,
    last_seen_at: new Date().toISOString(),
    last_seen_ip: getClientIp(request.headers),
    last_seen_user_agent: request.headers.get("user-agent"),
  };

  await supabase
    .from("user_profiles")
    .upsert(payload, { onConflict: "provider,provider_account_id" });
}

/**
 * Lightweight heartbeat — called from /api/session (polled every few seconds
 * by the active client). Only touches last_seen_at; relies on the row already
 * existing from the OAuth callback. If the row is missing (e.g. legacy
 * session predating this table), inserts a stub so the user appears in the
 * admin list immediately.
 */
export async function touchUserLastSeen(
  session: AuthSession,
  request: NextRequest | Request
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  await supabase
    .from("user_profiles")
    .upsert(
      {
        provider: session.provider,
        provider_account_id: session.providerAccountId,
        email: session.email ?? null,
        name: session.name ?? null,
        image: session.image ?? null,
        last_seen_at: new Date().toISOString(),
        last_seen_ip: getClientIp(request.headers),
        last_seen_user_agent: request.headers.get("user-agent"),
      },
      { onConflict: "provider,provider_account_id" }
    );
}
