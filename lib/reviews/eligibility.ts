import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getReviewConfig } from "@/lib/reviews/config";
import type { EligibleOrder } from "@/lib/reviews/types";

type Identity = {
  provider: string;
  providerAccountId: string;
};

/**
 * Compute the timestamp at which a paid order becomes review-eligible.
 * Falls back to created_at if paid_at is missing (rare but possible
 * for legacy rows).
 */
function computeEligibleAt(
  paidAt: string | null,
  createdAt: string,
  afterDays: number
): string | null {
  const base = paidAt || createdAt;
  if (!base) return null;
  const baseMs = Date.parse(base);
  if (!Number.isFinite(baseMs)) return null;
  return new Date(baseMs + afterDays * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Returns every paid order belonging to the given identity along with
 * the metadata needed to drive the /reviews/new picker:
 *   - is_eligible: can the user submit a review for this order *now*?
 *   - cooldown_until: if not, when does the cooldown lift?
 *   - has_review: there's already a review on this order
 *   - key_issued: at least one issued_api_keys row exists
 *
 * Returns an empty array on any Supabase config / lookup failure so
 * the UI can degrade to "no eligible orders".
 */
export async function getEligibleOrders(identity: Identity): Promise<EligibleOrder[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];

  const config = getReviewConfig();
  const now = Date.now();

  // 1. Pull the user's paid orders. We treat both 'paid' and
  // 'paid_pending_key' as buyer-state (the spec says "결제 완료").
  const { data: orderRows, error: orderErr } = await supabase
    .from("orders")
    .select("id,order_no,product_code,product_kind,amount,status,paid_at,created_at")
    .eq("user_provider", identity.provider)
    .eq("user_provider_account_id", identity.providerAccountId)
    .in("status", ["paid", "paid_pending_key"])
    .order("created_at", { ascending: false });
  if (orderErr || !orderRows || orderRows.length === 0) return [];

  const orderIds = orderRows.map((o) => o.id);
  const orderNos = orderRows.map((o) => o.order_no).filter(Boolean);

  // 2. Reviews that already exist for any of those orders.
  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("order_id")
    .in("order_id", orderIds);
  const reviewedOrderIds = new Set((reviewRows || []).map((r) => r.order_id as string));

  // 3. Keys issued for any of those orders.
  // The schema (20260526_payment_automation.sql) keys this table by
  // `order_no`. We tolerate the older `order_id` shape too (returns
  // empty array under the newer schema) so this works across both.
  const issuedOrderNos = new Set<string>();
  if (orderNos.length > 0) {
    const { data: issuedRows } = await supabase
      .from("issued_api_keys")
      .select("order_no")
      .in("order_no", orderNos);
    for (const row of issuedRows || []) {
      if (row?.order_no) issuedOrderNos.add(row.order_no as string);
    }
  }

  return orderRows.map((order): EligibleOrder => {
    const eligibleAt = computeEligibleAt(order.paid_at, order.created_at, config.eligibilityAfterDays);
    const eligibleMs = eligibleAt ? Date.parse(eligibleAt) : null;
    const cooldownPassed = eligibleMs !== null && eligibleMs <= now;
    const hasReview = reviewedOrderIds.has(order.id);
    const keyIssued = issuedOrderNos.has(order.order_no);
    const isEligible = cooldownPassed && !hasReview && keyIssued;

    return {
      id: order.id,
      order_no: order.order_no,
      product_code: order.product_code,
      product_kind: order.product_kind,
      amount: order.amount,
      status: order.status,
      paid_at: order.paid_at,
      created_at: order.created_at,
      eligible_at: eligibleAt,
      is_eligible: isEligible,
      cooldown_until: cooldownPassed ? null : eligibleAt,
      has_review: hasReview,
      key_issued: keyIssued,
    };
  });
}

/**
 * Per-order eligibility check used by POST /api/reviews before calling
 * the submit_review() RPC. Returns a discriminated result so callers
 * can map to specific HTTP responses.
 */
export type EligibilityResult =
  | { ok: true; order: EligibleOrder }
  | { ok: false; reason: "supabase_not_configured" }
  | { ok: false; reason: "order_not_found" }
  | { ok: false; reason: "order_not_paid" }
  | { ok: false; reason: "cooldown_not_passed"; cooldownUntil: string | null }
  | { ok: false; reason: "key_not_issued" }
  | { ok: false; reason: "review_already_exists" };

export async function checkEligibility(
  orderId: string,
  identity: Identity
): Promise<EligibilityResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, reason: "supabase_not_configured" };

  const config = getReviewConfig();
  const now = Date.now();

  const { data: order, error } = await supabase
    .from("orders")
    .select("id,order_no,product_code,product_kind,amount,status,paid_at,created_at")
    .eq("id", orderId)
    .eq("user_provider", identity.provider)
    .eq("user_provider_account_id", identity.providerAccountId)
    .maybeSingle();
  if (error || !order) return { ok: false, reason: "order_not_found" };

  if (order.status !== "paid" && order.status !== "paid_pending_key") {
    return { ok: false, reason: "order_not_paid" };
  }

  const eligibleAt = computeEligibleAt(order.paid_at, order.created_at, config.eligibilityAfterDays);
  const eligibleMs = eligibleAt ? Date.parse(eligibleAt) : null;
  if (eligibleMs === null || eligibleMs > now) {
    return { ok: false, reason: "cooldown_not_passed", cooldownUntil: eligibleAt };
  }

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();
  if (existing) return { ok: false, reason: "review_already_exists" };

  const { data: issued } = await supabase
    .from("issued_api_keys")
    .select("order_no")
    .eq("order_no", order.order_no)
    .maybeSingle();
  if (!issued) return { ok: false, reason: "key_not_issued" };

  return {
    ok: true,
    order: {
      id: order.id,
      order_no: order.order_no,
      product_code: order.product_code,
      product_kind: order.product_kind,
      amount: order.amount,
      status: order.status,
      paid_at: order.paid_at,
      created_at: order.created_at,
      eligible_at: eligibleAt,
      is_eligible: true,
      cooldown_until: null,
      has_review: false,
      key_issued: true,
    },
  };
}
