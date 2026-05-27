import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { bulkRejectReviews } from "@/lib/reviews/reward";

export const runtime = "nodejs";

const schema = z.object({
  reviewIds: z.array(z.string().uuid()).min(1).max(100),
  reason: z.string().trim().min(1).max(500),
});

// ---------------------------------------------------------------------------
// POST /api/admin/reviews/bulk-reject
// Rejects N pending reviews with the same reason. Already-approved
// rows fail individually (revoke_reward path is the correct API for them).
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const results = await bulkRejectReviews(
    parsed.data.reviewIds,
    guard.session.admin_email,
    parsed.data.reason
  );
  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.length - succeeded;

  await logAdminAction({
    email: guard.session.admin_email,
    action: "REVIEW_BULK_REJECT",
    targetType: "review",
    targetId: null,
    payload: { count: results.length, succeeded, failed, reason: parsed.data.reason },
    req: request,
  });

  return NextResponse.json({ ok: true, results, succeeded, failed });
}
