import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { bulkApproveAndGrant } from "@/lib/reviews/reward";

export const runtime = "nodejs";

const schema = z.object({
  reviewIds: z.array(z.string().uuid()).min(1).max(100),
  rewardUsd: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/admin/reviews/bulk-approve
// Approves N reviews sequentially, each as its own transaction so a
// single failure (e.g. already-rewarded row) does not block the others.
// Returns per-row outcome so the admin UI can show partial success.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const results = await bulkApproveAndGrant(
    parsed.data.reviewIds,
    guard.session.admin_email,
    parsed.data.rewardUsd
  );

  const succeeded = results.filter((r) => r.ok).length;
  const failed = results.length - succeeded;

  await logAdminAction({
    email: guard.session.admin_email,
    action: "REVIEW_BULK_APPROVE",
    targetType: "review",
    targetId: null,
    payload: {
      count: results.length,
      succeeded,
      failed,
      reward_usd_override: parsed.data.rewardUsd ?? null,
    },
    req: request,
  });

  return NextResponse.json({ ok: true, results, succeeded, failed });
}
