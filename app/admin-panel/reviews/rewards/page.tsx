import Link from "next/link";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { ReviewsSubNav } from "@/components/admin/reviews/ReviewsSubNav";
import { RevokeRewardButton } from "@/components/admin/reviews/RevokeRewardButton";
import { formatKrw, formatKstDateTime } from "@/lib/admin/format";
import { getRewardLedger } from "@/lib/reviews/reward";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = {
  fromDate?: string;
  toDate?: string;
  includeRevoked?: string;
  minAmountUsd?: string;
  maxAmountUsd?: string;
  limit?: string;
  offset?: string;
};

export default async function AdminRewardsLedgerPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const fromDate = searchParams?.fromDate || undefined;
  const toDate = searchParams?.toDate || undefined;
  const includeRevoked = searchParams?.includeRevoked === "true";
  const minAmount = searchParams?.minAmountUsd ? Number(searchParams.minAmountUsd) : undefined;
  const maxAmount = searchParams?.maxAmountUsd ? Number(searchParams.maxAmountUsd) : undefined;
  const limitRaw = Number(searchParams?.limit ?? 50);
  const limit = [25, 50, 100, 200].includes(limitRaw) ? limitRaw : 50;
  const offsetRaw = Number(searchParams?.offset ?? 0);
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0;

  const { rows, total, totals } = await getRewardLedger({
    limit,
    offset,
    fromDate,
    toDate,
    includeRevoked,
    minAmountUsd: Number.isFinite(minAmount) ? minAmount : undefined,
    maxAmountUsd: Number.isFinite(maxAmount) ? maxAmount : undefined,
  });

  const netUsd = totals.paid_usd - totals.revoked_usd;
  const netKrw = totals.paid_krw - totals.revoked_krw;
  const avgUsd = rows.length > 0 ? totals.paid_usd / Math.max(1, total) : 0;

  const baseQuery = new URLSearchParams();
  if (fromDate) baseQuery.set("fromDate", fromDate);
  if (toDate) baseQuery.set("toDate", toDate);
  if (includeRevoked) baseQuery.set("includeRevoked", "true");
  if (minAmount !== undefined) baseQuery.set("minAmountUsd", String(minAmount));
  if (maxAmount !== undefined) baseQuery.set("maxAmountUsd", String(maxAmount));
  if (limit !== 50) baseQuery.set("limit", String(limit));
  const hrefFor = (o: number | null) => {
    if (o === null) return null;
    const q = new URLSearchParams(baseQuery);
    if (o > 0) q.set("offset", String(o));
    return `/admin-panel/reviews/rewards${q.toString() ? `?${q.toString()}` : ""}`;
  };

  return (
    <div className="grid gap-5">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/40">
          Reviews
        </p>
        <h1 className="mt-1 text-2xl font-bold">보상 지급 원장</h1>
        <p className="mt-2 text-sm text-cream/60">
          승인 보상과 회수가 모두 기록됩니다. 회수는 user_credit_ledger에 음수 행으로 반영됩니다.
        </p>
      </header>

      <ReviewsSubNav />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard
          label="누적 지급"
          value={`$${totals.paid_usd.toFixed(2)}`}
          hint={formatKrw(totals.paid_krw)}
        />
        <AdminStatCard
          label="누적 회수"
          value={`$${totals.revoked_usd.toFixed(2)}`}
          hint={formatKrw(totals.revoked_krw)}
        />
        <AdminStatCard
          label="순지급"
          value={`$${netUsd.toFixed(2)}`}
          hint={formatKrw(netKrw)}
        />
        <AdminStatCard
          label="평균 지급액"
          value={total > 0 ? `$${avgUsd.toFixed(2)}` : "—"}
          hint={`${total.toLocaleString()}건 기준`}
        />
      </section>

      <form className="grid gap-3 rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-4 sm:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            from
          </span>
          <input
            type="date"
            name="fromDate"
            defaultValue={fromDate?.slice(0, 10)}
            className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </label>
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            to
          </span>
          <input
            type="date"
            name="toDate"
            defaultValue={toDate?.slice(0, 10)}
            className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </label>
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            min USD
          </span>
          <input
            name="minAmountUsd"
            defaultValue={searchParams?.minAmountUsd}
            placeholder="0"
            className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </label>
        <label className="grid gap-1">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
            max USD
          </span>
          <input
            name="maxAmountUsd"
            defaultValue={searchParams?.maxAmountUsd}
            placeholder="∞"
            className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </label>
        <div className="flex flex-col gap-2 self-end">
          <label className="flex items-center gap-2 text-[11px] text-cream/70">
            <input
              type="checkbox"
              name="includeRevoked"
              value="true"
              defaultChecked={includeRevoked}
            />
            회수 포함
          </label>
          <button
            type="submit"
            className="h-9 rounded-lg bg-[#D97757] px-4 text-xs font-bold text-cream transition hover:brightness-110"
          >
            적용
          </button>
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-cream/10 bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="px-3 py-2.5">지급일</th>
                <th className="px-3 py-2.5">상태</th>
                <th className="px-3 py-2.5">금액</th>
                <th className="px-3 py-2.5">사용자</th>
                <th className="px-3 py-2.5">리뷰</th>
                <th className="px-3 py-2.5">지급자</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center text-cream/50">
                    조건에 맞는 보상 내역이 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const revoked = !!row.revoked_at;
                  return (
                    <tr key={row.id} className="border-b border-cream/5 hover:bg-cream/5">
                      <td className="px-3 py-3 font-mono text-cream/70">
                        {formatKstDateTime(row.created_at)}
                      </td>
                      <td className="px-3 py-3">
                        {revoked ? (
                          <span className="rounded-full bg-[#D97757]/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-[#F0E2D2]">
                            회수됨
                          </span>
                        ) : (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-300">
                            지급
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 font-mono">
                        <span className={revoked ? "text-cream/50" : "text-emerald-300"}>
                          ${Number(row.amount_usd).toFixed(2)}
                        </span>
                        <span className="ml-1 text-cream/40">
                          / {formatKrw(row.amount_krw)}
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate px-3 py-3 font-mono text-cream/70">
                        {row.user_provider}:{row.user_provider_account_id}
                      </td>
                      <td className="px-3 py-3 font-mono">
                        <Link
                          href={`/admin-panel/reviews/list?search=${encodeURIComponent(row.review_id)}`}
                          className="text-[#D97757] hover:brightness-125"
                        >
                          {row.review_id.slice(0, 8)}…
                        </Link>
                      </td>
                      <td className="px-3 py-3 font-mono text-cream/70">{row.created_by}</td>
                      <td className="px-3 py-3 text-right">
                        {revoked ? (
                          <span className="font-mono text-[10px] text-cream/40">
                            {row.revoked_by ?? "—"}
                          </span>
                        ) : (
                          <RevokeRewardButton rewardLedgerId={row.id} />
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {hrefFor(offset > 0 ? Math.max(0, offset - limit) : null) ? (
          <Link
            href={hrefFor(offset > 0 ? Math.max(0, offset - limit) : null) as string}
            className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-2 text-xs font-bold text-cream transition hover:bg-cream/10"
          >
            ← 이전
          </Link>
        ) : (
          <span />
        )}
        <span className="font-mono text-xs text-cream/50">
          {total === 0
            ? "0 / 0"
            : `${offset + 1} – ${Math.min(offset + limit, total)} / ${total}`}
        </span>
        {hrefFor(offset + limit < total ? offset + limit : null) ? (
          <Link
            href={hrefFor(offset + limit < total ? offset + limit : null) as string}
            className="rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:brightness-110"
          >
            다음 →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
