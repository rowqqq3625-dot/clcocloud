import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { maskDisplayName } from "@/lib/review-utils";
import { getReviewConfig } from "@/lib/reviews/config";
import type {
  AdminReview,
  MyReview,
  PublicReview,
  ReviewRow,
  ReviewStats,
  ReviewStatus,
} from "@/lib/reviews/types";

// ---------------------------------------------------------------------------
// Column selectors
// ---------------------------------------------------------------------------

const PUBLIC_COLUMNS =
  "id, rating, title, body, masked_name, plan_code, featured, helpful_count, created_at";
const MINE_COLUMNS =
  "id, order_id, rating, title, body, display_name, masked_name, plan_code, status, " +
  "rejected_reason, reward_granted, reward_amount_usd, reward_granted_at, " +
  "helpful_count, featured, created_at, updated_at";
const ADMIN_COLUMNS = "*";

const REVIEW_STATS_FALLBACK: ReviewStats = {
  total_reviews_approved: 0,
  avg_rating: null,
  rating_distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  total_unique_buyers: 0,
  repurchase_rate: 0,
  total_orders_paid: 0,
  recent_30d_reviews_count: 0,
};

// ---------------------------------------------------------------------------
// Public reads (landing page, /reviews, /reviews/[id])
// ---------------------------------------------------------------------------

export type PublicReviewListParams = {
  limit?: number;
  offset?: number;
  rating?: number;
  planCode?: string;
  sort?: "recent" | "helpful";
  featuredOnly?: boolean;
};

export async function getApprovedReviews(
  params: PublicReviewListParams = {}
): Promise<{ rows: PublicReview[]; total: number }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { rows: [], total: 0 };

  const limit = Math.min(Math.max(params.limit ?? 12, 1), 100);
  const offset = Math.max(params.offset ?? 0, 0);

  let query = supabase
    .from("reviews")
    .select(PUBLIC_COLUMNS, { count: "exact" })
    .eq("status", "approved");

  if (params.rating && params.rating >= 1 && params.rating <= 5) {
    query = query.eq("rating", params.rating);
  }
  if (params.planCode) {
    query = query.eq("plan_code", params.planCode);
  }
  if (params.featuredOnly) {
    query = query.eq("featured", true);
  }
  if (params.sort === "helpful") {
    query = query.order("helpful_count", { ascending: false }).order("created_at", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error || !data) return { rows: [], total: 0 };
  return { rows: data as PublicReview[], total: count ?? 0 };
}

export async function getReviewById(id: string): Promise<PublicReview | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("reviews")
    .select(PUBLIC_COLUMNS)
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicReview;
}

/**
 * Landing-page featured slider. Ordered by featured_order ASC (operator
 * curated), falling back to recent first.
 */
export async function getFeaturedReviews(limit = 12): Promise<PublicReview[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select(PUBLIC_COLUMNS)
    .eq("status", "approved")
    .eq("featured", true)
    .order("featured_order", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));
  if (error || !data) return [];
  return data as PublicReview[];
}

/**
 * Single fetch for the landing REVIEWS strip + STATS section. Pulls
 * the stats view in one round-trip plus the 12 most recent approved
 * reviews so the home page can render in one render pass.
 */
