import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getReviewConfig } from "@/lib/reviews/config";
import type {
  CreditBalance,
  CreditLedgerRow,
  RewardLedgerRow,
} from "@/lib/reviews/types";

// ---------------------------------------------------------------------------
// Approve + grant
// ---------------------------------------------------------------------------

export type ApproveAndGrantInput = {
  reviewId: string;
  adminEmail: string;
  /** Override default reward. Defaults to REVIEW_REWARD_USD env. */
  rewardUsd?: number;
  /** Override default KRW reward. Defaults to REVIEW_REWARD_KRW env. */
  rewardKrw?: number;
};

export type ApproveAndGrantErrorCode =
  | "supabase_not_configured"
  | "review_not_found"
  | "review_not_pending"
  | "reward_already_granted"
  | "reward_amount_invalid"
  | "admin_email_required"
  | "rpc_failed";

export type ApproveAndGrantResult =
  | {
      ok: true;
      reviewId: string;
      rewardLedgerId: string;
      creditLedgerId: string;
      amountUsd: number;
      amountKrw: number;
      approvedAt: string;
    }
  | { ok: false; code: ApproveAndGrantErrorCode; message?: string };

const RPC_APPROVE_ERROR_MAP: Record<string, ApproveAndGrantErrorCode> = {
  REVIEW_NOT_FOUND: "review_not_found",
  REVIEW_NOT_PENDING: "review_not_pending",
  REWARD_ALREADY_GRANTED: "reward_already_granted",
  REWARD_AMOUNT_INVALID: "reward_amount_invalid",
  ADMIN_EMAIL_REQUIRED: "admin_email_required",
};

export async function approveAndGrantReward(
  input: ApproveAndGrantInput
): Promise<ApproveAndGrantResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };

  if (!input.adminEmail) return { ok: false, code: "admin_email_required" };
  const config = getReviewConfig();
  const usd = input.rewardUsd ?? config.rewardUsd;
  const krw = input.rewardKrw ?? config.rewardKrw;
  if (!Number.isFinite(usd) || usd <= 0) return { ok: false, code: "reward_amount_invalid" };

  const { data, error } = await supabase.rpc("approve_review_and_grant_reward", {
    p_review_id: input.reviewId,
    p_admin_email: input.adminEmail,
    p_reward_usd: usd,
    p_reward_krw: Math.max(0, Math.floor(krw)),
  });

  if (error) {
    const mapped = RPC_APPROVE_ERROR_MAP[error.message];
    if (mapped) return { ok: false, code: mapped };
    return { ok: false, code: "rpc_failed", message: error.message };
  }

  const payload = (data ?? {}) as {
    review_id?: string;
    reward_ledger_id?: string;
    credit_ledger_id?: string;
    amount_usd?: number;
    amount_krw?: number;
    approved_at?: string;
  };

  return {
    ok: true,
    reviewId: payload.review_id || input.reviewId,
    rewardLedgerId: payload.reward_ledger_id || "",
    creditLedgerId: payload.credit_ledger_id || "",
    amountUsd: Number(payload.amount_usd ?? usd),
    amountKrw: Number(payload.amount_krw ?? krw),
    approvedAt: payload.approved_at || new Date().toISOString(),
  };
}

/**
 * Bulk approve. Runs sequentially so a single failure doesn't roll back
 * the prior successes — each call is its own DB transaction. Returns
 * per-row outcomes so the admin UI can show partial-success states.
 */
export type BulkApproveRow = {
  reviewId: string;
  ok: boolean;
  code?: ApproveAndGrantErrorCode;
  message?: string;
  rewardLedgerId?: string;
  amountUsd?: number;
};

export async function bulkApproveAndGrant(
  reviewIds: string[],
  adminEmail: string,
  rewardUsdOverride?: number
): Promise<BulkApproveRow[]> {
  const results: BulkApproveRow[] = [];
  for (const reviewId of reviewIds) {
    const r = await approveAndGrantReward({
      reviewId,
      adminEmail,
      rewardUsd: rewardUsdOverride,
    });
    if (r.ok) {
      results.push({
        reviewId,
        ok: true,
        rewardLedgerId: r.rewardLedgerId,
        amountUsd: r.amountUsd,
      });
    } else {
      results.push({ reviewId, ok: false, code: r.code, message: r.message });
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Reject + bulk reject (no reward path; thin wrapper around reject_review RPC)
// ---------------------------------------------------------------------------

export type RejectReviewResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | "supabase_not_configured"
        | "review_not_found"
        | "review_not_rejectable"
        | "reason_required"
        | "rpc_failed";
      message?: string;
    };

type RejectReviewErrorCode =
  | "supabase_not_configured"
  | "review_not_found"
  | "review_not_rejectable"
  | "reason_required"
  | "rpc_failed";

const RPC_REJECT_ERROR_MAP: Record<string, RejectReviewErrorCode> = {
  REVIEW_NOT_FOUND: "review_not_found",
  REVIEW_NOT_REJECTABLE: "review_not_rejectable",
  REASON_REQUIRED: "reason_required",
};

export async function rejectReview(
  reviewId: string,
  adminEmail: string,
  reason: string
): Promise<RejectReviewResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };
  if (!reason?.trim()) return { ok: false, code: "reason_required" };

  const { error } = await supabase.rpc("reject_review", {
    p_review_id: reviewId,
    p_admin_email: adminEmail,
    p_reason: reason.trim(),
  });
  if (error) {
    const mapped = RPC_REJECT_ERROR_MAP[error.message];
    if (mapped) return { ok: false, code: mapped };
    return { ok: false, code: "rpc_failed", message: error.message };
  }
  return { ok: true };
}

