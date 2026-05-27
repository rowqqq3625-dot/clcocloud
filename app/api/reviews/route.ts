import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth-session";
import { getApprovedReviews, submitReview } from "@/lib/reviews/queries";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// GET /api/reviews — public listing for /reviews and the landing slider.
// ---------------------------------------------------------------------------

const SORT_VALUES = ["recent", "helpful"] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const limitRaw = Number(searchParams.get("limit") ?? 12);
  const offsetRaw = Number(searchParams.get("offset") ?? 0);
  const ratingRaw = searchParams.get("rating");
  const planCode = searchParams.get("plan") || undefined;
  const sortRaw = searchParams.get("sort");
  const featuredRaw = searchParams.get("featured");

  const sort: "recent" | "helpful" =
    sortRaw && (SORT_VALUES as readonly string[]).includes(sortRaw) ? (sortRaw as "recent" | "helpful") : "recent";
  const rating = ratingRaw ? Number(ratingRaw) : undefined;

  const { rows, total } = await getApprovedReviews({
    limit: Number.isFinite(limitRaw) ? limitRaw : 12,
    offset: Number.isFinite(offsetRaw) ? offsetRaw : 0,
    rating: rating && rating >= 1 && rating <= 5 ? rating : undefined,
    planCode,
    sort,
    featuredOnly: featuredRaw === "1" || featuredRaw === "true",
  });

  return NextResponse.json({ reviews: rows, total });
}

// ---------------------------------------------------------------------------
// POST /api/reviews — submit a new review.
// ---------------------------------------------------------------------------

const reviewSchema = z.object({
  orderId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(50).optional().nullable(),
  body: z.string().trim().min(1).max(2000), // wider envelope; submitReview enforces the spec bound
  displayName: z.string().trim().min(1).max(40),
});

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = reviewSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_review", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await submitReview({
    orderId: parsed.data.orderId,
    identity: {
      provider: session.provider,
      providerAccountId: session.providerAccountId,
    },
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body,
    displayName: parsed.data.displayName,
  });

  if (result.ok) {
    return NextResponse.json({ reviewId: result.reviewId, status: "pending" }, { status: 201 });
  }

  switch (result.code) {
    case "supabase_not_configured":
      return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
    case "rating_invalid":
    case "body_length_invalid":
    case "title_too_long":
    case "validation_failed":
      return NextResponse.json({ error: result.code, message: result.message }, { status: 400 });
    case "order_not_found":
      return NextResponse.json({ error: "order_not_found" }, { status: 404 });
    case "order_not_paid":
    case "cooldown_not_passed":
    case "review_already_exists":
      return NextResponse.json({ error: result.code }, { status: 409 });
    default:
      return NextResponse.json({ error: "rpc_failed", message: result.message }, { status: 500 });
  }
}
