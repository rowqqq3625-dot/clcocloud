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

// A user is "online now" if their last_seen_at heartbeat is within this window.
// /api/session fires on every page mount, so any active tab refreshes it.
const ONLINE_WINDOW_MS = 5 * 60_000;

type ProfileRow = {
  provider: string;
  provider_account_id: string;
  email: string | null;
  name: string | null;
  signed_up_at: string;
  last_seen_at: string;
};

type OrderAggRow = {
  user_provider: string | null;
  user_provider_account_id: string | null;
  user_email: string | null;
  contact_email: string | null;
  buyer_name: string | null;
  amount: number | null;
  status: string;
  created_at: string;
};

type MemberSummary = {
  key: string;
  provider: string;
  providerAccountId: string;
  email: string | null;
  buyerName: string | null;
  signedUpAt: string;
  lastSeenAt: string;
  online: boolean;
  orderCount: number;
  paidCount: number;
  cumulativeKrw: number;
  lastOrderAt: string | null;
};

const PAID_STATUSES = new Set(["paid", "paid_pending_key"]);
const PAGE_SIZE = 50;

type SortKey = "last_seen" | "signed_up" | "recent_order" | "revenue" | "orders" | "paid";
type FilterKey = "all" | "online" | "paid_only" | "unpaid_only";

const SORT_KEYS: SortKey[] = ["last_seen", "signed_up", "recent_order", "revenue", "orders", "paid"];
const FILTER_KEYS: FilterKey[] = ["all", "online", "paid_only", "unpaid_only"];

const SORT_LABEL: Record<SortKey, string> = {
  last_seen: "최근 접속순",
  signed_up: "최근 가입순",
  recent_order: "최근 주문순",
  revenue: "누적 결제 내림차순",
  orders: "주문 수 내림차순",
  paid: "결제 완료 수 내림차순",
};

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "전체",
  online: "현재 접속중",
  paid_only: "결제완료 1건+",
  unpaid_only: "무결제 회원만",
};

