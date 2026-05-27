import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getRewardLedger } from "@/lib/reviews/reward";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// GET /api/admin/reviews/rewards
// Paginated reward ledger + per-filter totals (paid / revoked, USD / KRW).
// Drives the /admin-panel/reviews/rewards table and the cumulative
// totals card at the top of that page.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const sp = request.nextUrl.searchParams;
  const limit = Number(sp.get("limit") ?? 50);
  const offset = Number(sp.get("offset") ?? 0);
  const fromDate = sp.get("fromDate") || undefined;
  const toDate = sp.get("toDate") || undefined;
  const userProvider = sp.get("userProvider") || undefined;
  const userProviderAccountId = sp.get("userProviderAccountId") || undefined;
  const includeRevoked = sp.get("includeRevoked") === "true";
  const minRaw = sp.get("minAmountUsd");
  const maxRaw = sp.get("maxAmountUsd");

  const result = await getRewardLedger({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    fromDate,
    toDate,
    userProvider,
    userProviderAccountId,
    includeRevoked,
    minAmountUsd: minRaw != null && Number.isFinite(Number(minRaw)) ? Number(minRaw) : undefined,
    maxAmountUsd: maxRaw != null && Number.isFinite(Number(maxRaw)) ? Number(maxRaw) : undefined,
  });

  return NextResponse.json(result);
}
