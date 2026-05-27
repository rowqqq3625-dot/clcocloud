import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getReviewStats } from "@/lib/reviews/queries";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/admin/reviews/stats
// Admin dashboard data:
//   - base stats from review_stats_view
//   - per-plan: review count, avg rating
//   - last-12-months trend of new approved reviews
//   - reward totals (sum of paid + sum of revoked over USD/KRW)
//   - pending count, today-approved count, cumulative approved count
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({
      base: null,
      perPlan: [],
      monthlyTrend: [],
      rewards: { paid_usd: 0, paid_krw: 0, revoked_usd: 0, revoked_krw: 0 },
      pendingCount: 0,
      todayApprovedCount: 0,
      cumulativeApproved: 0,
    });
  }

  const base = await getReviewStats();

  const [{ data: planRows }, { data: monthRows }, { data: rewardRows }, { count: pendingCount }, { count: cumulative }] =
    await Promise.all([
      supabase
        .from("reviews")
        .select("plan_code, rating")
        .eq("status", "approved")
        .not("plan_code", "is", null),
      supabase
        .from("reviews")
        .select("created_at")
        .eq("status", "approved")
        .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from("review_reward_ledger")
        .select("amount_usd, amount_krw, revoked_at"),
      supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved"),
    ]);

  // Per-plan aggregation
  const planMap = new Map<string, { count: number; sum: number }>();
  for (const r of (planRows as Array<{ plan_code: string; rating: number }> | null) || []) {
    const cur = planMap.get(r.plan_code) || { count: 0, sum: 0 };
    cur.count += 1;
    cur.sum += Number(r.rating) || 0;
    planMap.set(r.plan_code, cur);
  }
  const perPlan = [...planMap.entries()]
    .map(([plan_code, v]) => ({
      plan_code,
      review_count: v.count,
      avg_rating: v.count > 0 ? Math.round((v.sum / v.count) * 10) / 10 : null,
    }))
    .sort((a, b) => b.review_count - a.review_count);

  // Last-12-months trend (YYYY-MM bucket)
  const trendMap = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    trendMap.set(ym, 0);
  }
  for (const r of (monthRows as Array<{ created_at: string }> | null) || []) {
    const d = new Date(r.created_at);
    if (Number.isNaN(d.getTime())) continue;
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (trendMap.has(ym)) trendMap.set(ym, (trendMap.get(ym) || 0) + 1);
  }
  const monthlyTrend = [...trendMap.entries()].map(([month, count]) => ({ month, count }));

  // Reward totals
  const rewards = ((rewardRows as Array<{ amount_usd: number; amount_krw: number; revoked_at: string | null }> | null) || []).reduce(
    (acc, r) => {
      if (r.revoked_at) {
        acc.revoked_usd += Number(r.amount_usd) || 0;
        acc.revoked_krw += Number(r.amount_krw) || 0;
      } else {
        acc.paid_usd += Number(r.amount_usd) || 0;
        acc.paid_krw += Number(r.amount_krw) || 0;
      }
      return acc;
    },
    { paid_usd: 0, paid_krw: 0, revoked_usd: 0, revoked_krw: 0 }
  );

  // Today-approved (UTC day boundary — admin UI re-formats to KST)
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count: todayApprovedCount } = await supabase
    .from("reviews")
    .select("*", { count: "exact", head: true })
    .eq("status", "approved")
    .gte("approved_at", dayStart.toISOString());

  return NextResponse.json({
    base,
    perPlan,
    monthlyTrend,
    rewards,
    pendingCount: pendingCount ?? 0,
    todayApprovedCount: todayApprovedCount ?? 0,
    cumulativeApproved: cumulative ?? 0,
  });
}
