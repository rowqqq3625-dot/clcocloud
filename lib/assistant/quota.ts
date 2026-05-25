import { getSupabaseAdminClient } from "@/lib/supabase-admin";

// Global cache for sharing in-memory quotas during local development without database
const globalRef = global as any;
globalRef.assistantInMemoryQuota = globalRef.assistantInMemoryQuota || new Map<string, { used_count: number; quota_date: string }>();
const inMemoryQuota = globalRef.assistantInMemoryQuota;

export interface QuotaStatus {
  used: number;
  limit: number;
  allowed: boolean;
}

/**
 * Helper to get the current date in KST (Asia/Seoul) format: YYYY-MM-DD
 */
export function getKstDate(): string {
  const now = new Date();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(now);
}

/**
 * Checks the current quota of the user.
 */
export async function checkQuota(clientHash: string): Promise<QuotaStatus> {
  const limit = Number(process.env.ASSISTANT_DAILY_LIMIT) || 10;
  const kstDate = getKstDate();
  let used = 0;

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("assistant_usage_quota")
        .select("used_count")
        .eq("client_hash", clientHash)
        .eq("quota_date", kstDate)
        .maybeSingle();

      if (!error && data) {
        used = data.used_count;
      }
    } catch (e) {
      console.error("[AssistantQuota] Error querying DB quota:", e);
    }
  } else {
    // Fallback to memory
    const cached = inMemoryQuota.get(clientHash);
    if (cached && cached.quota_date === kstDate) {
      used = cached.used_count;
    }
  }

  return {
    used,
    limit,
    allowed: used < limit
  };
}

/**
 * Increments the quota count in Supabase or fallback.
 */
export async function incrementQuota(clientHash: string): Promise<{ used: number; limit: number }> {
  const limit = Number(process.env.ASSISTANT_DAILY_LIMIT) || 10;
  const kstDate = getKstDate();
  
  const current = await checkQuota(clientHash);
  const nextUsed = current.used + 1;

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("assistant_usage_quota").upsert(
        {
          client_hash: clientHash,
          quota_date: kstDate,
          used_count: nextUsed,
          last_used_at: new Date().toISOString()
        },
        { onConflict: "client_hash,quota_date" }
      );
      if (error) {
        console.error("[AssistantQuota] Error upserting quota:", error);
      }
    } catch (e) {
      console.error("[AssistantQuota] Error in upserting quota:", e);
    }
  } else {
    inMemoryQuota.set(clientHash, {
      used_count: nextUsed,
      quota_date: kstDate
    });
  }

  return {
    used: nextUsed,
    limit
  };
}
