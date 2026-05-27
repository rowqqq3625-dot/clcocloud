import { cookies } from "next/headers";
import Link from "next/link";
import { ADMIN_CSRF_COOKIE } from "@/lib/admin/config";
import { issueCsrfTokenOnCookieJar } from "@/lib/admin/csrf";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { countOrphanKeys, loadPlanStock } from "@/lib/vending/stock";
import { getLowStockThreshold } from "@/lib/vending/helpers";
import { StockCard } from "@/components/admin/vending/StockCard";
import { VendingDashboardActions } from "./VendingDashboardActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PlanRow = { id: string; code: string; name_ko: string; price_krw: number; active: boolean; created_at: string; updated_at: string };

export default async function VendingDashboardPage() {
  const cookieJar = cookies();
  const csrfToken = cookieJar.get(ADMIN_CSRF_COOKIE)?.value || issueCsrfTokenOnCookieJar(cookieJar);
  const threshold = getLowStockThreshold();

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return <ConfigMissing />;
  }

  const [stock, orphanCount, plansRes, recentLogsRes, pendingOrdersRes] = await Promise.all([
    loadPlanStock(supabase),
    countOrphanKeys(supabase),
    supabase.from("plans").select("id,code,name_ko,price_krw,active,created_at,updated_at").order("price_krw"),
    supabase.from("vending_action_logs").select("id,action,target_order_no,plan_code,created_at").order("created_at", { ascending: false }).limit(10),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid_pending_key"),
  ]);

  const plans = (plansRes.data || []) as PlanRow[];
  const planNameByCode = new Map(plans.map((p) => [p.code, p.name_ko] as const));
  const lowStockPlans = stock.filter((s) => s.available_count <= threshold).map((s) => s.plan_code);
  const recentLogs = (recentLogsRes.data || []) as Array<{ id: string; action: string; target_order_no: string | null; plan_code: string | null; created_at: string }>;
  const pendingCount = pendingOrdersRes.count ?? 0;

  return (
    <div className="grid gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">VENDING</p>
          <h1 className="mt-1 text-xl font-bold">API 키 자판기</h1>
          <p className="mt-1 text-[11px] text-cream/50">
            결제 완료 1건당 정확히 키 1개를 잠금 출고합니다. 임계치: 가용 키 ≤ {threshold}.
          </p>
        </div>
        <VendingDashboardActions plans={plans} csrfToken={csrfToken} />
      </header>

      {lowStockPlans.length > 0 ? (
        <Banner tone="coral" title={`재고 부족 플랜 — ${lowStockPlans.join(", ")}`}>
          <Link href="/admin-panel/vending/keys" className="underline">키 추가하기 →</Link>
        </Banner>
      ) : null}

      {pendingCount > 0 ? (
        <Banner tone="amber" title={`키 발급 대기 주문 ${pendingCount}건 — 수동 매칭 필요`}>
          <Link href="/admin-panel/vending/match" className="underline">매칭 패널 →</Link>
        </Banner>
      ) : null}

      {orphanCount > 0 ? (
        <Banner tone="muted" title={`plan_id 미연결 키 ${orphanCount}건`}>
          마이그레이션 백필 후 잔여. <Link href="/admin-panel/vending/keys" className="underline">목록 확인 →</Link>
        </Banner>
      ) : null}

      <section>
        <h2 className="mb-3 text-sm font-bold text-cream/80">플랜별 재고</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {stock.length === 0 ? (
            <p className="text-xs text-cream/40">플랜이 등록되어 있지 않습니다.</p>
          ) : (
            stock.map((s) => (
              <StockCard key={s.plan_code} stock={s} threshold={threshold} planName={planNameByCode.get(s.plan_code)} />
            ))
          )}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between">
          <h2 className="text-sm font-bold text-cream/80">최근 활동</h2>
          <Link href="/admin-panel/vending/logs" className="text-[10px] font-mono uppercase tracking-[0.16em] text-cream/40 hover:text-cream/70">
            전체 로그 →
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
          {recentLogs.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-cream/40">활동 기록이 없습니다.</p>
          ) : (
            <ul className="divide-y divide-cream/5 text-xs">
              {recentLogs.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3 px-4 py-2 text-cream/80">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#F0E2D2]">{log.action}</span>
                  <span className="flex-1 truncate text-cream/60">
                    {log.plan_code ? `${log.plan_code} · ` : ""}
                    {log.target_order_no || "—"}
                  </span>
                  <span className="font-mono text-[10px] text-cream/40">{fmt(log.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Banner({ tone, title, children }: { tone: "coral" | "amber" | "muted"; title: string; children?: React.ReactNode }) {
  const cls = {
    coral: "border-[#D97757]/40 bg-[#D97757]/10 text-[#F0E2D2]",
    amber: "border-amber-500/40 bg-amber-500/10 text-amber-200",
    muted: "border-cream/15 bg-black/20 text-cream/70",
  }[tone];
  return (
    <div className={`rounded-2xl border px-5 py-3 text-sm ${cls}`}>
      <p className="font-bold">{title}</p>
      {children ? <p className="mt-1 text-xs">{children}</p> : null}
    </div>
  );
}

function ConfigMissing() {
  return (
    <p className="rounded-2xl border border-[#D97757]/30 bg-[#D97757]/10 px-5 py-4 text-sm font-semibold text-[#F0E2D2]">
      Supabase 환경변수가 설정되지 않았습니다.
    </p>
  );
}

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "—";
  }
}
