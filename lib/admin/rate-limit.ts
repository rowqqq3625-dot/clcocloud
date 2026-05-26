import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { ADMIN_RATE_LIMIT_LOCK_MINUTES, ADMIN_RATE_LIMIT_MAX_FAILS } from "./config";

export type AdminRateLimitScope = "admin_password" | "admin_date_code" | "admin_entry";

export class AdminRateLimitError extends Error {
  constructor(public readonly lockedUntil: string | null) {
    super("rate-limited");
    this.name = "AdminRateLimitError";
  }
}

/**
 * Throws AdminRateLimitError if the (key, scope) pair is currently locked.
 * No-op otherwise.
 */
export async function checkAdminRateLimit(key: string, scope: AdminRateLimitScope): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  const { data } = await supabase
    .from("admin_rate_limits")
    .select("locked_until")
    .eq("key", key)
    .eq("scope", scope)
    .maybeSingle();
  if (data?.locked_until && new Date(data.locked_until).getTime() > Date.now()) {
    throw new AdminRateLimitError(data.locked_until);
  }
}

/**
 * Increment failure counter for (key, scope). If the threshold is reached
 * the row is locked for ADMIN_RATE_LIMIT_LOCK_MINUTES and the counter is reset.
 */
export async function recordAdminFailure(key: string, scope: AdminRateLimitScope): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;

  const { data: existing } = await supabase
    .from("admin_rate_limits")
    .select("id, fail_count, locked_until")
    .eq("key", key)
    .eq("scope", scope)
    .maybeSingle();

  const now = new Date();
  const lockedUntilStr = (offsetMinutes: number) =>
    new Date(now.getTime() + offsetMinutes * 60_000).toISOString();

  if (!existing) {
    await supabase.from("admin_rate_limits").insert({
      key,
      scope,
      fail_count: 1,
      last_fail_at: now.toISOString(),
    });
    return;
  }

  const nextCount = existing.fail_count + 1;
  if (nextCount >= ADMIN_RATE_LIMIT_MAX_FAILS) {
    await supabase
      .from("admin_rate_limits")
      .update({
        fail_count: 0,
        locked_until: lockedUntilStr(ADMIN_RATE_LIMIT_LOCK_MINUTES),
        last_fail_at: now.toISOString(),
      })
      .eq("id", existing.id);
    return;
  }

  await supabase
    .from("admin_rate_limits")
    .update({
      fail_count: nextCount,
      last_fail_at: now.toISOString(),
    })
    .eq("id", existing.id);
}

export async function resetAdminFailures(key: string, scope: AdminRateLimitScope): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return;
  await supabase
    .from("admin_rate_limits")
    .update({ fail_count: 0, locked_until: null })
    .eq("key", key)
    .eq("scope", scope);
}
