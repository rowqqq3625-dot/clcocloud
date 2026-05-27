import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getAdminReviewDetail } from "@/lib/reviews/queries";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/admin/reviews/:id — single review with reviewer context
// (last 20 orders + last 20 prior reviews) for the abuse-detection
// surface in the admin review modal.
//
// The legacy POST handler here (which used to flip status/bonus_status
// in place) has been removed in favour of the dedicated action routes:
//   POST /api/admin/reviews/:id/approve
//   POST /api/admin/reviews/:id/reject
//   POST /api/admin/reviews/:id/hide
//   POST /api/admin/reviews/:id/unhide
//   POST /api/admin/reviews/:id/feature
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const detail = await getAdminReviewDetail(params.id);
  if (!detail.review) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
