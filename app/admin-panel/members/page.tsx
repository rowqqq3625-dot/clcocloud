import Link from "next/link";
import { AdminMembersCsvButton } from "@/components/admin/AdminMembersCsvButton";
import {
  formatKrw,
  formatKstDateTime,
  maskEmail,
  maskName,
} from "@/lib/admin/format";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OrderJoinRow = {
  user_provider: string | null;
  user_provider_account_id: string | null;
  user_email: string | null;
  contact_email: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  amount: number | null;
  status: string;
  created_at: string;
  paid_at: string | null;
};

type MemberSummary = {
  key: string;
  provider: string;
  providerAccountId: string;
  email: string | null;
  buyerName: string | null;
  orderCount: number;
  paidCount: number;
  cumulativeKrw: number;
  lastOrderAt: string;
};

const PAID_STATUSES = new Set(["paid", "paid_pending_key"]);
const PAGE_SIZE = 50;

type SortKey = "recent" | "revenue" | "orders" | "paid";
type FilterKey = "all" | "paid_only" | "unpaid_only";

const SORT_KEYS: SortKey[] = ["recent", "revenue", "orders", "paid"];
const FILTER_KEYS: FilterKey[] = ["all", "paid_only", "unpaid_only"];

const SORT_LABEL: Record<SortKey, string> = {
  recent: "최근 주문순",
  revenue: "누적 결제 내림차순",
  orders: "주문 수 내림차순",
  paid: "결제 완료 수 내림차순",
};

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "전체",
  paid_only: "결제완료 1건+",
  unpaid_only: "무결제 회원만",
};

async function loadMembers(
  search: string,
  page: number,
  sort: SortKey,
  filter: FilterKey
): Promise<{ members: MemberSummary[]; totalCount: number; totalPages: number } | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  // Pull recent orders (capped) and aggregate in JS. For the current order
  // volume this is comfortably fast; if/when this grows we'll move to a
  // server-side RPC view.
  let query = supabase
    .from("orders")
    .select(
      "user_provider,user_provider_account_id,user_email,contact_email,buyer_name,buyer_phone,amount,status,created_at,paid_at"
    )
    .order("created_at", { ascending: false })
    .limit(5000);

  if (search) {
    const escaped = search.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.or(
      `user_email.ilike.%${escaped}%,contact_email.ilike.%${escaped}%,buyer_name.ilike.%${escaped}%`
    );
  }

  const { data } = await query;
  if (!data) return { members: [], totalCount: 0, totalPages: 0 };

  const byMember = new Map<string, MemberSummary>();
  for (const row of data as OrderJoinRow[]) {
    const provider = row.user_provider || "unknown";
    const accountId = row.user_provider_account_id || row.user_email || row.contact_email;
    if (!accountId) continue;
    const key = `${provider}:${accountId}`;
    const prev = byMember.get(key);
    const amount = Number(row.amount) || 0;
    const isPaid = PAID_STATUSES.has(row.status);

    if (!prev) {
      byMember.set(key, {
        key,
        provider,
        providerAccountId: accountId,
        email: row.user_email || row.contact_email,
        buyerName: row.buyer_name,
        orderCount: 1,
        paidCount: isPaid ? 1 : 0,
        cumulativeKrw: isPaid ? amount : 0,
        lastOrderAt: row.created_at,
      });
    } else {
      prev.orderCount += 1;
      if (isPaid) {
        prev.paidCount += 1;
        prev.cumulativeKrw += amount;
      }
      // Most recent row wins (query is ordered DESC).
      if (!prev.email && (row.user_email || row.contact_email)) {
        prev.email = row.user_email || row.contact_email;
      }
      if (!prev.buyerName && row.buyer_name) prev.buyerName = row.buyer_name;
    }
  }

  let allMembers = Array.from(byMember.values());

  if (filter === "paid_only") {
    allMembers = allMembers.filter((m) => m.paidCount > 0);
  } else if (filter === "unpaid_only") {
    allMembers = allMembers.filter((m) => m.paidCount === 0);
  }

  const sorters: Record<SortKey, (a: MemberSummary, b: MemberSummary) => number> = {
    recent: (a, b) => b.lastOrderAt.localeCompare(a.lastOrderAt),
    revenue: (a, b) => b.cumulativeKrw - a.cumulativeKrw,
    orders: (a, b) => b.orderCount - a.orderCount,
    paid: (a, b) => b.paidCount - a.paidCount,
  };
  allMembers.sort(sorters[sort]);

  const totalCount = allMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const members = allMembers.slice(start, start + PAGE_SIZE);
  return { members, totalCount, totalPages };
}

const PROVIDER_LABEL: Record<string, string> = {
  google: "Google",
  kakao: "Kakao",
  naver: "Naver",
};

type PageProps = {
  searchParams?: { q?: string; page?: string; sort?: string; filter?: string };
};

function buildHref(base: { q: string; page: number; sort: SortKey; filter: FilterKey }, override: Partial<typeof base> = {}): string {
  const merged = { ...base, ...override };
  const sp = new URLSearchParams();
  if (merged.q) sp.set("q", merged.q);
  if (merged.page > 1) sp.set("page", String(merged.page));
  if (merged.sort !== "recent") sp.set("sort", merged.sort);
  if (merged.filter !== "all") sp.set("filter", merged.filter);
  const query = sp.toString();
  return `/admin-panel/members${query ? `?${query}` : ""}`;
}

