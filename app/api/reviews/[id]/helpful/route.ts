import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";
import { toggleHelpful } from "@/lib/reviews/queries";

export const dynamic = "force-dynamic";

type RouteContext = { params: { id: string } };

// ---------------------------------------------------------------------------
// POST /api/reviews/:id/helpful — toggle "도움돼요" vote.
// One vote per user per review (DB UNIQUE constraint). Returns the
// resulting voted state plus the current helpful_count so the UI can
// update without a refetch.
// ---------------------------------------------------------------------------
export async function POST(_request: NextRequest, { params }: RouteContext) {
  const session = getSessionFromRequest(_request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await toggleHelpful(params.id, {
    provider: session.provider,
    providerAccountId: session.providerAccountId,
  });
  if (result.ok) {
    return NextResponse.json({
      voted: result.voted,
      helpful_count: result.helpful_count,
    });
  }
  switch (result.code) {
    case "supabase_not_configured":
      return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
    case "review_not_found":
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    default:
      return NextResponse.json({ error: "toggle_failed" }, { status: 500 });
  }
}
