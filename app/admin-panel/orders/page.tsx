import Link from "next/link";
import { AdminOrderDetailModal } from "@/components/admin/AdminOrderDetailModal";
import { AdminOrdersCsvButton } from "@/components/admin/AdminOrdersCsvButton";
import {
  formatKrw,
  formatKstDateTime,
  maskEmail,
  maskName,
  maskPhone,
} from "@/lib/admin/format";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  order_no: string;
  product_kind: string | null;
  product_code: string | null;
  amount: number | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  user_email: string | null;
  contact_email: string | null;
  status: string;
  pay_method: string | null;
  paid_at: string | null;
  created_at: string;
};

const PAGE_SIZE = 30;

const STATUS_FILTERS: Array<{ value: string; label: string }> = [
  { value: "all", label: "전체" },
  { value: "pending", label: "결제대기" },
  { value: "paid", label: "결제완료" },
  { value: "paid_pending_key", label: "키발급대기" },
  { value: "failed", label: "실패" },
  { value: "cancelled", label: "취소" },
  { value: "refunded", label: "환불" },
];

const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  STATUS_FILTERS.filter((f) => f.value !== "all").map((f) => [f.value, f.label])
);

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

async function loadOrders({
  status,
  search,
  page,
}: {
  status: string;
  search: string;
  page: number;
}): Promise<{ orders: OrderRow[]; totalCount: number; totalPages: number } | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  let query = supabase
    .from("orders")
    .select(
      "id,order_no,product_kind,product_code,amount,buyer_name,buyer_phone,user_email,contact_email,status,pay_method,paid_at,created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (search) {
    const escaped = search.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.or(
      `order_no.ilike.%${escaped}%,buyer_name.ilike.%${escaped}%,user_email.ilike.%${escaped}%,contact_email.ilike.%${escaped}%`
    );
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const { data, count } = await query.range(from, to);

  const totalCount = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  return { orders: (data || []) as OrderRow[], totalCount, totalPages };
}

function buildHref(params: { status: string; q: string; page: number; orderId?: string }) {
  const sp = new URLSearchParams();
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.page > 1) sp.set("page", String(params.page));
  if (params.orderId) sp.set("orderId", params.orderId);
  const query = sp.toString();
  return `/admin-panel/orders${query ? `?${query}` : ""}`;
}