export async function bulkRejectReviews(
  reviewIds: string[],
  adminEmail: string,
  reason: string
): Promise<Array<{ reviewId: string; ok: boolean; code?: string }>> {
  const results: Array<{ reviewId: string; ok: boolean; code?: string }> = [];
  for (const reviewId of reviewIds) {
    const r = await rejectReview(reviewId, adminEmail, reason);
    results.push({ reviewId, ok: r.ok, code: r.ok ? undefined : r.code });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Hide / unhide / feature toggles
// ---------------------------------------------------------------------------

type SimpleRpcResult<C extends string = string> =
  | { ok: true }
  | { ok: false; code: "supabase_not_configured" | "rpc_failed" | C; message?: string };

export async function hideReview(
  reviewId: string,
  adminEmail: string
): Promise<SimpleRpcResult<"review_not_found" | "review_already_hidden">> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };
  const { error } = await supabase.rpc("hide_review", {
    p_review_id: reviewId,
    p_admin_email: adminEmail,
  });
  if (error) {
    if (error.message === "REVIEW_NOT_FOUND") return { ok: false, code: "review_not_found" };
    if (error.message === "REVIEW_ALREADY_HIDDEN") return { ok: false, code: "review_already_hidden" };
    return { ok: false, code: "rpc_failed", message: error.message };
  }
  return { ok: true };
}

export async function unhideReview(
  reviewId: string,
  adminEmail: string
): Promise<SimpleRpcResult<"review_not_found" | "review_not_hidden">> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };
  const { error } = await supabase.rpc("unhide_review", {
    p_review_id: reviewId,
    p_admin_email: adminEmail,
  });
  if (error) {
    if (error.message === "REVIEW_NOT_FOUND") return { ok: false, code: "review_not_found" };
    if (error.message === "REVIEW_NOT_HIDDEN") return { ok: false, code: "review_not_hidden" };
    return { ok: false, code: "rpc_failed", message: error.message };
  }
  return { ok: true };
}

export async function setFeatured(
  reviewId: string,
  adminEmail: string,
  featured: boolean,
  order?: number
): Promise<SimpleRpcResult<"review_not_found" | "only_approved_can_be_featured">> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };
  const { error } = await supabase.rpc("feature_review", {
    p_review_id: reviewId,
    p_admin_email: adminEmail,
    p_featured: featured,
    p_order: order ?? null,
  });
  if (error) {
    if (error.message === "REVIEW_NOT_FOUND") return { ok: false, code: "review_not_found" };
    if (error.message === "ONLY_APPROVED_CAN_BE_FEATURED") {
      return { ok: false, code: "only_approved_can_be_featured" };
    }
    return { ok: false, code: "rpc_failed", message: error.message };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Revoke reward
// ---------------------------------------------------------------------------

export type RevokeRewardInput = {
  reviewId: string;
  adminEmail: string;
  reason: string;
  hideReview?: boolean;
};

export type RevokeRewardResult =
  | {
      ok: true;
      reviewId: string;
      revokeCreditLedgerId: string;
      amountUsd: number;
      amountKrw: number;
      reviewStatus: string;
    }
  | {
      ok: false;
      code:
        | "supabase_not_configured"
        | "reward_not_found_or_already_revoked"
        | "reason_required"
        | "rpc_failed";
      message?: string;
    };

export async function revokeReward(input: RevokeRewardInput): Promise<RevokeRewardResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };
  if (!input.reason?.trim()) return { ok: false, code: "reason_required" };

  const { data, error } = await supabase.rpc("revoke_reward", {
    p_review_id: input.reviewId,
    p_admin_email: input.adminEmail,
    p_reason: input.reason.trim(),
    p_hide_review: input.hideReview ?? false,
  });
  if (error) {
    if (error.message === "REWARD_NOT_FOUND_OR_ALREADY_REVOKED") {
      return { ok: false, code: "reward_not_found_or_already_revoked" };
    }
    if (error.message === "REASON_REQUIRED") return { ok: false, code: "reason_required" };
    return { ok: false, code: "rpc_failed", message: error.message };
  }

  const payload = (data ?? {}) as {
    review_id?: string;
    revoke_credit_ledger_id?: string;
    amount_usd?: number;
    amount_krw?: number;
    review_status?: string;
  };
  return {
    ok: true,
    reviewId: payload.review_id || input.reviewId,
    revokeCreditLedgerId: payload.revoke_credit_ledger_id || "",
    amountUsd: Number(payload.amount_usd ?? 0),
    amountKrw: Number(payload.amount_krw ?? 0),
    reviewStatus: payload.review_status || "approved",
  };
}

