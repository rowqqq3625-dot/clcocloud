import Link from "next/link";
import { AdminReviewListFilters } from "@/components/admin/reviews/AdminReviewListFilters";
import { AdminReviewListTable } from "@/components/admin/reviews/AdminReviewListTable";
import { ReviewsSubNav } from "@/components/admin/reviews/ReviewsSubNav";
import { getReviewConfig } from "@/lib/reviews/config";
import { getAdminReviewList } from "@/lib/reviews/queries";
import type { ReviewStatus } from "@/lib/reviews/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_SET = new Set<ReviewStatus | "all">([
  "all",
  "pending",
  "approved",
  "rejected",
  "hidden",
]);
const SORT_SET = new Set([
  "created_at_desc",
  "created_at_asc",
  "rating_desc",
  "rating_asc",
  "status_asc",
  "reward_granted_at_desc",
]);

type SearchParams = {
  status?: string;
  rating?: string;
  plan?: string;
  rewardGranted?: string;
  search?: string;
  sort?: string;
  limit?: string;
  offset?: string;
  fromDate?: string;
  toDate?: string;
};

export default async function AdminReviewListPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const config = getReviewConfig();

  const statusRaw = searchParams?.status;
  const status: ReviewStatus | "all" =
    statusRaw && STATUS_SET.has(statusRaw as ReviewStatus | "all")
      ? (statusRaw as ReviewStatus | "all")
      : "all";
  const ratingRaw = searchParams?.rating ? Number(searchParams.rating) : null;
  const rating = ratingRaw && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
  const plan = searchParams?.plan?.trim() || null;
  const rewardRaw = searchParams?.rewardGranted;
  const rewardGranted = rewardRaw === "true" ? true : rewardRaw === "false" ? false : undefined;
  const search = searchParams?.search?.trim() || "";
  const sortRaw = searchParams?.sort;
  const sort = (sortRaw && SORT_SET.has(sortRaw) ? sortRaw : "created_at_desc") as
    | "created_at_desc"
    | "created_at_asc"
    | "rating_desc"
    | "rating_asc"
    | "status_asc"
    | "reward_granted_at_desc";
  const limitRaw = Number(searchParams?.limit ?? 25);
  const limit =
    Number.isFinite(limitRaw) && [25, 50, 100].includes(limitRaw) ? limitRaw : 25;
  const offsetRaw = Number(searchParams?.offset ?? 0);
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0;

  const { rows, total } = await getAdminReviewList({
    limit,
    offset,
    status,
    rating: rating ?? undefined,
    planCode: plan ?? undefined,
    rewardGranted,
    search: search || undefined,
    sort,
    fromDate: searchParams?.fromDate,
    toDate: searchParams?.toDate,
  });

  const baseQuery = new URLSearchParams();
  if (status !== "all") baseQuery.set("status", status);
  if (rating) baseQuery.set("rating", String(rating));
  if (plan) baseQuery.set("plan", plan);
  if (rewardGranted !== undefined) baseQuery.set("rewardGranted", rewardGranted ? "true" : "false");
  if (search) baseQuery.set("search", search);
  if (sort !== "created_at_desc") baseQuery.set("sort", sort);
  if (limit !== 25) baseQuery.set("limit", String(limit));
  const buildHref = (o: number | null) => {
    if (o === null) return null;
    const q = new URLSearchParams(baseQuery);
    if (o > 0) q.set("offset", String(o));
    return `/admin-panel/reviews/list${q.toString() ? `?${q.toString()}` : ""}`;
  };
  const nextOffset = offset + limit < total ? offset + limit : null;
  const prevOffset = offset > 0 ? Math.max(0, offset - limit) : null;

  return (
    <div className="grid gap-5">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/40">
          Reviews
        </p>
        <h1 className="mt-1 text-2xl font-bold">리뷰 목록</h1>
        <p className="mt-2 text-sm text-cream/60">
          전체 {total.toLocaleString()}건 · 검색·필터·일괄 액션은 상단에서 처리합니다.
        </p>
      </header>

      <ReviewsSubNav />

      <AdminReviewListFilters
        status={status === "all" ? "all" : status}
        rating={rating}
        plan={plan}
        rewardGranted={rewardGranted === true ? "true" : rewardGranted === false ? "false" : null}
        search={search}
        sort={sort}
        limit={limit}
      />

      <AdminReviewListTable rows={rows} defaultRewardUsd={config.rewardUsd} />

      <div className="flex items-center justify-between">
        {buildHref(prevOffset) ? (
          <Link
            href={buildHref(prevOffset) as string}
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
        {buildHref(nextOffset) ? (
          <Link
            href={buildHref(nextOffset) as string}
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
