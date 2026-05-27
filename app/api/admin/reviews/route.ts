import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getAdminReviewList } from "@/lib/reviews/queries";
import type { ReviewStatus } from "@/lib/reviews/types";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/admin/reviews — paginated list for the admin reviews table.
// Filters: status, rating, plan, rewardGranted, search, fromDate, toDate
// Sorts:   created_at desc/asc, rating desc/asc, status_asc, reward_granted_at_desc
// ---------------------------------------------------------------------------

const STATUS_VALUES = ["all", "pending", "approved", "rejected", "hidden"] as const;
const SORT_VALUES = [
  "created_at_desc",
  "created_at_asc",
  "rating_desc",
  "rating_asc",
  "status_asc",
  "reward_granted_at_desc",
] as const;

type StatusFilter = (typeof STATUS_VALUES)[number];
type SortFilter = (typeof SORT_VALUES)[number];

function parseStatus(raw: string | null): StatusFilter | ReviewStatus | undefined {
  if (!raw) return undefined;
  return (STATUS_VALUES as readonly string[]).includes(raw)
    ? (raw as StatusFilter)
    : undefined;
}

function parseSort(raw: string | null): SortFilter {
  if (raw && (SORT_VALUES as readonly string[]).includes(raw)) return raw as SortFilter;
  return "created_at_desc";
}

export async function GET(request: NextRequest) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const sp = request.nextUrl.searchParams;
  const limitRaw = Number(sp.get("limit") ?? 25);
  const offsetRaw = Number(sp.get("offset") ?? 0);
  const ratingRaw = sp.get("rating");
  const planCode = sp.get("plan") || undefined;
  const search = sp.get("search") || undefined;
  const fromDate = sp.get("fromDate") || undefined;
  const toDate = sp.get("toDate") || undefined;
  const rewardRaw = sp.get("rewardGranted");
  const rewardGranted =
    rewardRaw === "true" ? true : rewardRaw === "false" ? false : undefined;

  const status = parseStatus(sp.get("status"));
  const sort = parseSort(sp.get("sort"));

  const rating = ratingRaw ? Number(ratingRaw) : undefined;

  const { rows, total } = await getAdminReviewList({
    limit: Number.isFinite(limitRaw) ? limitRaw : 25,
    offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
    status,
    rating: rating && rating >= 1 && rating <= 5 ? rating : undefined,
    planCode,
    rewardGranted,
    search,
    fromDate,
    toDate,
    sort,
  });

  return NextResponse.json({ reviews: rows, total });
}
