import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { setFeaturedOrder } from "@/lib/reviews/queries";

export const runtime = "nodejs";

const schema = z.object({
  pairs: z
    .array(
      z.object({
        reviewId: z.string().uuid(),
        order: z.number().int().nonnegative(),
      })
    )
    .min(1)
    .max(200),
});

// ---------------------------------------------------------------------------
// POST /api/admin/reviews/featured/order
// Persists the operator-curated order of featured reviews. Only rows
// that are already featured=true are accepted; non-featured rows are
// silently skipped (the lib helper enforces the WHERE clause).
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await setFeaturedOrder(parsed.data.pairs, guard.session.admin_email);
  if (!result.ok) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "REVIEW_FEATURED_REORDER",
    targetType: "review",
    targetId: null,
    payload: { count: parsed.data.pairs.length },
    req: request,
  });

  return NextResponse.json({ ok: true });
}
