import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { ReviewActionLog, ReviewActionLogAction } from "@/lib/reviews/types";

export type LogListParams = {
  limit?: number;
  offset?: number;
  action?: ReviewActionLogAction | "all";
  targetReviewId?: string;
  actorAdminEmail?: string;
  fromDate?: string;
  toDate?: string;
};

export async function getReviewActionLogs(
  params: LogListParams = {}
): Promise<{ rows: ReviewActionLog[]; total: number }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { rows: [], total: 0 };

  const limit = Math.min(Math.max(params.limit ?? 100, 1), 500);
  const offset = Math.max(params.offset ?? 0, 0);

  let query = supabase.from("review_action_logs").select("*", { count: "exact" });
  if (params.action && params.action !== "all") query = query.eq("action", params.action);
  if (params.targetReviewId) query = query.eq("target_review_id", params.targetReviewId);
  if (params.actorAdminEmail) query = query.eq("actor_admin_email", params.actorAdminEmail);
  if (params.fromDate) query = query.gte("created_at", params.fromDate);
  if (params.toDate) query = query.lte("created_at", params.toDate);

  query = query.order("created_at", { ascending: false });

  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error || !data) return { rows: [], total: 0 };
  return { rows: data as ReviewActionLog[], total: count ?? 0 };
}

/**
 * Direct insert helper for actions that don't have a dedicated DB
 * function — the manual CRM note option in the admin review-review
 * modal, for example. Submit/Approve/Reject/Hide/etc. already log
 * themselves through the SQL functions, so this is rarely needed.
 */
export async function logCustomAction(input: {
  action: ReviewActionLogAction;
  adminEmail?: string;
  userProvider?: string;
  userProviderAccountId?: string;
  targetReviewId?: string;
  targetCaseStudyId?: string;
  beforeState?: unknown;
  afterState?: unknown;
}): Promise<{ ok: boolean }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false };
  const { error } = await supabase.from("review_action_logs").insert({
    actor_admin_email: input.adminEmail ?? null,
    actor_user_provider: input.userProvider ?? null,
    actor_user_provider_account_id: input.userProviderAccountId ?? null,
    action: input.action,
    target_review_id: input.targetReviewId ?? null,
    target_case_study_id: input.targetCaseStudyId ?? null,
    before_state: input.beforeState ?? null,
    after_state: input.afterState ?? null,
  });
  return { ok: !error };
}
