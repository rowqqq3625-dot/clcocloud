import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { hideReview } from "@/lib/reviews/reward";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// POST /api/admin/reviews/:id/hide
// Removes an already-approved review from public surfaces without
// touching the reward. Use revoke_reward (with hide_review=true) when
// the reward also needs to be reversed.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const result = await hideReview(params.id, guard.session.admin_email);
  if (!result.ok) {
    let status = 500;
    if (result.code === "review_not_found") status = 404;
    else if (result.code === "review_already_hidden") status = 409;
    else if (result.code === "supabase_not_configured") status = 503;
    return NextResponse.json({ error: result.code, message: result.message }, { status });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "REVIEW_HIDE",
    targetType: "review",
    targetId: params.id,
    req: request,
  });

  return NextResponse.json({ ok: true });
}
