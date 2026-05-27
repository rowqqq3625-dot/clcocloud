import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { setFeatured } from "@/lib/reviews/reward";

export const runtime = "nodejs";

const schema = z.object({
  featured: z.boolean(),
  order: z.number().int().nonnegative().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/admin/reviews/:id/feature
// Toggles whether a review appears in the landing-page featured slider
// and assigns its position. Only approved reviews can be featured.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await setFeatured(
    params.id,
    guard.session.admin_email,
    parsed.data.featured,
    parsed.data.order
  );
  if (!result.ok) {
    let status = 500;
    if (result.code === "review_not_found") status = 404;
    else if (result.code === "only_approved_can_be_featured") status = 409;
    else if (result.code === "supabase_not_configured") status = 503;
    return NextResponse.json({ error: result.code, message: result.message }, { status });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: parsed.data.featured ? "REVIEW_FEATURE" : "REVIEW_UNFEATURE",
    targetType: "review",
    targetId: params.id,
    payload: { featured: parsed.data.featured, order: parsed.data.order ?? null },
    req: request,
  });

  return NextResponse.json({ ok: true });
}
