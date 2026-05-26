import { AdminBarChart, type BarDatum } from "@/components/admin/AdminBarChart";
import { AdminDonutChart, type DonutSlice } from "@/components/admin/AdminDonutChart";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { formatKrw, getKstDayBounds } from "@/lib/admin/format";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAID_STATUSES = new Set(["paid", "paid_pending_key"]);
const DAYS = 30;

type OrderRow = {
  amount: number | null;
  status: string;
  product_code: string | null;
  paid_at: string | null;
  created_at: string;
};

function toKstDateKey(iso: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(iso));
  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  return `${y}-${m}-${d}`;
}

async function loadAnalytics() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  // Compute the 30-day window in KST, then convert back to UTC for the query.
  const now = new Date();
  const { startIso: todayStartIso } = getKstDayBounds("Asia/Seoul", now);
  const windowStartMillis = new Date(todayStartIso).getTime() - (DAYS - 1) * 24 * 60 * 60 * 1000;
  const windowStartIso = new Date(windowStartMillis).toISOString();

  const { data: windowOrders } = await supabase
    .from("orders")
    .select("amount,status,product_code,paid_at,created_at")
    .gte("created_at", windowStartIso)
    .order("created_at", { ascending: true })
    .limit(10000);

  const orders = (windowOrders || []) as OrderRow[];

  // Pre-seed the date buckets so days without orders still show up.
  const buckets = new Map<string, { revenue: number; orderCount: number; paidCount: number }>();
  for (let i = 0; i < DAYS; i++) {
    const dayMillis = windowStartMillis + i * 24 * 60 * 60 * 1000;
    buckets.set(toKstDateKey(new Date(dayMillis).toISOString()), {
      revenue: 0,
      orderCount: 0,
      paidCount: 0,
    });
  }

  const statusCounts = new Map<string, number>();
  const productRevenue = new Map<string, number>();

  let totalRevenue = 0;
  let totalPaid = 0;

  for (const order of orders) {
    const isPaid = PAID_STATUSES.has(order.status);
    const amount = Number(order.amount) || 0;
    const bucketKey = toKstDateKey(order.paid_at || order.created_at);
    const bucket = buckets.get(bucketKey);
    if (bucket) {
      bucket.orderCount += 1;
      if (isPaid) {
        bucket.revenue += amount;
        bucket.paidCount += 1;
      }
    }
    statusCounts.set(order.status, (statusCounts.get(order.status) ?? 0) + 1);
    if (isPaid) {
      totalRevenue += amount;
      totalPaid += 1;
      const code = order.product_code || "UNKNOWN";
      productRevenue.set(code, (productRevenue.get(code) ?? 0) + amount);
    }
  }

  const dailyBars: BarDatum[] = Array.from(buckets.entries()).map(([key, value]) => {
    const [, month, day] = key.split("-");
    return {
      label: `${month}/${day}`,
      value: value.revenue,
      secondary: value.paidCount > 0 ? `${value.paidCount}건` : undefined,
    };
  });

  const conversion = orders.length > 0 ? (totalPaid / orders.length) * 100 : 0;
  const avgOrderValue = totalPaid > 0 ? totalRevenue / totalPaid : 0;

  return {
    dailyBars,
    statusCounts,
    productRevenue,
    totalRevenue,
    totalPaid,
    totalOrders: orders.length,
    conversion,
    avgOrderValue,
  };
}

const STATUS_COLORS: Record<string, string> = {
  paid: "#5A8A6B",
  paid_pending_key: "#E5B358",
  pending: "#A0917F",
  failed: "#D97757",
  cancelled: "#5C544A",
  refunded: "#9B7BB8",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "결제대기",
  paid: "결제완료",
  paid_pending_key: "키발급대기",
  failed: "실패",
  cancelled: "취소",
  refunded: "환불",
};

export default async function AdminAnalyticsPage() {
  const data = await loadAnalytics();

  if (!data) {
    return (
      <div className="grid gap-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">ANALYTICS</p>
          <h1 className="mt-1 text-xl font-bold">통계</h1>
        </header>
        <p className="rounded-2xl border border-[#D97757]/25 bg-[#D97757]/10 px-5 py-4 text-sm font-semibold text-[#F0E2D2]">
          Supabase 환경변수 설정이 필요합니다.
        </p>
      </div>
    );
  }

  const statusSlices: DonutSlice[] = Array.from(data.statusCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([status, count]) => ({
      label: STATUS_LABEL[status] || status,
      value: count,
      color: STATUS_COLORS[status] || "#A0917F",
    }));

  const productEntries = Array.from(data.productRevenue.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const productMax = Math.max(1, ...productEntries.map(([, v]) => v));

  return (
    <div className="grid gap-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">ANALYTICS</p>
        <h1 className="mt-1 text-xl font-bold">통계</h1>
        <p className="mt-1 text-xs text-cream/50">최근 {DAYS}일 (KST 기준)</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <AdminStatCard label={`${DAYS}일 매출`} value={formatKrw(data.totalRevenue)} hint={`${data.totalPaid}건 결제완료`} />
        <AdminStatCard label="평균 결제 금액" value={formatKrw(data.avgOrderValue)} />
        <AdminStatCard label="결제 전환율" value={`${data.conversion.toFixed(1)}%`} hint={`전체 ${data.totalOrders}건`} />
        <AdminStatCard
          label="일평균 매출"
          value={formatKrw(data.totalRevenue / DAYS)}
        />
      </div>

      <section className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/70 p-5">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-cream/80">일별 매출 (₩)</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            DAILY · {DAYS}D
          </span>
        </div>
        <div className="h-[220px] w-full overflow-x-auto">
          <AdminBarChart
            data={data.dailyBars}
            height={200}
            barWidth={20}
            barGap={6}
            hideValueLabel
          />
        </div>
        <p className="mt-2 text-[10px] text-cream/40">
          * 결제완료/키발급대기 상태의 주문 합계, 막대 아래 숫자는 결제완료 건수.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/70 p-5 lg:col-span-2">
          <h2 className="mb-3 text-sm font-bold text-cream/80">주문 상태 분포</h2>
          <div className="flex items-center gap-5">
            <div className="h-[180px] w-[180px] shrink-0">
              <AdminDonutChart
                data={statusSlices}
                centerLabel={data.totalOrders.toLocaleString("ko-KR")}
                centerSub="총 주문"
              />
            </div>
            <ul className="grid gap-1.5 text-[11px]">
              {statusSlices.length === 0 ? (
                <li className="text-cream/40">데이터 없음</li>
              ) : (
                statusSlices.map((slice) => (
                  <li key={slice.label} className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: slice.color }} />
                    <span className="text-cream/80">{slice.label}</span>
                    <span className="font-mono text-cream/50">{slice.value.toLocaleString("ko-KR")}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <section className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/70 p-5 lg:col-span-3">
          <h2 className="mb-3 text-sm font-bold text-cream/80">상품별 매출 (TOP 8)</h2>
          {productEntries.length === 0 ? (
            <p className="py-8 text-center text-xs text-cream/40">결제완료 주문이 없습니다.</p>
          ) : (
            <ul className="grid gap-2.5">
              {productEntries.map(([code, revenue]) => {
                const pct = (revenue / productMax) * 100;
                return (
                  <li key={code} className="grid gap-1">
                    <div className="flex items-baseline justify-between font-mono text-[11px]">
                      <span className="text-cream/80">{code}</span>
                      <span className="text-cream/60">{formatKrw(revenue)}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-cream/5">
                      <div
                        className="h-full rounded-full bg-[#D97757]/85"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
