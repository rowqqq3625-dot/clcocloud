import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { revokeReward } from "@/lib/reviews/reward";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().trim().min(1).max(500),
  hideReview: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/admin/reviews/rewards/:id/revoke
//
// `:id` here is the `review_reward_ledger.id` row (i.e. the ledger
// entry the operator is acting on in the rewards table). We resolve
// the review_id from the ledger row, then delegate to the
// revoke_reward RPC so the user_credit_ledger debit + audit log are
// written atomically.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "reason_required", issues: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const { data: row, error } = await supabase
    .from("review_reward_ledger")
    .select("review_id, revoked_at")
    .eq("id", params.id)
    .maybeSingle();
  if (error || !row) return NextResponse.json({ error: "reward_not_found" }, { status: 404 });
  if (row.revoked_at) return NextResponse.json({ error: "already_revoked" }, { status: 409 });

  const result = await revokeReward({
    reviewId: row.review_id as string,
    adminEmail: guard.session.admin_email,
    reason: parsed.data.reason,
    hideReview: parsed.data.hideReview ?? false,
  });

  if (!result.ok) {
    let status = 500;
    if (result.code === "reward_not_found_or_already_revoked") status = 409;
    else if (result.code === "reason_required") status = 400;
    else if (result.code === "supabase_not_configured") status = 503;
    return NextResponse.json({ error: result.code, message: result.message }, { status });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "REWARD_REVOKE",
    targetType: "review_reward",
    targetId: params.id,
    payload: {
      review_id: result.reviewId,
      amount_usd: result.amountUsd,
      amount_krw: result.amountKrw,
      review_status_after: result.reviewStatus,
      hide_review: parsed.data.hideReview ?? false,
      reason: parsed.data.reason,
    },
    req: request,
  });

  return NextResponse.json({
    ok: true,
    reviewId: result.reviewId,
    revokeCreditLedgerId: result.revokeCreditLedgerId,
    amountUsd: result.amountUsd,
    amountKrw: result.amountKrw,
    reviewStatus: result.reviewStatus,
  });
}