async function loadMembers(
  search: string,
  page: number,
  sort: SortKey,
  filter: FilterKey
): Promise<{ members: MemberSummary[]; totalCount: number; totalPages: number; onlineCount: number } | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;

  let profileQuery = supabase
    .from("user_profiles")
    .select("provider,provider_account_id,email,name,signed_up_at,last_seen_at")
    .limit(10_000);

  if (search) {
    const escaped = search.replace(/[%_]/g, (m) => `\\${m}`);
    profileQuery = profileQuery.or(
      `email.ilike.%${escaped}%,name.ilike.%${escaped}%`
    );
  }

  const [profilesRes, ordersRes] = await Promise.all([
    profileQuery,
    supabase
      .from("orders")
      .select(
        "user_provider,user_provider_account_id,user_email,contact_email,buyer_name,amount,status,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(5000),
  ]);

  const profiles = (profilesRes.data as ProfileRow[] | null) || [];
  const orders = (ordersRes.data as OrderAggRow[] | null) || [];

  type Agg = { orderCount: number; paidCount: number; cumulativeKrw: number; lastOrderAt: string | null; email: string | null; buyerName: string | null };
  const aggByKey = new Map<string, Agg>();
  for (const row of orders) {
    const provider = row.user_provider || "unknown";
    const accountId = row.user_provider_account_id || row.user_email || row.contact_email;
    if (!accountId) continue;
    const key = `${provider}:${accountId}`;
    const amount = Number(row.amount) || 0;
    const isPaid = PAID_STATUSES.has(row.status);
    const prev = aggByKey.get(key);
    if (!prev) {
      aggByKey.set(key, {
        orderCount: 1,
        paidCount: isPaid ? 1 : 0,
        cumulativeKrw: isPaid ? amount : 0,
        lastOrderAt: row.created_at,
        email: row.user_email || row.contact_email,
        buyerName: row.buyer_name,
      });
    } else {
      prev.orderCount += 1;
      if (isPaid) {
        prev.paidCount += 1;
        prev.cumulativeKrw += amount;
      }
      if (!prev.email && (row.user_email || row.contact_email)) {
        prev.email = row.user_email || row.contact_email;
      }
      if (!prev.buyerName && row.buyer_name) prev.buyerName = row.buyer_name;
    }
  }

  const now = Date.now();
  const consumedProfileKeys = new Set<string>();
  const members: MemberSummary[] = profiles.map((p) => {
    const key = `${p.provider}:${p.provider_account_id}`;
    consumedProfileKeys.add(key);
    const agg = aggByKey.get(key);
    const lastSeenMs = new Date(p.last_seen_at).getTime();
    return {
      key,
      provider: p.provider,
      providerAccountId: p.provider_account_id,
      email: p.email || agg?.email || null,
      buyerName: p.name || agg?.buyerName || null,
      signedUpAt: p.signed_up_at,
      lastSeenAt: p.last_seen_at,
      online: Number.isFinite(lastSeenMs) && now - lastSeenMs <= ONLINE_WINDOW_MS,
      orderCount: agg?.orderCount ?? 0,
      paidCount: agg?.paidCount ?? 0,
      cumulativeKrw: agg?.cumulativeKrw ?? 0,
      lastOrderAt: agg?.lastOrderAt ?? null,
    };
  });

  // Surface buyers whose profile row was never created (e.g. orders predating
  // the user_profiles table when search didn't hit the profile via email/name).
  if (!search) {
    for (const [key, agg] of aggByKey) {
      if (consumedProfileKeys.has(key)) continue;
      const [provider, ...rest] = key.split(":");
      const providerAccountId = rest.join(":");
      members.push({
        key,
        provider,
        providerAccountId,
        email: agg.email,
        buyerName: agg.buyerName,
        signedUpAt: agg.lastOrderAt || new Date(0).toISOString(),
        lastSeenAt: agg.lastOrderAt || new Date(0).toISOString(),
        online: false,
        orderCount: agg.orderCount,
        paidCount: agg.paidCount,
        cumulativeKrw: agg.cumulativeKrw,
        lastOrderAt: agg.lastOrderAt,
      });
    }
  }

  let filtered = members;
  if (filter === "online") {
    filtered = filtered.filter((m) => m.online);
  } else if (filter === "paid_only") {
    filtered = filtered.filter((m) => m.paidCount > 0);
  } else if (filter === "unpaid_only") {
    filtered = filtered.filter((m) => m.paidCount === 0);
  }

  const sorters: Record<SortKey, (a: MemberSummary, b: MemberSummary) => number> = {
    last_seen: (a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt),
    signed_up: (a, b) => b.signedUpAt.localeCompare(a.signedUpAt),
    recent_order: (a, b) => (b.lastOrderAt || "").localeCompare(a.lastOrderAt || ""),
    revenue: (a, b) => b.cumulativeKrw - a.cumulativeKrw,
    orders: (a, b) => b.orderCount - a.orderCount,
    paid: (a, b) => b.paidCount - a.paidCount,
  };
  filtered.sort(sorters[sort]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const paged = filtered.slice(start, start + PAGE_SIZE);
  const onlineCount = members.filter((m) => m.online).length;
  return { members: paged, totalCount, totalPages, onlineCount };
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
  if (merged.sort !== "last_seen") sp.set("sort", merged.sort);
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
    : ("last_seen" as SortKey);
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
              총 {result.totalCount.toLocaleString("ko-KR")}명 · 현재 접속중 {result.onlineCount.toLocaleString("ko-KR")}명 · 정렬 {SORT_LABEL[sort]} · 필터 {FILTER_LABEL[filter]}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <AdminMembersCsvButton />
          <form action="/admin-panel/members" method="get" className="flex items-center gap-2">
            {sort !== "last_seen" ? <input type="hidden" name="sort" value={sort} /> : null}
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
          Supabase 환경변수 또는 user_profiles 테이블 생성이 필요합니다.
        </p>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
                <tr>
                  <th className="w-[7%] px-3 py-2 font-mono text-center">상태</th>
                  <th className="w-[8%] px-3 py-2 font-mono">Provider</th>
                  <th className="w-[22%] px-3 py-2 font-mono">이메일</th>
                  <th className="w-[11%] px-3 py-2 font-mono">이름</th>
                  <th className="w-[13%] px-3 py-2 font-mono">가입일</th>
                  <th className="w-[13%] px-3 py-2 font-mono">마지막 접속</th>
                  <th className="w-[7%] px-3 py-2 font-mono text-right">주문</th>
                  <th className="w-[7%] px-3 py-2 font-mono text-right">결제</th>
                  <th className="w-[12%] px-3 py-2 font-mono text-right">누적 결제</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream/5 text-cream/85">
                {result.members.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-10 text-center text-cream/40">
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
                        <td className="px-3 py-2 text-center">
                          <span
                            title={member.online ? "최근 5분 이내 접속" : `마지막 접속: ${formatKstDateTime(member.lastSeenAt)}`}
                            className={[
                              "inline-flex h-2.5 w-2.5 rounded-full",
                              member.online ? "bg-emerald-400 ring-2 ring-emerald-400/30" : "bg-cream/15",
                            ].join(" ")}
                            aria-label={member.online ? "online" : "offline"}
                          />
                        </td>
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
                        <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                          {formatKstDateTime(member.signedUpAt)}
                        </td>
                        <td className="px-3 py-2 font-mono text-[10px] text-cream/70">
                          {formatKstDateTime(member.lastSeenAt)}
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
            * 회원 식별은 OAuth provider + accountId 조합. 초록색 점은 최근 5분 이내 페이지 접속한 회원. 가입했지만 한 번도 접속 기록이 없는 행은 주문 시각을 임시로 표시합니다.
          </p>
        </>
      )}
    </div>
  );
}