export default async function AdminMembersPage({ searchParams }: PageProps) {
  const rawQ = searchParams?.q?.trim() || "";
  const search = rawQ.slice(0, 80);
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const sort = (SORT_KEYS as string[]).includes(searchParams?.sort || "")
    ? (searchParams!.sort as SortKey)
    : ("recent" as SortKey);
  const filter = (FILTER_KEYS as string[]).includes(searchParams?.filter || "")
    ? (searchParams!.filter as FilterKey)
    : ("all" as FilterKey);

  const result = await loadMembers(search, page, sort, filter);
  const baseHref = { q: search, page: 1, sort, filter };

  return (
    <div className="grid gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">MEMBERS</p>
          <h1 className="mt-1 text-xl font-bold">회원 관리</h1>
          {result ? (
            <p className="mt-1 text-xs text-cream/50">
              총 {result.totalCount.toLocaleString("ko-KR")}명 · 정렬 {SORT_LABEL[sort]} · 필터 {FILTER_LABEL[filter]}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <AdminMembersCsvButton />
          <form action="/admin-panel/members" method="get" className="flex items-center gap-2">
            {sort !== "recent" ? <input type="hidden" name="sort" value={sort} /> : null}
            {filter !== "all" ? <input type="hidden" name="filter" value={filter} /> : null}
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder="이메일/이름 검색"
              maxLength={80}
              className="w-[220px] rounded-full border border-cream/15 bg-black/40 px-4 py-2 text-xs text-cream outline-none focus:border-[#D97757]"
            />
            <button type="submit" className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b]">
              검색
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="self-center font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">정렬</span>
          {SORT_KEYS.map((key) => (
            <Link
              key={key}
              href={buildHref(baseHref, { sort: key, page: 1 })}
              className={[
                "rounded-full px-3 py-1 text-[11px] font-bold transition",
                sort === key
                  ? "bg-[#D97757] text-cream"
                  : "border border-cream/15 text-cream/70 hover:border-[#D97757] hover:text-cream",
              ].join(" ")}
            >
              {SORT_LABEL[key]}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="self-center font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">필터</span>
          {FILTER_KEYS.map((key) => (
            <Link
              key={key}
              href={buildHref(baseHref, { filter: key, page: 1 })}
              className={[
                "rounded-full px-3 py-1 text-[11px] font-bold transition",
                filter === key
                  ? "bg-[#D97757] text-cream"
                  : "border border-cream/15 text-cream/70 hover:border-[#D97757] hover:text-cream",
              ].join(" ")}
            >
              {FILTER_LABEL[key]}
            </Link>
          ))}
        </div>
      </div>

      {!result ? (
        <p className="rounded-2xl border border-[#D97757]/25 bg-[#D97757]/10 px-5 py-4 text-sm font-semibold text-[#F0E2D2]">
          Supabase 환경변수 설정이 필요합니다.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
                <tr>
                  <th className="w-[10%] px-3 py-2 font-mono">Provider</th>
                  <th className="w-[26%] px-3 py-2 font-mono">이메일</th>
                  <th className="w-[14%] px-3 py-2 font-mono">이름</th>
                  <th className="w-[10%] px-3 py-2 font-mono text-right">주문</th>
                  <th className="w-[10%] px-3 py-2 font-mono text-right">결제완료</th>
                  <th className="w-[14%] px-3 py-2 font-mono text-right">누적 결제</th>
                  <th className="w-[16%] px-3 py-2 font-mono">최근 주문</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream/5 text-cream/85">
                {result.members.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-10 text-center text-cream/40">
                      조건에 맞는 회원이 없습니다.
                    </td>
                  </tr>
                ) : (
                  result.members.map((member) => {
                    const detailHref = `/admin-panel/members/${encodeURIComponent(
                      member.provider
                    )}/${encodeURIComponent(member.providerAccountId)}`;
                    return (
                      <tr key={member.key} className="transition hover:bg-cream/5">
                        <td className="px-3 py-2 font-mono text-[10px] uppercase">
                          <Link href={detailHref} className="block hover:text-[#D97757]">
                            {PROVIDER_LABEL[member.provider] || member.provider}
                          </Link>
                        </td>
                        <td className="px-3 py-2 truncate">
                          <Link href={detailHref} className="block hover:text-[#D97757]">
                            {maskEmail(member.email)}
                          </Link>
                        </td>
                        <td className="px-3 py-2 truncate">
                          <Link href={detailHref} className="block hover:text-[#D97757]">
                            {maskName(member.buyerName)}
                          </Link>
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums text-right">
                          {member.orderCount.toLocaleString("ko-KR")}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums text-right">
                          {member.paidCount.toLocaleString("ko-KR")}
                        </td>
                        <td className="px-3 py-2 font-mono tabular-nums text-right">
                          {formatKrw(member.cumulativeKrw)}
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                          {formatKstDateTime(member.lastOrderAt)}
                        </td>
                      </tr>
                    );
                  })
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
                  const href = buildHref(baseHref, { page: p });
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
            * 회원 식별은 OAuth provider + accountId 조합으로 이루어집니다. 행을 클릭하면 해당 회원의 주문/문의/잔액요청/알림톡 이력을 한 화면에서 볼 수 있습니다.
          </p>
        </>
      )}
    </div>
  );
}
