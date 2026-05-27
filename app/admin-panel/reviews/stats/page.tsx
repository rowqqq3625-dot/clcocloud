import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminMiniBarChart } from "@/components/admin/reviews/AdminMiniBarChart";
import { ReviewsSubNav } from "@/components/admin/reviews/ReviewsSubNav";
import { formatKrw, getKstDayBounds } from "@/lib/admin/format";
import { getReviewStats } from "@/lib/reviews/queries";
import { getRewardLedger } from "@/lib/reviews/reward";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminReviewStatsPage() {
  const base = await getReviewStats();
  const supabase = getSupabaseAdminClient();

  let perPlan: Array<{ plan_code: string; review_count: number; avg_rating: number | null }> = [];
  let monthlyTrend: Array<{ label: string; value: number }> = [];
  let pendingCount = 0;
  let cumulativeApproved = base.total_reviews_approved;
  let todayApprovedCount = 0;

  if (supabase) {
    const [planRes, trendRes, pendingRes, todayRes] = await Promise.all([
      supabase.from("reviews").select("plan_code, rating").eq("status", "approved").not("plan_code", "is", null),
      supabase
        .from("reviews")
        .select("created_at")
        .eq("status", "approved")
        .gte("created_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase
        .from("reviews")
        .select("*", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("approved_at", getKstDayBounds().startIso)
        .lt("approved_at", getKstDayBounds().endIso),
    ]);

    const planMap = new Map<string, { count: number; sum: number }>();
    for (const r of (planRes.data as Array<{ plan_code: string; rating: number }> | null) || []) {
      const cur = planMap.get(r.plan_code) || { count: 0, sum: 0 };
      cur.count += 1;
      cur.sum += Number(r.rating) || 0;
      planMap.set(r.plan_code, cur);
    }
    perPlan = [...planMap.entries()]
      .map(([plan_code, v]) => ({
        plan_code,
        review_count: v.count,
        avg_rating: v.count > 0 ? Math.round((v.sum / v.count) * 10) / 10 : null,
      }))
      .sort((a, b) => b.review_count - a.review_count);

    const trendMap = new Map<string, number>();
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const ym = `${d.getMonth() + 1}월`;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      trendMap.set(`${ym}|${key}`, 0);
    }
    for (const r of (trendRes.data as Array<{ created_at: string }> | null) || []) {
      const d = new Date(r.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const matchKey = [...trendMap.keys()].find((k) => k.endsWith(`|${key}`));
      if (matchKey) trendMap.set(matchKey, (trendMap.get(matchKey) || 0) + 1);
    }
    monthlyTrend = [...trendMap.entries()].map(([k, value]) => ({
      label: k.split("|")[0],
      value,
    }));

    pendingCount = pendingRes.count ?? 0;
    cumulativeApproved = base.total_reviews_approved;
    todayApprovedCount = todayRes.count ?? 0;
  }

  const ledger = await getRewardLedger({ limit: 1, includeRevoked: true });

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/40">
            Reviews
          </p>
          <h1 className="mt-1 text-2xl font-bold">통계 대시보드</h1>
          <p className="mt-2 text-sm text-cream/60">
            review_stats_view 기반 지표와 운영자 관점의 보조 지표를 함께 표시합니다.
          </p>
        </div>
        <a
          href="/api/admin/reviews/stats/export"
          className="rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:brightness-110"
        >
          CSV 내보내기
        </a>
      </header>

      <ReviewsSubNav />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="검토 대기"
          value={String(pendingCount)}
          hint="status=pending"
        />
        <AdminStatCard
          label="오늘 승인"
          value={String(todayApprovedCount)}
          hint="KST 자정 기준"
        />
        <AdminStatCard
          label="누적 승인"
          value={String(cumulativeApproved)}
          hint={`평균 ★ ${base.avg_rating ?? "—"}`}
        />
        <AdminStatCard
          label="누적 보상 (USD)"
          value={`$${(ledger.totals.paid_usd - ledger.totals.revoked_usd).toFixed(2)}`}
          hint={formatKrw(ledger.totals.paid_krw - ledger.totals.revoked_krw)}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="누적 구매자"
          value={String(base.total_unique_buyers)}
          hint={`결제 주문 ${base.total_orders_paid}건`}
        />
        <AdminStatCard
          label="재구매율"
          value={`${base.repurchase_rate}%`}
          hint="2회 이상 결제 / 전체 구매자"
        />
        <AdminStatCard
          label="최근 30일 신규"
          value={String(base.recent_30d_reviews_count)}
        />
        <AdminStatCard
          label="누적 회수"
          value={`$${ledger.totals.revoked_usd.toFixed(2)}`}
          hint={formatKrw(ledger.totals.revoked_krw)}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
            별점 분포
          </p>
          <div className="mt-4 grid gap-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count =
                base.rating_distribution[String(star) as "1" | "2" | "3" | "4" | "5"] ?? 0;
              const pct =
                cumulativeApproved > 0
                  ? Math.round((count / cumulativeApproved) * 1000) / 10
                  : 0;
              return (
                <div
                  key={star}
                  className="grid grid-cols-[44px_minmax(0,1fr)_70px] items-center gap-3 text-xs"
                >
                  <span className="font-mono font-bold text-[#D97757]">
                    {"★".repeat(star)}
                  </span>
                  <div className="h-2 overflow-hidden rounded-full bg-cream/10" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-[#D97757]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-right font-mono text-cream/70 tabular-nums">
                    {count}
                    <span className="ml-1 text-cream/40">·</span>
                    <span className="ml-1 text-cream/40">{pct}%</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
            월별 승인 추이 (최근 12개월)
          </p>
          <div className="mt-4">
            <AdminMiniBarChart data={monthlyTrend} height={120} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
          플랜별 평균 별점 / 리뷰 수
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-cream/10 text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="py-2 pr-4">플랜</th>
                <th className="py-2 pr-4">리뷰 수</th>
                <th className="py-2 pr-4">평균 별점</th>
              </tr>
            </thead>
            <tbody>
              {perPlan.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-cream/40">
                    플랜 정보가 있는 승인된 리뷰가 없습니다.
                  </td>
                </tr>
              ) : (
                perPlan.map((p) => (
                  <tr key={p.plan_code} className="border-b border-cream/5">
                    <td className="py-2.5 pr-4 font-mono text-cream/80">{p.plan_code}</td>
                    <td className="py-2.5 pr-4 font-mono text-cream/70">{p.review_count}</td>
                    <td className="py-2.5 pr-4 font-mono text-[#D97757]">
                      {p.avg_rating != null ? p.avg_rating.toFixed(1) : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