// ---------------------------------------------------------------------------
// Ledger reads
// ---------------------------------------------------------------------------

export type RewardLedgerListParams = {
  limit?: number;
  offset?: number;
  fromDate?: string;
  toDate?: string;
  planCode?: string;
  includeRevoked?: boolean;
  minAmountUsd?: number;
  maxAmountUsd?: number;
  userProvider?: string;
  userProviderAccountId?: string;
};

export async function getRewardLedger(
  params: RewardLedgerListParams = {}
): Promise<{
  rows: RewardLedgerRow[];
  total: number;
  totals: { paid_usd: number; paid_krw: number; revoked_usd: number; revoked_krw: number };
}> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return { rows: [], total: 0, totals: { paid_usd: 0, paid_krw: 0, revoked_usd: 0, revoked_krw: 0 } };
  }

  const limit = Math.min(Math.max(params.limit ?? 50, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);

  let query = supabase.from("review_reward_ledger").select("*", { count: "exact" });
  if (params.fromDate) query = query.gte("created_at", params.fromDate);
  if (params.toDate) query = query.lte("created_at", params.toDate);
  if (params.userProvider) query = query.eq("user_provider", params.userProvider);
  if (params.userProviderAccountId) query = query.eq("user_provider_account_id", params.userProviderAccountId);
  if (params.minAmountUsd !== undefined) query = query.gte("amount_usd", params.minAmountUsd);
  if (params.maxAmountUsd !== undefined) query = query.lte("amount_usd", params.maxAmountUsd);
  if (!params.includeRevoked) query = query.is("revoked_at", null);

  query = query.order("created_at", { ascending: false });

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error || !data) {
    return { rows: [], total: 0, totals: { paid_usd: 0, paid_krw: 0, revoked_usd: 0, revoked_krw: 0 } };
  }

  // Totals over the full filtered set (not just the current page).
  let totalsQuery = supabase
    .from("review_reward_ledger")
    .select("amount_usd, amount_krw, revoked_at");
  if (params.fromDate) totalsQuery = totalsQuery.gte("created_at", params.fromDate);
  if (params.toDate) totalsQuery = totalsQuery.lte("created_at", params.toDate);
  if (params.userProvider) totalsQuery = totalsQuery.eq("user_provider", params.userProvider);
  if (params.userProviderAccountId) {
    totalsQuery = totalsQuery.eq("user_provider_account_id", params.userProviderAccountId);
  }
  const totalsResult = await totalsQuery;
  const totalsRows =
    (totalsResult.data as Array<{ amount_usd: number; amount_krw: number; revoked_at: string | null }> | null) || [];
  const totals = totalsRows.reduce(
    (acc, r) => {
      if (r.revoked_at) {
        acc.revoked_usd += Number(r.amount_usd) || 0;
        acc.revoked_krw += Number(r.amount_krw) || 0;
      } else {
        acc.paid_usd += Number(r.amount_usd) || 0;
        acc.paid_krw += Number(r.amount_krw) || 0;
      }
      return acc;
    },
    { paid_usd: 0, paid_krw: 0, revoked_usd: 0, revoked_krw: 0 }
  );

  return { rows: data as RewardLedgerRow[], total: count ?? 0, totals };
}

// ---------------------------------------------------------------------------
// Credit balance (per user)
// ---------------------------------------------------------------------------

export async function getUserCreditBalance(identity: {
  provider: string;
  providerAccountId: string;
}): Promise<CreditBalance> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      user_provider: identity.provider,
      user_provider_account_id: identity.providerAccountId,
      balance_usd: 0,
      balance_krw: 0,
      last_credit_at: null,
    };
  }
  const { data } = await supabase
    .from("user_credit_balances")
    .select("*")
    .eq("user_provider", identity.provider)
    .eq("user_provider_account_id", identity.providerAccountId)
    .maybeSingle();
  if (!data) {
    return {
      user_provider: identity.provider,
      user_provider_account_id: identity.providerAccountId,
      balance_usd: 0,
      balance_krw: 0,
      last_credit_at: null,
    };
  }
  return {
    user_provider: data.user_provider as string,
    user_provider_account_id: data.user_provider_account_id as string,
    balance_usd: Number(data.balance_usd) || 0,
    balance_krw: Number(data.balance_krw) || 0,
    last_credit_at: (data.last_credit_at as string | null) || null,
  };
}

export async function getUserCreditHistory(
  identity: { provider: string; providerAccountId: string },
  limit = 50
): Promise<CreditLedgerRow[]> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("user_credit_ledger")
    .select("*")
    .eq("user_provider", identity.provider)
    .eq("user_provider_account_id", identity.providerAccountId)
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 500));
  return (data as CreditLedgerRow[] | null) || [];
}
