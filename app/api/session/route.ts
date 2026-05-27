import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";
import { getDashboardKeyRecords } from "@/lib/dashboard-key-records";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { isAdminCandidateEmail } from "@/lib/admin/config";
import { issueCsrfTokenOnResponse } from "@/lib/admin/csrf";
import { touchUserLastSeen } from "@/lib/user-profile";

export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  let hasHistory = false;
  let lastSeenAt: string | null = null;

  if (session) {
    // Fire-and-forget: marks the user "online now" for the admin members view.
    // Errors are intentionally swallowed — this should never break the session
    // probe even if Supabase is briefly unreachable.
    touchUserLastSeen(session, request).catch(() => {});
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

  const isAdminCandidate = Boolean(session?.email && isAdminCandidateEmail(session.email));

  const response = NextResponse.json({
    authenticated: Boolean(session),
    hasHistory,
    lastSeenAt,
    isAdminCandidate,
    user: session
      ? {
          provider: session.provider,
          email: session.email || null,
          name: session.name || null,
          image: session.image || null
        }
      : null
  });

  // Issue a CSRF token cookie alongside session lookup. This lets the
  // ProfileMenu's "관리자 페이지" click submit a matching X-Admin-CSRF header
  // even though the admin gate hasn't been visited yet.
  if (isAdminCandidate) {
    try {
      issueCsrfTokenOnResponse(response);
    } catch {
      // Missing ADMIN_CSRF_SECRET — admin features inert; ignore for session probe.
    }
  }

  return response;
}
