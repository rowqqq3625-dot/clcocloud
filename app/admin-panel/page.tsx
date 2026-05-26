import Link from "next/link";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  formatKrw,
  formatKstDateTime,
  getKstDayBounds,
  maskEmail,
  maskName,
  maskPhone,
} from "@/lib/admin/format";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAID_STATUSES = ["paid", "paid_pending_key"];

type OrderRow = {
  id: string;
  order_no: string;
  product_code: string | null;
  buyer_name: string | null;
  user_email: string | null;
  contact_email: string | null;
  amount: number | null;
  status: string;
  paid_at: string | null;
  created_at: string;
};

type AuditRow = {
  id: string;
  admin_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
};

type TopupInquiryLite = {
  id: string;
  inquiry_no: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  desired_usd: number | null;
  amount_krw: number | null;
  status: string;
  created_at: string;
};

type BalanceRequestLite = {
  id: string;
  contact_email: string | null;
  request_amount: number | string | null;
  status: string;
  created_at: string;
};

type NewMember = {
  provider: string;
  providerAccountId: string;
  email: string | null;
  buyerName: string | null;
  firstSeenAt: string;
};

async function loadStats() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  const { startIso, endIso } = getKstDayBounds();

  // Pull a broad slice of recent orders once and reuse it for "new members
  // today" + active members aggregation. Cheaper than running multiple
  // aggregation queries.
  const allMembersQuery = supabase
    .from("orders")
    .select(
      "user_provider,user_provider_account_id,user_email,contact_email,buyer_name,created_at"
    )
    .not("user_provider_account_id", "is", null)
    .order("created_at", { ascending: true })
    .limit(20000);

  const [
    { data: todayRows },
    { data: cumulativeRows },
    { data: allMembersRows },
    { count: activeKeysCount },
    { data: recentOrders },
    { data: recentAudits },
    { data: recentTopups },
    { data: recentBalances },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("amount,paid_at")
      .in("status", PAID_STATUSES)
      .gte("paid_at", startIso)
      .lt("paid_at", endIso),
    supabase
      .from("orders")
      .select("amount")
      .in("status", PAID_STATUSES)
      .limit(10000),
    allMembersQuery,
    supabase
      .from("api_key_inventory")
      .select("*", { count: "exact", head: true })
      .eq("status", "issued"),
    supabase
      .from("orders")
      .select(
        "id,order_no,product_code,buyer_name,user_email,contact_email,amount,status,paid_at,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("admin_audit_logs")
      .select("id,admin_email,action,target_type,target_id,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("topup_inquiries")
      .select("id,inquiry_no,buyer_name,buyer_phone,desired_usd,amount_krw,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("balance_requests")
      .select("id,contact_email,request_amount,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const sumAmount = (rows: Array<{ amount: number | null }> | null | undefined) =>
    (rows || []).reduce((acc, row) => acc + (Number(row.amount) || 0), 0);

  // Reduce the time-ordered slice into the earliest-known appearance per
  // (provider, accountId). Anything whose first-seen falls inside today's KST
  // window counts as a new member.
  const firstSeen = new Map<string, NewMember>();
  for (const row of (allMembersRows || []) as Array<{
    user_provider: string | null;
    user_provider_account_id: string | null;
    user_email: string | null;
    contact_email: string | null;
    buyer_name: string | null;
    created_at: string;
  }>) {
    const provider = row.user_provider || "unknown";
    const accountId = row.user_provider_account_id;
    if (!accountId) continue;
    const key = `${provider}:${accountId}`;
    if (firstSeen.has(key)) continue;
    firstSeen.set(key, {
      provider,
      providerAccountId: String(accountId),
      email: row.user_email || row.contact_email,
      buyerName: row.buyer_name,
      firstSeenAt: row.created_at,
    });
  }

  const newMembersToday: NewMember[] = [];
  for (const member of firstSeen.values()) {
    if (member.firstSeenAt >= startIso && member.firstSeenAt < endIso) {
      newMembersToday.push(member);
    }
  }
  newMembersToday.sort((a, b) => b.firstSeenAt.localeCompare(a.firstSeenAt));

  return {
    todayRevenue: sumAmount(todayRows),
    cumulativeRevenue: sumAmount(cumulativeRows),
    activeMembers: firstSeen.size,
    newMembersToday,
    activeKeys: activeKeysCount ?? 0,
    recentOrders: (recentOrders || []) as OrderRow[],
    recentAudits: (recentAudits || []) as AuditRow[],
    recentTopups: (recentTopups || []) as TopupInquiryLite[],
    recentBalances: (recentBalances || []) as BalanceRequestLite[],
  };
}

const STATUS_LABEL: Record<string, string> = {
  pending: "결제대기",
  paid: "결제완료",
  paid_pending_key: "키발급대기",
  failed: "실패",
  cancelled: "취소",
  refunded: "환불",
};

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "paid"
      ? "bg-emerald-500/15 text-emerald-300"
      : status === "paid_pending_key"
      ? "bg-amber-500/15 text-amber-300"
      : status === "refunded" || status === "failed" || status === "cancelled"
      ? "bg-[#D97757]/15 text-[#F0E2D2]"
      : "bg-cream/10 text-cream/70";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${tone}`}>
      {STATUS_LABEL[status] || status}
    </span>
  );
}

export default async function AdminPanelHome() {
  const stats = await loadStats();

  if (!stats) {
    return (
      <div className="grid gap-6">
        <header>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">OVERVIEW</p>
          <h1 className="mt-1 text-xl font-bold">대시보드</h1>
        </header>
        <p className="rounded-2xl border border-[#D97757]/25 bg-[#D97757]/10 px-5 py-4 text-sm font-semibold text-[#F0E2D2]">
          Supabase 환경변수 설정이 필요합니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">OVERVIEW</p>
        <h1 className="mt-1 text-xl font-bold">대시보드</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <AdminStatCard label="오늘 매출 (KST)" value={formatKrw(stats.todayRevenue)} />
        <AdminStatCard label="누적 매출" value={formatKrw(stats.cumulativeRevenue)} />
        <AdminStatCard
          label="오늘 신규 회원"
          value={stats.newMembersToday.length.toLocaleString("ko-KR")}
          hint="첫 주문 기준"
        />
        <AdminStatCard label="활성 회원" value={stats.activeMembers.toLocaleString("ko-KR")} hint="누적 고유 OAuth" />
        <AdminStatCard label="발급된 API 키" value={stats.activeKeys.toLocaleString("ko-KR")} />
      </div>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-cream/80">오늘 신규 회원</h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            FIRST ORDER · KST
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="w-[12%] px-3 py-2 font-mono">Provider</th>
                <th className="w-[34%] px-3 py-2 font-mono">이메일</th>
                <th className="w-[20%] px-3 py-2 font-mono">이름</th>
                <th className="w-[34%] px-3 py-2 font-mono">첫 주문 시각</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/5 text-cream/85">
              {stats.newMembersToday.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-cream/40">
                    오늘 신규 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                stats.newMembersToday.slice(0, 10).map((m) => {
                  const href = `/admin-panel/members/${encodeURIComponent(m.provider)}/${encodeURIComponent(
                    m.providerAccountId
                  )}`;
                  return (
                    <tr key={`${m.provider}:${m.providerAccountId}`} className="transition hover:bg-cream/5">
                      <td className="px-3 py-2 font-mono text-[10px] uppercase">
                        <Link href={href} className="block hover:text-[#D97757]">
                          {m.provider}
                        </Link>
                      </td>
                      <td className="px-3 py-2 truncate">
                        <Link href={href} className="block hover:text-[#D97757]">
                          {maskEmail(m.email)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 truncate">
                        <Link href={href} className="block hover:text-[#D97757]">
                          {maskName(m.buyerName)}
                        </Link>
                      </td>
                      <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                        {formatKstDateTime(m.firstSeenAt)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-cream/80">최근 주문</h2>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="w-[18%] px-3 py-2 font-mono">주문번호</th>
                <th className="w-[14%] px-3 py-2 font-mono">상품</th>
                <th className="w-[20%] px-3 py-2 font-mono">고객</th>
                <th className="w-[14%] px-3 py-2 font-mono">금액</th>
                <th className="w-[14%] px-3 py-2 font-mono">상태</th>
                <th className="w-[20%] px-3 py-2 font-mono">생성</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/5 text-cream/85">
              {stats.recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-cream/40">
                    주문이 없습니다.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-3 py-2 font-mono text-[11px]">{order.order_no}</td>
                    <td className="px-3 py-2">{order.product_code || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="truncate">{maskName(order.buyer_name)}</div>
                      <div className="truncate text-[10px] text-cream/40">
                        {maskEmail(order.user_email || order.contact_email)}
                      </div>
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">{formatKrw(order.amount)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                      {formatKstDateTime(order.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-bold text-cream/80">최근 고객 문의 / 잔액요청</h2>
          <Link href="/admin-panel/inquiries" className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40 hover:text-[#D97757]">
            전체 보기 →
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
            <div className="bg-[#15140F] px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/50">
                잔액충전 문의 (topup)
              </p>
            </div>
            {stats.recentTopups.length === 0 ? (
              <p className="px-3 py-6 text-center text-[11px] text-cream/40">접수된 문의가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-cream/5">
                {stats.recentTopups.map((row) => (
                  <li key={row.id} className="px-3 py-2 text-[11px]">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[10px] text-cream/60">{row.inquiry_no || row.id.slice(0, 8)}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cream/40">{row.status}</span>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between gap-2">
                      <span className="truncate text-cream/85">
                        {maskName(row.buyer_name)} · {maskPhone(row.buyer_phone)}
                      </span>
                      <span className="font-mono tabular-nums text-cream/60">
                        {row.desired_usd ? `$${row.desired_usd}` : "—"} / {formatKrw(row.amount_krw)}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-cream/40">{formatKstDateTime(row.created_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
            <div className="bg-[#15140F] px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/50">
                잔액 추가요청 (balance)
              </p>
            </div>
            {stats.recentBalances.length === 0 ? (
              <p className="px-3 py-6 text-center text-[11px] text-cream/40">접수된 요청이 없습니다.</p>
            ) : (
              <ul className="divide-y divide-cream/5">
                {stats.recentBalances.map((row) => (
                  <li key={row.id} className="px-3 py-2 text-[11px]">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate font-mono text-cream/85">{maskEmail(row.contact_email)}</span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-cream/40">{row.status}</span>
                    </div>
                    <div className="mt-0.5 flex items-baseline justify-between gap-2">
                      <span className="font-mono tabular-nums text-cream/60">
                        {row.request_amount ? `$${row.request_amount}` : "—"}
                      </span>
                      <span className="font-mono text-[10px] text-cream/40">{formatKstDateTime(row.created_at)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold text-cream/80">최근 감사 로그</h2>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
          <table className="w-full table-fixed text-left text-xs">
            <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="w-[26%] px-3 py-2 font-mono">시각</th>
                <th className="w-[26%] px-3 py-2 font-mono">관리자</th>
                <th className="w-[22%] px-3 py-2 font-mono">액션</th>
                <th className="w-[26%] px-3 py-2 font-mono">대상</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/5 text-cream/85">
              {stats.recentAudits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-cream/40">
                    감사 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                stats.recentAudits.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 font-mono text-[10px]">{formatKstDateTime(row.created_at)}</td>
                    <td className="px-3 py-2">{row.admin_email || "—"}</td>
                    <td className="px-3 py-2">{row.action}</td>
                    <td className="px-3 py-2">
                      {row.target_type ? `${row.target_type}:${row.target_id || ""}` : "—"}
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
