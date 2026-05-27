import { NextRequest, NextResponse } from "next/server";
import { getPublishedCaseStudies } from "@/lib/case-studies/queries";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/case-studies — public list of published case studies.
// Used by /case-studies and by the landing-page "고객 사례" 3-card teaser.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const limitRaw = Number(request.nextUrl.searchParams.get("limit") ?? 24);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, 200) : 24;
  const items = await getPublishedCaseStudies(limit);
  return NextResponse.json({ items });
}
