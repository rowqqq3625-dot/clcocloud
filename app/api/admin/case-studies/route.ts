import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { guardAdminApi } from "@/lib/admin/guard";
import { logAdminAction } from "@/lib/admin/audit";
import { createCaseStudy, getAdminCaseStudies } from "@/lib/case-studies/queries";

export const runtime = "nodejs";

const createSchema = z.object({
  slug: z.string().min(1).max(80),
  title: z.string().min(1).max(120),
  summary: z.string().min(1).max(200),
  bodyMd: z.string().min(1),
  reviewId: z.string().uuid().optional().nullable(),
  heroImageUrl: z.string().url().optional().nullable(),
  customerLabel: z.string().max(120).optional().nullable(),
  planCode: z.string().max(40).optional().nullable(),
  metrics: z.record(z.string(), z.union([z.string(), z.number()])).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/admin/case-studies — paginated list (any published state).
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const sp = request.nextUrl.searchParams;
  const publishedRaw = sp.get("published");
  const published =
    publishedRaw === "true" ? true : publishedRaw === "false" ? false : undefined;
  const search = sp.get("search") || undefined;
  const limit = Number(sp.get("limit") ?? 25);
  const offset = Number(sp.get("offset") ?? 0);

  const result = await getAdminCaseStudies({
    published,
    search,
    limit: Number.isFinite(limit) ? limit : 25,
    offset: Number.isFinite(offset) ? offset : 0,
  });
  return NextResponse.json(result);
}

// ---------------------------------------------------------------------------
// POST /api/admin/case-studies — create a new case study (draft).
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await createCaseStudy(
    {
      slug: parsed.data.slug,
      title: parsed.data.title,
      summary: parsed.data.summary,
      bodyMd: parsed.data.bodyMd,
      reviewId: parsed.data.reviewId ?? null,
      heroImageUrl: parsed.data.heroImageUrl ?? null,
      customerLabel: parsed.data.customerLabel ?? null,
      planCode: parsed.data.planCode ?? null,
      metrics: parsed.data.metrics ?? {},
    },
    guard.session.admin_email
  );

  if (!result.ok) {
    let status = 500;
    if (result.code === "validation_failed") status = 400;
    else if (result.code === "slug_taken") status = 409;
    else if (result.code === "supabase_not_configured") status = 503;
    return NextResponse.json({ error: result.code, message: result.message }, { status });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "CASE_STUDY_CREATE",
    targetType: "case_study",
    targetId: result.caseStudy.id,
    payload: {
      slug: result.caseStudy.slug,
      title: result.caseStudy.title,
      review_id: result.caseStudy.review_id,
    },
    req: request,
  });

  return NextResponse.json({ ok: true, caseStudy: result.caseStudy }, { status: 201 });
}
