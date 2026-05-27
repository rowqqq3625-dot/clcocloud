import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";
import { getEligibleOrders } from "@/lib/reviews/eligibility";
import { getReviewConfig } from "@/lib/reviews/config";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/reviews/eligible-orders — orders the current user can review
// (or will be able to after cooldown). The /reviews/new page renders
// every paid order, distinguishing "can submit now" from
// "waiting for cooldown / key not issued / already reviewed".
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const config = getReviewConfig();
  const orders = await getEligibleOrders({
    provider: session.provider,
    providerAccountId: session.providerAccountId,
  });

  return NextResponse.json({
    orders,
    config: {
      eligibility_after_days: config.eligibilityAfterDays,
      body_min_len: config.bodyMinLen,
      body_max_len: config.bodyMaxLen,
      reward_usd: config.rewardUsd,
      reward_krw: config.rewardKrw,
    },
  });
}
