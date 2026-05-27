import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth-session";
import {
  getReviewById,
  hasUserVotedHelpful,
  resubmitReview,
} from "@/lib/reviews/queries";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

// ---------------------------------------------------------------------------
// GET /api/reviews/:id — public detail of an approved review.
// If the caller is authenticated, also report whether they voted helpful
// so the detail UI can render the button in the correct state.
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: RouteContext) {
  const review = await getReviewById(params.id);
  if (!review) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const session = getSessionFromRequest(request);
  let voted = false;
  if (session) {
    voted = await hasUserVotedHelpful(params.id, {
      provider: session.provider,
      providerAccountId: session.providerAccountId,
    });
  }
  return NextResponse.json({ review, voted });
}

// ---------------------------------------------------------------------------
// PATCH /api/reviews/:id — resubmit a previously rejected review.
// ---------------------------------------------------------------------------

const resubmitSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(50).optional().nullable(),
  body: z.string().trim().min(1).max(2000),
});

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const json = await request.json().catch(() => null);
  const parsed = resubmitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_review", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await resubmitReview({
    reviewId: params.id,
    identity: {
      provider: session.provider,
      providerAccountId: session.providerAccountId,
    },
    rating: parsed.data.rating,
    title: parsed.data.title ?? null,
    body: parsed.data.body,
  });

  if (result.ok) return NextResponse.json({ ok: true, status: "pending" });

  switch (result.code) {
    case "supabase_not_configured":
      return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
    case "rating_invalid":
    case "body_length_invalid":
    case "title_too_long":
    case "validation_failed":
      return NextResponse.json({ error: result.code, message: result.message }, { status: 400 });
    case "review_not_found":
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    case "review_not_rejected":
      return NextResponse.json({ error: "review_not_rejected" }, { status: 409 });
    default:
      return NextResponse.json({ error: "update_failed", message: result.message }, { status: 500 });
  }
}
