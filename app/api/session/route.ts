import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";
import { getDashboardKeyRecords } from "@/lib/dashboard-key-records";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  let hasHistory = false;
  let lastSeenAt: string | null = null;

  if (session) {
    const supabase = getSupabaseAdminClient();
    const keyRecords = await getDashboardKeyRecords(session, false);
    hasHistory = keyRecords.length > 0;
    lastSeenAt = keyRecords[0]?.last_checked_at || null;

    if (supabase && !hasHistory) {
      const { data } = await supabase
        .from("orders")
        .select("created_at")
        .eq("user_provider", session.provider)
        .eq("user_provider_account_id", session.providerAccountId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.created_at) {
        hasHistory = true;
        lastSeenAt = data.created_at;
      }
    }
  }

  return NextResponse.json({
    authenticated: Boolean(session),
    hasHistory,
    lastSeenAt,
    user: session
      ? {
          provider: session.provider,
          email: session.email || null,
          name: session.name || null,
          image: session.image || null
        }
      : null
  });
}