export async function getLandingReviewBlock(): Promise<{
  stats: ReviewStats;
  recent: PublicReview[];
  featured: PublicReview[];
}> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { stats: REVIEW_STATS_FALLBACK, recent: [], featured: [] };
  }

  const [statsResult, recentResult, featuredResult] = await Promise.all([
    supabase.from("review_stats_view").select("*").maybeSingle(),
    supabase
      .from("reviews")
      .select(PUBLIC_COLUMNS)
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("reviews")
      .select(PUBLIC_COLUMNS)
      .eq("status", "approved")
      .eq("featured", true)
      .order("featured_order", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  return {
    stats: normalizeStats(statsResult.data),
    recent: (recentResult.data as PublicReview[] | null) || [],
    featured: (featuredResult.data as PublicReview[] | null) || [],
  };
}

export async function getReviewStats(): Promise<ReviewStats> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return REVIEW_STATS_FALLBACK;
  const { data, error } = await supabase.from("review_stats_view").select("*").maybeSingle();
  if (error || !data) return REVIEW_STATS_FALLBACK;
  return normalizeStats(data);
}

function normalizeStats(row: unknown): ReviewStats {
  if (!row || typeof row !== "object") return REVIEW_STATS_FALLBACK;
  const r = row as Record<string, unknown>;
  const dist = (r.rating_distribution as Record<string, number> | null) || null;
  return {
    total_reviews_approved: Number(r.total_reviews_approved ?? 0) || 0,
    avg_rating: r.avg_rating == null ? null : Number(r.avg_rating),
    rating_distribution: {
      "1": Number(dist?.["1"] ?? 0) || 0,
      "2": Number(dist?.["2"] ?? 0) || 0,
      "3": Number(dist?.["3"] ?? 0) || 0,
      "4": Number(dist?.["4"] ?? 0) || 0,
      "5": Number(dist?.["5"] ?? 0) || 0,
    },
    total_unique_buyers: Number(r.total_unique_buyers ?? 0) || 0,
    repurchase_rate: Number(r.repurchase_rate ?? 0) || 0,
    total_orders_paid: Number(r.total_orders_paid ?? 0) || 0,
    recent_30d_reviews_count: Number(r.recent_30d_reviews_count ?? 0) || 0,
  };
}

// ---------------------------------------------------------------------------
// User reads (/mypage/reviews)
// ---------------------------------------------------------------------------

export async function getUserReviews(identity: {
  provider: string;
  providerAccountId: string;
}): Promise<MyReview[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select(MINE_COLUMNS)
    .eq("user_provider", identity.provider)
    .eq("user_provider_account_id", identity.providerAccountId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as unknown as MyReview[];
}

// ---------------------------------------------------------------------------
// Submit / resubmit (delegates to RPC for atomic eligibility check)
// ---------------------------------------------------------------------------

export type SubmitReviewInput = {
  orderId: string;
  identity: { provider: string; providerAccountId: string };
  rating: number;
  title?: string | null;
  body: string;
  displayName: string;
};

export type SubmitReviewErrorCode =
  | "supabase_not_configured"
  | "validation_failed"
  | "order_not_found"
  | "order_not_paid"
  | "cooldown_not_passed"
  | "review_already_exists"
  | "rating_invalid"
  | "body_length_invalid"
  | "title_too_long"
  | "rpc_failed";

export type SubmitReviewResult =
  | { ok: true; reviewId: string }
  | { ok: false; code: SubmitReviewErrorCode; message?: string };

const RPC_ERROR_MAP: Record<string, SubmitReviewErrorCode> = {
  ORDER_NOT_FOUND: "order_not_found",
  ORDER_NOT_PAID: "order_not_paid",
  COOLDOWN_NOT_PASSED: "cooldown_not_passed",
  REVIEW_ALREADY_EXISTS: "review_already_exists",
  RATING_INVALID: "rating_invalid",
  BODY_LENGTH_INVALID: "body_length_invalid",
  TITLE_TOO_LONG: "title_too_long",
};

export async function submitReview(input: SubmitReviewInput): Promise<SubmitReviewResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };

  const config = getReviewConfig();
  const display = input.displayName.trim();
  if (!display) {
    return { ok: false, code: "validation_failed", message: "display_name_required" };
  }
  if (input.body.length < config.bodyMinLen || input.body.length > config.bodyMaxLen) {
    return { ok: false, code: "body_length_invalid" };
  }
  if (input.rating < 1 || input.rating > 5) {
    return { ok: false, code: "rating_invalid" };
  }
  if (input.title && input.title.length > config.titleMaxLen) {
    return { ok: false, code: "title_too_long" };
  }

  const { data, error } = await supabase.rpc("submit_review", {
    p_order_id: input.orderId,
    p_user_provider: input.identity.provider,
    p_user_provider_account_id: input.identity.providerAccountId,
    p_rating: input.rating,
    p_title: input.title ?? null,
    p_body: input.body,
    p_display_name: display,
    p_masked_name: maskDisplayName(display),
    p_eligibility_after_days: config.eligibilityAfterDays,
  });

  if (error) {
    const mapped = RPC_ERROR_MAP[error.message];
    if (mapped) return { ok: false, code: mapped };
    return { ok: false, code: "rpc_failed", message: error.message };
  }
  return { ok: true, reviewId: data as string };
}

/**
 * Resubmit a previously rejected review. The spec allows the user to
 * edit body/title/rating and put the review back into 'pending'.
 * Reward eligibility is preserved (1 reward per review, ever).
 */
export type ResubmitReviewInput = {
  reviewId: string;
  identity: { provider: string; providerAccountId: string };
  rating: number;
  title?: string | null;
  body: string;
};

export type ResubmitReviewResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "supabase_not_configured"
        | "review_not_found"
        | "review_not_rejected"
        | "validation_failed"
        | "rating_invalid"
        | "body_length_invalid"
        | "title_too_long"
        | "update_failed";
      message?: string;
    };

