import { NextResponse } from "next/server";
import { getApprovedReviews } from "@/lib/reviews/queries";

export const dynamic = "force-dynamic";

/**
 * Legacy endpoint kept for backward compatibility with the existing
 * landing-page Sequence10TextureBreak loader. New callers should use
 * GET /api/reviews instead.
 *
 * The response shape is intentionally identical to the pre-Phase-3
 * version (only `reviews` array, no pagination metadata) so the
 * existing client component continues to work without changes.
 */
export async function GET() {
  const { rows } = await getApprovedReviews({ limit: 24, sort: "recent" });
  return NextResponse.json({ reviews: rows });
}
