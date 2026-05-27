import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { unhideReview } from "@/lib/reviews/reward";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// POST /api/admin/reviews/:id/unhide
// Restores a hidden review. If the review had ever been approved
// (approved_at is set), it returns to 'approved'; otherwise to 'pending'.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const result = await unhideReview(params.id, guard.session.admin_email);
  if (!result.ok) {
    let status = 500;
    if (result.code === "review_not_found") status = 404;
    else if (result.code === "review_not_hidden") status = 409;
    else if (result.code === "supabase_not_configured") status = 503;
    return NextResponse.json({ error: result.code, message: result.message }, { status });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "REVIEW_UNHIDE",
    targetType: "review",
    targetId: params.id,
    req: request,
  });

  return NextResponse.json({ ok: true });
}
