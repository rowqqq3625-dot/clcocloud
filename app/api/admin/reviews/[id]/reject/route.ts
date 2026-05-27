import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { rejectReview } from "@/lib/reviews/reward";

export const runtime = "nodejs";

const schema = z.object({
  reason: z.string().trim().min(1).max(500),
});

// ---------------------------------------------------------------------------
// POST /api/admin/reviews/:id/reject
// Only pending reviews can be rejected; use revoke_reward for already-
// approved entries that need to be undone.
// No notification is sent — the user sees the reason on /mypage/reviews.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "reason_required", issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await rejectReview(params.id, guard.session.admin_email, parsed.data.reason);
  if (!result.ok) {
    let status = 500;
    if (result.code === "review_not_found") status = 404;
    else if (result.code === "review_not_rejectable") status = 409;
    else if (result.code === "reason_required") status = 400;
    else if (result.code === "supabase_not_configured") status = 503;
    return NextResponse.json({ error: result.code, message: result.message }, { status });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "REVIEW_REJECT",
    targetType: "review",
    targetId: params.id,
    payload: { reason: parsed.data.reason },
    req: request,
  });

  return NextResponse.json({ ok: true });
}