type PageProps = {
  searchParams?: { status?: string; q?: string; page?: string; orderId?: string };
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const status = (searchParams?.status || "all").toLowerCase();
  const validStatus = STATUS_FILTERS.some((f) => f.value === status) ? status : "all";
  const search = (searchParams?.q || "").trim().slice(0, 80);
  const page = Math.max(1, Number(searchParams?.page) || 1);

  const result = await loadOrders({ status: validStatus, search, page });

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">ORDERS</p>
          <h1 className="mt-1 text-xl font-bold">주문 관리</h1>
          {result ? (
            <p className="mt-1 text-xs text-cream/50">
              총 {result.totalCount.toLocaleString("ko-KR")}건
              {validStatus !== "all" ? ` · 상태 ${STATUS_LABEL[validStatus]}` : ""}
              {search ? ` · 검색 "${search}"` : ""}
            </p>
          ) : null}
        </div>
        <AdminOrdersCsvButton />
      </header>

      {!result ? (
        <p className="rounded-2xl border border-[#D97757]/25 bg-[#D97757]/10 px-5 py-4 text-sm font-semibold text-[#F0E2D2]">
          Supabase 환경변수 설정이 필요합니다.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_FILTERS.map((filter) => {
                const active = validStatus === filter.value;
                return (
                  <Link
                    key={filter.value}
                    href={buildHref({ status: filter.value, q: search, page: 1 })}
                    className={[
                      "rounded-full px-3 py-1.5 text-[11px] font-bold transition",
                      active
                        ? "bg-[#D97757] text-cream"
                        : "border border-cream/15 text-cream/70 hover:border-[#D97757] hover:text-cream",
                    ].join(" ")}
                  >
                    {filter.label}
                  </Link>
                );
              })}
            </div>
            <form
              action="/admin-panel/orders"
              method="get"
              className="ml-auto flex items-center gap-2"
            >
              {validStatus !== "all" ? <input type="hidden" name="status" value={validStatus} /> : null}
              <input
                type="search"
                name="q"
                defaultValue={search}
                placeholder="주문번호/이름/이메일"
                maxLength={80}
                className="w-[240px] rounded-full border border-cream/15 bg-black/40 px-4 py-2 text-xs text-cream outline-none focus:border-[#D97757]"
              />
              <button
                type="submit"
                className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b]"
              >
                검색
              </button>
            </form>
          </div>

          <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
                <tr>
                  <th className="w-[14%] px-3 py-2 font-mono">주문번호</th>
                  <th className="w-[10%] px-3 py-2 font-mono">상품</th>
                  <th className="w-[18%] px-3 py-2 font-mono">고객</th>
                  <th className="w-[12%] px-3 py-2 font-mono">연락처</th>
                  <th className="w-[10%] px-3 py-2 font-mono text-right">금액</th>
                  <th className="w-[10%] px-3 py-2 font-mono">상태</th>
                  <th className="w-[12%] px-3 py-2 font-mono">결제</th>
                  <th className="w-[14%] px-3 py-2 font-mono">생성</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream/5 text-cream/85">
                {result.orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center text-cream/40">
                      조건에 맞는 주문이 없습니다.
                    </td>
                  </tr>
                ) : (
                  result.orders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-cream/5">
                      <td className="px-3 py-2">
                        <Link
                          href={buildHref({ status: validStatus, q: search, page, orderId: order.id })}
                          className="font-mono text-[11px] text-cream hover:text-[#D97757]"
                          scroll={false}
                        >
                          {order.order_no}
                        </Link>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-mono text-[11px]">{order.product_code || "—"}</div>
                        <div className="text-[10px] text-cream/40">{order.product_kind || ""}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="truncate">{maskName(order.buyer_name)}</div>
                        <div className="truncate text-[10px] text-cream/55">
                          {maskEmail(order.user_email || order.contact_email)}
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-[11px] tabular-nums text-cream/85">
                        {maskPhone(order.buyer_phone)}
                      </td>
                      <td className="px-3 py-2 font-mono tabular-nums text-right">{formatKrw(order.amount)}</td>
                      <td className="px-3 py-2"><StatusBadge status={order.status} /></td>
                      <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                        {order.paid_at ? formatKstDateTime(order.paid_at) : "—"}
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

          {result.totalPages > 1 ? (
            <nav className="flex items-center justify-center gap-1 text-xs" aria-label="페이지네이션">
              {Array.from({ length: result.totalPages }, (_, idx) => idx + 1)
                .filter((p) => Math.abs(p - page) <= 3 || p === 1 || p === result.totalPages)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const gap = prev && p - prev > 1;
                  const href = buildHref({ status: validStatus, q: search, page: p });
                  return (
                    <span key={p} className="flex items-center gap-1">
                      {gap ? <span className="px-1 text-cream/40">···</span> : null}
                      <Link
                        href={href}
                        className={[
                          "rounded-full px-3 py-1 font-mono",
                          p === page
                            ? "bg-[#D97757] text-cream"
                            : "border border-cream/15 text-cream/70 hover:border-[#D97757] hover:text-cream",
                        ].join(" ")}
                      >
                        {p}
                      </Link>
                    </span>
                  );
                })}
            </nav>
          ) : null}

          <p className="text-[10px] text-cream/40">
            * 환불·수동 키 발급·알림 재전송 등 실행 액션은 후속 PR에서 추가됩니다.
          </p>
        </>
      )}

      <AdminOrderDetailModal />
    </div>
  );
}
