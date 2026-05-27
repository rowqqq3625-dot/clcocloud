import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { approveAndGrantReward } from "@/lib/reviews/reward";

export const runtime = "nodejs";

const schema = z.object({
  rewardUsd: z.number().positive().optional(),
  rewardKrw: z.number().int().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/admin/reviews/:id/approve
// Atomic: review.status → 'approved', credit ledger +rewardUsd, reward
// ledger row, and review_action_logs entries (REVIEW_APPROVE + REWARD_GRANT).
// Both `rewardUsd` and `rewardKrw` are optional overrides; defaults come
// from REVIEW_REWARD_USD / REVIEW_REWARD_KRW env via getReviewConfig().
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await approveAndGrantReward({
    reviewId: params.id,
    adminEmail: guard.session.admin_email,
    rewardUsd: parsed.data.rewardUsd,
    rewardKrw: parsed.data.rewardKrw,
  });

  if (!result.ok) {
    const code = result.code;
    let status = 500;
    if (code === "review_not_found") status = 404;
    else if (code === "review_not_pending" || code === "reward_already_granted") status = 409;
    else if (code === "reward_amount_invalid" || code === "admin_email_required") status = 400;
    else if (code === "supabase_not_configured") status = 503;
    return NextResponse.json({ error: code, message: result.message }, { status });
  }

  // Mirror into admin_audit_logs so the global admin activity feed has
  // the same trace as the review-specific log produced by the SQL fn.
  await logAdminAction({
    email: guard.session.admin_email,
    action: "REVIEW_APPROVE",
    targetType: "review",
    targetId: params.id,
    payload: {
      reward_ledger_id: result.rewardLedgerId,
      credit_ledger_id: result.creditLedgerId,
      amount_usd: result.amountUsd,
      amount_krw: result.amountKrw,
    },
    req: request,
  });

  return NextResponse.json({
    ok: true,
    reviewId: result.reviewId,
    rewardLedgerId: result.rewardLedgerId,
    creditLedgerId: result.creditLedgerId,
    amountUsd: result.amountUsd,
    amountKrw: result.amountKrw,
    approvedAt: result.approvedAt,
  });
}
