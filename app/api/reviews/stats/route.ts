import { NextResponse } from "next/server";
import { getReviewStats } from "@/lib/reviews/queries";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/reviews/stats — public aggregate stats for the landing
// REVIEWS bar (average rating, total, distribution) and the STATS
// section (총 구매자, 재구매율).
// ---------------------------------------------------------------------------
export async function GET() {
  const stats = await getReviewStats();
  return NextResponse.json({ stats });
}
