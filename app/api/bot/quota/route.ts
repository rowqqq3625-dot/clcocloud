import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getSessionFromRequest } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

// Global cache reference to share in-memory quotas during local development
const globalRef = global as any;
globalRef.inMemoryQuota = globalRef.inMemoryQuota || new Map<string, { used_count: number; quota_date: string }>();
const inMemoryQuota = globalRef.inMemoryQuota;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const urlClientHash = searchParams.get("clientHash");

    // 1. Authenticate user to prioritize user ID as the rate limit key
    const session = getSessionFromRequest(request);
    let clientHash = urlClientHash;

    if (session) {
      const rawId = `${session.provider}:${session.providerAccountId}`;
      clientHash = createHash("sha256").update(rawId).digest("hex");
    }

    if (!clientHash || typeof clientHash !== "string" || clientHash.length !== 64) {
      return NextResponse.json({ error: "Invalid client hash format" }, { status: 400 });
    }

    const dailyLimit = Number(process.env.CLCOCLOUD_BOT_DAILY_LIMIT) || 30;
    const now = new Date();
    const kstDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(now);

    let currentUsedCount = 0;
    const supabase = getSupabaseAdminClient();

    if (supabase) {
      const { data: quotaRow, error: quotaError } = await supabase
        .from("bot_usage_quota")
        .select("used_count")
        .eq("client_hash", clientHash)
        .eq("quota_date", kstDate)
        .maybeSingle();

      if (quotaError) {
        console.error("Failed to query usage quota in GET:", quotaError);
      } else if (quotaRow) {
        currentUsedCount = quotaRow.used_count;
      }
    } else {
      const cached = inMemoryQuota.get(clientHash);
      if (cached && cached.quota_date === kstDate) {
        currentUsedCount = cached.used_count;
      }
    }

    const headers = new Headers();
    headers.set("Cache-Control", "no-store, max-age=0");
    return NextResponse.json(
      {
        usedCount: currentUsedCount,
        dailyLimit
      },
      { headers }
    );
  } catch (err) {
    console.error("Quota API caught general error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