export async function resubmitReview(input: ResubmitReviewInput): Promise<ResubmitReviewResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };

  const config = getReviewConfig();
  if (input.rating < 1 || input.rating > 5) return { ok: false, code: "rating_invalid" };
  if (input.body.length < config.bodyMinLen || input.body.length > config.bodyMaxLen) {
    return { ok: false, code: "body_length_invalid" };
  }
  if (input.title && input.title.length > config.titleMaxLen) {
    return { ok: false, code: "title_too_long" };
  }

  const { data: existing, error: lookupErr } = await supabase
    .from("reviews")
    .select("id, status")
    .eq("id", input.reviewId)
    .eq("user_provider", input.identity.provider)
    .eq("user_provider_account_id", input.identity.providerAccountId)
    .maybeSingle();
  if (lookupErr || !existing) return { ok: false, code: "review_not_found" };
  if (existing.status !== "rejected") return { ok: false, code: "review_not_rejected" };

  const { error: updateErr } = await supabase
    .from("reviews")
    .update({
      rating: input.rating,
      title: input.title?.trim() || null,
      body: input.body,
      status: "pending" as ReviewStatus,
      bonus_status: "pending",
      rejected_reason: null,
      rejected_at: null,
      rejected_by: null,
    })
    .eq("id", input.reviewId);
  if (updateErr) return { ok: false, code: "update_failed", message: updateErr.message };

  await supabase.from("review_action_logs").insert({
    actor_user_provider: input.identity.provider,
    actor_user_provider_account_id: input.identity.providerAccountId,
    action: "REVIEW_RESUBMIT",
    target_review_id: input.reviewId,
    after_state: { rating: input.rating, status: "pending" },
  });

  return { ok: true };
}

// ---------------------------------------------------------------------------
// Helpful toggle
// ---------------------------------------------------------------------------

export type HelpfulToggleResult =
  | { ok: true; voted: boolean; helpful_count: number }
  | { ok: false; code: "supabase_not_configured" | "review_not_found" | "toggle_failed" };

export async function toggleHelpful(
  reviewId: string,
  voter: { provider: string; providerAccountId: string }
): Promise<HelpfulToggleResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };

  const { data: review, error: reviewErr } = await supabase
    .from("reviews")
    .select("id, status")
    .eq("id", reviewId)
    .maybeSingle();
  if (reviewErr || !review || review.status !== "approved") {
    return { ok: false, code: "review_not_found" };
  }

  const { data: existing } = await supabase
    .from("review_helpful")
    .select("id")
    .eq("review_id", reviewId)
    .eq("voter_provider", voter.provider)
    .eq("voter_provider_account_id", voter.providerAccountId)
    .maybeSingle();

  if (existing) {
    const { error: delErr } = await supabase.from("review_helpful").delete().eq("id", existing.id);
    if (delErr) return { ok: false, code: "toggle_failed" };
    const fresh = await supabase
      .from("reviews")
      .select("helpful_count")
      .eq("id", reviewId)
      .maybeSingle();
    return { ok: true, voted: false, helpful_count: Number(fresh.data?.helpful_count ?? 0) };
  }

  const { error: insErr } = await supabase.from("review_helpful").insert({
    review_id: reviewId,
    voter_provider: voter.provider,
    voter_provider_account_id: voter.providerAccountId,
  });
  if (insErr) return { ok: false, code: "toggle_failed" };
  const fresh = await supabase
    .from("reviews")
    .select("helpful_count")
    .eq("id", reviewId)
    .maybeSingle();
  return { ok: true, voted: true, helpful_count: Number(fresh.data?.helpful_count ?? 0) };
}

export async function hasUserVotedHelpful(
  reviewId: string,
  voter: { provider: string; providerAccountId: string }
): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return false;
  const { data } = await supabase
    .from("review_helpful")
    .select("id")
    .eq("review_id", reviewId)
    .eq("voter_provider", voter.provider)
    .eq("voter_provider_account_id", voter.providerAccountId)
    .maybeSingle();
  return Boolean(data);
}

// ---------------------------------------------------------------------------
// Admin reads (list + detail with context)
// ---------------------------------------------------------------------------

export type AdminReviewListParams = {
  limit?: number;
  offset?: number;
  status?: ReviewStatus | "all";
  rating?: number;
  planCode?: string;
  rewardGranted?: boolean;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sort?:
    | "created_at_desc"
    | "created_at_asc"
    | "rating_desc"
    | "rating_asc"
    | "status_asc"
    | "reward_granted_at_desc";
};

