import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { setCaseStudyPublished } from "@/lib/case-studies/queries";

export const runtime = "nodejs";

const schema = z.object({
  published: z.boolean(),
});

// ---------------------------------------------------------------------------
// POST /api/admin/case-studies/:id/publish
// Toggle publish state. When transitioning to published=true the lib
// helper stamps published_at; when transitioning back it clears the
// timestamp so the column always reflects the latest publish moment.
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await setCaseStudyPublished(
    params.id,
    parsed.data.published,
    guard.session.admin_email
  );
  if (!result.ok) {
    let status = 500;
    if (result.code === "not_found") status = 404;
    else if (result.code === "supabase_not_configured") status = 503;
    return NextResponse.json({ error: result.code, message: result.message }, { status });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: parsed.data.published ? "CASE_STUDY_PUBLISH" : "CASE_STUDY_UNPUBLISH",
    targetType: "case_study",
    targetId: params.id,
    payload: { published: parsed.data.published },
    req: request,
  });

  return NextResponse.json({ ok: true, caseStudy: result.caseStudy });
}
