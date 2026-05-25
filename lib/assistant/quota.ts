import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import fs from "fs";
import path from "path";

const QUOTA_FILE = path.join(process.cwd(), "assistant_quota.json");

// Global cache for memory fallback
const globalRef = global as any;
globalRef.assistantInMemoryQuota = globalRef.assistantInMemoryQuota || new Map<string, string[]>();
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
 * Helper to get a KST date with day offset: YYYY-MM-DD
 */
export function getKstDateOffset(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() - offsetDays);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

/**
 * Reads local file-based quota for rolling 7-day period.
 */
function getFileQuota(clientHash: string): number {
  try {
    if (!fs.existsSync(QUOTA_FILE)) return 0;
    const content = fs.readFileSync(QUOTA_FILE, "utf8");
    const data = JSON.parse(content);
    const timestamps = data[clientHash] || [];
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const activeTimestamps = timestamps.filter((t: string) => {
      const time = new Date(t).getTime();
      return time >= sevenDaysAgo;
    });

    return activeTimestamps.length;
  } catch (e) {
    console.error("[AssistantQuota] Error reading file quota:", e);
    
    // In-memory fallback
    const cached = inMemoryQuota.get(clientHash) || [];
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    return cached.filter((t: string) => new Date(t).getTime() >= sevenDaysAgo).length;
  }
}

/**
 * Increments local file-based quota for rolling 7-day period.
 */
function incrementFileQuota(clientHash: string): number {
  try {
    let data: Record<string, string[]> = {};
    if (fs.existsSync(QUOTA_FILE)) {
      const content = fs.readFileSync(QUOTA_FILE, "utf8");
      data = JSON.parse(content);
    }
    if (!data[clientHash]) {
      data[clientHash] = [];
    }
    const nowIso = new Date().toISOString();
    data[clientHash].push(nowIso);

    // Cleanup old timestamps (> 7 days)
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    data[clientHash] = data[clientHash].filter((t: string) => {
      const time = new Date(t).getTime();
      return time >= sevenDaysAgo;
    });

    fs.writeFileSync(QUOTA_FILE, JSON.stringify(data, null, 2), "utf8");
    
    // Sync memory
    inMemoryQuota.set(clientHash, data[clientHash]);
    
    return data[clientHash].length;
  } catch (e) {
    console.error("[AssistantQuota] Error writing file quota:", e);
    
    // Memory fallback
    const cached = inMemoryQuota.get(clientHash) || [];
    cached.push(new Date().toISOString());
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const active = cached.filter((t: string) => new Date(t).getTime() >= sevenDaysAgo);
    inMemoryQuota.set(clientHash, active);
    return active.length;
  }
}

/**
 * Checks the current quota of the user (Weekly limit: 15).
 */
export async function checkQuota(clientHash: string): Promise<QuotaStatus> {
  const limit = 15; // Limit is fixed to 15 times a week
  let used = 0;
  let dbSuccess = false;

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const sevenDaysAgo = getKstDateOffset(6); // covers 7 days (today + 6 days ago)
      const { data, error } = await supabase
        .from("assistant_usage_quota")
        .select("used_count")
        .eq("client_hash", clientHash)
        .gte("quota_date", sevenDaysAgo);

      if (!error && data) {
        used = data.reduce((acc, row) => acc + (row.used_count || 0), 0);
        dbSuccess = true;
      }
    } catch (e) {
      console.error("[AssistantQuota] Error querying DB quota:", e);
    }
  }

  // Fallback to file/memory storage if database query fails or table is missing
  if (!dbSuccess) {
    used = getFileQuota(clientHash);
  }

  return {
    used,
    limit,
    allowed: used < limit
  };
}

/**
 * Increments the quota count in Supabase and local file storage.
 */
export async function incrementQuota(clientHash: string): Promise<{ used: number; limit: number }> {
  const limit = 15;
  const kstDate = getKstDate();
  
  // First, always increment the local file quota (for robustness)
  const fileUsed = incrementFileQuota(clientHash);

  let finalUsed = fileUsed;
  let dbSuccess = false;

  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      // 1. Fetch today's count to increment it correctly (not the weekly sum!)
      let todayUsed = 0;
      const { data, error: fetchError } = await supabase
        .from("assistant_usage_quota")
        .select("used_count")
        .eq("client_hash", clientHash)
        .eq("quota_date", kstDate)
        .maybeSingle();

      if (!fetchError) {
        if (data) {
          todayUsed = data.used_count;
        }

        const nextTodayUsed = todayUsed + 1;

        // 2. Upsert the incremented count for today
        const { error: upsertError } = await supabase.from("assistant_usage_quota").upsert(
          {
            client_hash: clientHash,
            quota_date: kstDate,
            used_count: nextTodayUsed,
            last_used_at: new Date().toISOString()
          },
          { onConflict: "client_hash,quota_date" }
        );

        if (!upsertError) {
          dbSuccess = true;
        } else {
          console.error("[AssistantQuota] Error upserting DB quota:", upsertError);
        }
      } else {
        console.error("[AssistantQuota] Error fetching DB quota for increment:", fetchError);
      }
    } catch (e) {
      console.error("[AssistantQuota] Exception in incrementing DB quota:", e);
    }
  }

  if (dbSuccess) {
    // If DB succeeded, recalculate total 7-day usage from DB
    const currentStatus = await checkQuota(clientHash);
    finalUsed = currentStatus.used;
  }

  return {
    used: finalUsed,
    limit
  };
}