export async function getAdminReviewList(
  params: AdminReviewListParams = {}
): Promise<{ rows: AdminReview[]; total: number }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { rows: [], total: 0 };

  const limit = Math.min(Math.max(params.limit ?? 25, 1), 200);
  const offset = Math.max(params.offset ?? 0, 0);

  let query = supabase.from("reviews").select(ADMIN_COLUMNS, { count: "exact" });
  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  if (params.rating && params.rating >= 1 && params.rating <= 5) query = query.eq("rating", params.rating);
  if (params.planCode) query = query.eq("plan_code", params.planCode);
  if (params.rewardGranted !== undefined) query = query.eq("reward_granted", params.rewardGranted);
  if (params.fromDate) query = query.gte("created_at", params.fromDate);
  if (params.toDate) query = query.lte("created_at", params.toDate);

  if (params.search) {
    // Postgres or_ filter over title/body/display_name/user_email
    // (order_no would require a join — admin list rarely needs that).
    const safe = params.search.replace(/[%_]/g, "");
    query = query.or(
      `title.ilike.%${safe}%,body.ilike.%${safe}%,display_name.ilike.%${safe}%`
    );
  }

  switch (params.sort) {
    case "created_at_asc":
      query = query.order("created_at", { ascending: true });
      break;
    case "rating_desc":
      query = query.order("rating", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "rating_asc":
      query = query.order("rating", { ascending: true }).order("created_at", { ascending: false });
      break;
    case "status_asc":
      query = query.order("status", { ascending: true }).order("created_at", { ascending: false });
      break;
    case "reward_granted_at_desc":
      query = query.order("reward_granted_at", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error || !data) return { rows: [], total: 0 };
  return { rows: data as AdminReview[], total: count ?? 0 };
}

/** Admin review detail with the reviewer's order/review history for
 *  abuse-detection context (the spec calls for "과거 주문·과거 리뷰
 *  이력 요약"). */
export type AdminReviewDetail = {
  review: AdminReview | null;
  reviewer_orders: Array<{
    id: string;
    order_no: string;
    product_code: string;
    status: string;
    amount: number;
    created_at: string;
    paid_at: string | null;
  }>;
  reviewer_prior_reviews: Array<Pick<ReviewRow, "id" | "rating" | "status" | "created_at">>;
};

export async function getAdminReviewDetail(reviewId: string): Promise<AdminReviewDetail> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { review: null, reviewer_orders: [], reviewer_prior_reviews: [] };

  const { data: review } = await supabase
    .from("reviews")
    .select(ADMIN_COLUMNS)
    .eq("id", reviewId)
    .maybeSingle();
  if (!review) return { review: null, reviewer_orders: [], reviewer_prior_reviews: [] };

  const typed = review as AdminReview;

  const [{ data: orders }, { data: prior }] = await Promise.all([
    supabase
      .from("orders")
      .select("id, order_no, product_code, status, amount, created_at, paid_at")
      .eq("user_provider", typed.user_provider)
      .eq("user_provider_account_id", typed.user_provider_account_id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("reviews")
      .select("id, rating, status, created_at")
      .eq("user_provider", typed.user_provider)
      .eq("user_provider_account_id", typed.user_provider_account_id)
      .neq("id", reviewId)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  return {
    review: typed,
    reviewer_orders: (orders as AdminReviewDetail["reviewer_orders"] | null) || [],
    reviewer_prior_reviews:
      (prior as AdminReviewDetail["reviewer_prior_reviews"] | null) || [],
  };
}

// ---------------------------------------------------------------------------
// Admin: featured order persistence
// ---------------------------------------------------------------------------

export async function setFeaturedOrder(
  pairs: Array<{ reviewId: string; order: number }>,
  adminEmail: string
): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false };

  // Best-effort sequential updates. The admin "featured 큐레이션"
  // surface rarely has more than a few dozen rows, so we trade
  // bulk-update terseness for simpler error attribution.
  for (const { reviewId, order } of pairs) {
    const { error } = await supabase
      .from("reviews")
      .update({ featured_order: order })
      .eq("id", reviewId)
      .eq("featured", true);
    if (error) return { ok: false };
  }

  await supabase.from("review_action_logs").insert(
    pairs.map(({ reviewId, order }) => ({
      actor_admin_email: adminEmail,
      action: "REVIEW_FEATURE" as const,
      target_review_id: reviewId,
      after_state: { featured_order: order, reorder: true },
    }))
  );
  return { ok: true };
}
