import Link from "next/link";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { AdminMiniBarChart } from "@/components/admin/reviews/AdminMiniBarChart";
import { PendingReviewCard } from "@/components/admin/reviews/PendingReviewCard";
import { ReviewsSubNav } from "@/components/admin/reviews/ReviewsSubNav";
import { formatKrw, getKstDayBounds } from "@/lib/admin/format";
import { getReviewConfig } from "@/lib/reviews/config";
import { getAdminReviewList, getReviewStats } from "@/lib/reviews/queries";
import { getRewardLedger } from "@/lib/reviews/reward";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminReviewsDashboard() {
  const config = getReviewConfig();

  // Pull dashboard data in parallel.
  const [stats, pendingResult, ledger] = await Promise.all([
    getReviewStats(),
    getAdminReviewList({ status: "pending", sort: "created_at_asc", limit: 12 }),
    getRewardLedger({ limit: 1, includeRevoked: false }),
  ]);

  // Counts that aren't in the stats view yet — quick exact-count probes.
  const supabase = getSupabaseAdminClient();
  let todayApprovedCount = 0;
  let trendBuckets: Array<{ label: string; value: number }> = [];
  if (supabase) {
    const { startIso, endIso } = getKstDayBounds();
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("status", "approved")
      .gte("approved_at", startIso)
      .lt("approved_at", endIso);
    todayApprovedCount = count ?? 0;

    // Last 30 days of new approved reviews grouped by KST day.
    const { data: trendRows } = await supabase
      .from("reviews")
      .select("created_at")
      .eq("status", "approved")
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
    const trendMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const label = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
      }).format(d).replace("-", "/");
      trendMap.set(label, 0);
    }
    for (const r of (trendRows as Array<{ created_at: string }> | null) || []) {
      const label = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(r.created_at)).replace("-", "/");
      if (trendMap.has(label)) trendMap.set(label, (trendMap.get(label) || 0) + 1);
    }
    trendBuckets = [...trendMap.entries()].map(([label, value]) => ({ label, value }));
  }

  const pendingCount = pendingResult.total;
  const cumulativeApproved = stats.total_reviews_approved;
  const avgRating = stats.avg_rating ?? 0;
  const totalPaidUsd = ledger.totals.paid_usd - ledger.totals.revoked_usd;
  const totalPaidKrw = ledger.totals.paid_krw - ledger.totals.revoked_krw;

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/40">
            Reviews
          </p>
          <h1 className="mt-1 text-2xl font-bold">운영 대시보드</h1>
          <p className="mt-2 text-sm text-cream/60">
            결제 + 키 발급 + {config.eligibilityAfterDays}일 경과 조건을 충족한 사용자만 작성합니다.
            승인 시 ${config.rewardUsd} 보상이 자동 지급되고 즉시 사용자 잔액에 반영됩니다.
          </p>
        </div>
        <Link
          href="/admin-panel/reviews/list?status=pending"
          className="rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:brightness-110"
        >
          검토 대기 전체 보기 →
        </Link>
      </header>

      <ReviewsSubNav />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <AdminStatCard label="검토 대기" value={String(pendingCount)} hint="status = pending" />
        <AdminStatCard
          label="오늘 승인"
          value={String(todayApprovedCount)}
          hint="KST 기준 자정 ~"
        />
        <AdminStatCard
          label="누적 승인"
          value={String(cumulativeApproved)}
          hint="status = approved"
        />
        <AdminStatCard
          label="평균 별점"
          value={avgRating ? avgRating.toFixed(1) : "—"}
          hint={`${cumulativeApproved}개 기준`}
        />
        <AdminStatCard
          label="누적 보상"
          value={`$${totalPaidUsd.toFixed(2)}`}
          hint={`${formatKrw(totalPaidKrw)} · 회수 차감 반영`}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
            별점 분포
          </p>
          <div className="mt-4 grid gap-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.rating_distribution[String(star) as "1" | "2" | "3" | "4" | "5"] ?? 0;
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
                  <div
                    className="h-2 overflow-hidden rounded-full bg-cream/10"
                    aria-hidden="true"
                  >
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
            최근 30일 신규 승인
          </p>
          <div className="mt-4">
            <AdminMiniBarChart data={trendBuckets} height={120} />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-5">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
            검토 대기 (오래된 순)
          </p>
          <Link
            href="/admin-panel/reviews/list?status=pending"
            className="text-xs font-bold text-[#D97757] hover:brightness-125"
          >
            전체 →
          </Link>
        </div>

        {pendingResult.rows.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-cream/15 bg-cream/5 px-4 py-10 text-center text-sm text-cream/50">
            대기 중인 리뷰가 없습니다.
          </p>
        ) : (
          <div className="mt-4 grid gap-2">
            {pendingResult.rows.map((review) => (
              <PendingReviewCard
                key={review.id}
                review={review}
                defaultRewardUsd={config.rewardUsd}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
