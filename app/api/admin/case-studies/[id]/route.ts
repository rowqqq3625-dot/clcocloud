import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { getAdminCaseStudyById, updateCaseStudy } from "@/lib/case-studies/queries";

export const runtime = "nodejs";

const patchSchema = z.object({
  slug: z.string().min(1).max(80).optional(),
  title: z.string().min(1).max(120).optional(),
  summary: z.string().min(1).max(200).optional(),
  bodyMd: z.string().min(1).optional(),
  reviewId: z.string().uuid().nullable().optional(),
  heroImageUrl: z.string().url().nullable().optional(),
  customerLabel: z.string().max(120).nullable().optional(),
  planCode: z.string().max(40).nullable().optional(),
  metrics: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/admin/case-studies/:id — single case study (any status) for
// the editor preload.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const item = await getAdminCaseStudyById(params.id);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ caseStudy: item });
}

// ---------------------------------------------------------------------------
// PATCH /api/admin/case-studies/:id — partial update. Slug uniqueness
// is enforced by the lib helper.
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await updateCaseStudy(
    { id: params.id, ...parsed.data },
    guard.session.admin_email
  );

  if (!result.ok) {
    let status = 500;
    if (result.code === "validation_failed") status = 400;
    else if (result.code === "slug_taken") status = 409;
    else if (result.code === "not_found") status = 404;
    else if (result.code === "supabase_not_configured") status = 503;
    return NextResponse.json({ error: result.code, message: result.message }, { status });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "CASE_STUDY_UPDATE",
    targetType: "case_study",
    targetId: params.id,
    payload: parsed.data,
    req: request,
  });

  return NextResponse.json({ ok: true, caseStudy: result.caseStudy });
}
