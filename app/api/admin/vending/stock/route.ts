import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { countOrphanKeys, loadPlanStock } from "@/lib/vending/stock";
import { getLowStockThreshold } from "@/lib/vending/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/vending/stock — 대시보드 카운트 + 고아 키 수
export async function GET(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const threshold = getLowStockThreshold();
  const [stock, orphan] = await Promise.all([
    loadPlanStock(supabase),
    countOrphanKeys(supabase),
  ]);

  return NextResponse.json({
    threshold,
    stock,
    orphan_count: orphan,
    low_stock_plans: stock.filter((s) => s.available_count <= threshold).map((s) => s.plan_code),
  });
}
