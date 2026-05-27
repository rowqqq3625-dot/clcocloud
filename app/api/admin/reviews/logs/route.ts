import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getReviewActionLogs } from "@/lib/reviews/logs";
import type { ReviewActionLogAction } from "@/lib/reviews/types";

export const runtime = "nodejs";

const ALLOWED_ACTIONS: readonly ReviewActionLogAction[] = [
  "REVIEW_SUBMIT",
  "REVIEW_RESUBMIT",
  "REVIEW_APPROVE",
  "REVIEW_REJECT",
  "REVIEW_HIDE",
  "REVIEW_UNHIDE",
  "REVIEW_FEATURE",
  "REVIEW_UNFEATURE",
  "REVIEW_HELPFUL_ADD",
  "REVIEW_HELPFUL_REMOVE",
  "REWARD_GRANT",
  "REWARD_REVOKE",
  "CASE_STUDY_CREATE",
  "CASE_STUDY_UPDATE",
  "CASE_STUDY_PUBLISH",
  "CASE_STUDY_UNPUBLISH",
];

// ---------------------------------------------------------------------------
// GET /api/admin/reviews/logs
// Activity log viewer with action / actor / date / target filters.
// Server-side pagination since the table can grow indefinitely.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const sp = request.nextUrl.searchParams;
  const limit = Number(sp.get("limit") ?? 100);
  const offset = Number(sp.get("offset") ?? 0);
  const actionRaw = sp.get("action");
  const action =
    actionRaw && (ALLOWED_ACTIONS as readonly string[]).includes(actionRaw)
      ? (actionRaw as ReviewActionLogAction)
      : undefined;
  const targetReviewId = sp.get("targetReviewId") || undefined;
  const actorAdminEmail = sp.get("actorAdminEmail") || undefined;
  const fromDate = sp.get("fromDate") || undefined;
  const toDate = sp.get("toDate") || undefined;

  const result = await getReviewActionLogs({
    limit: Number.isFinite(limit) ? limit : 100,
    offset: Number.isFinite(offset) ? offset : 0,
    action,
    targetReviewId,
    actorAdminEmail,
    fromDate,
    toDate,
  });

  return NextResponse.json(result);
}
