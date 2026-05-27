import { NextResponse } from "next/server";
import { getPublishedCaseStudyBySlug } from "@/lib/case-studies/queries";

export const dynamic = "force-dynamic";

type RouteContext = { params: { slug: string } };

// ---------------------------------------------------------------------------
// GET /api/case-studies/:slug — public detail.
// Unpublished case studies are returned as 404 so unauthenticated
// callers cannot enumerate drafts.
// ---------------------------------------------------------------------------
export async function GET(_request: Request, { params }: RouteContext) {
  const item = await getPublishedCaseStudyBySlug(params.slug);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ item });
}
