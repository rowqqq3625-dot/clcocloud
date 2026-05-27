import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";
import { getUserReviews } from "@/lib/reviews/queries";
import { getUserCreditBalance, getUserCreditHistory } from "@/lib/reviews/reward";
import { getEligibleOrders } from "@/lib/reviews/eligibility";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/mypage/reviews — power the /mypage/reviews surface.
//
// Returns:
//   - reviews         : current user's reviews (all statuses)
//   - eligibleOrders  : the subset of orders that can be reviewed *now*
//                       so the page can banner "리뷰 작성 가능한 주문 N건"
//   - creditBalance   : current USD/KRW balance (from user_credit_ledger)
//   - creditHistory   : most recent ledger rows so the page can show
//                       "보상 지급 내역" inline (review_reward + others)
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const identity = {
    provider: session.provider,
    providerAccountId: session.providerAccountId,
  };

  const [reviews, orders, balance, history] = await Promise.all([
    getUserReviews(identity),
    getEligibleOrders(identity),
    getUserCreditBalance(identity),
    getUserCreditHistory(identity, 30),
  ]);

  const eligibleNow = orders.filter((o) => o.is_eligible);

  return NextResponse.json({
    reviews,
    eligibleOrders: eligibleNow,
    eligibleOrdersCount: eligibleNow.length,
    creditBalance: balance,
    creditHistory: history,
  });
}
