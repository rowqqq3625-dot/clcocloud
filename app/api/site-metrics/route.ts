import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
const MANUAL_REPURCHASE_RATE = 100;

type MetricOrder = {
  user_provider: string | null;
  user_provider_account_id: string | null;
};

export async function GET() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ customers: 0, repurchaseRate: MANUAL_REPURCHASE_RATE }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("user_provider,user_provider_account_id");

  if (error || !data) {
    return NextResponse.json({ customers: 0, repurchaseRate: MANUAL_REPURCHASE_RATE }, { headers: { "Cache-Control": "no-store" } });
  }

  const purchaseCounts = new Map<string, number>();
  for (const order of data as MetricOrder[]) {
    if (!order.user_provider || !order.user_provider_account_id) continue;
    const key = `${order.user_provider}:${order.user_provider_account_id}`;
    purchaseCounts.set(key, (purchaseCounts.get(key) || 0) + 1);
  }

  const customers = purchaseCounts.size;
  // 이번 운영 반영분: 주문 DB 조회 경로는 유지하되 재구매율은 수동 100%로 고정한다.
  const repurchaseRate = MANUAL_REPURCHASE_RATE;

  return NextResponse.json({ customers, repurchaseRate }, { headers: { "Cache-Control": "no-store" } });
}
