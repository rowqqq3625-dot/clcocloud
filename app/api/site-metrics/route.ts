import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type MetricOrder = {
  user_provider: string | null;
  user_provider_account_id: string | null;
};

export async function GET() {
  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ customers: 0, repurchaseRate: 0 }, { headers: { "Cache-Control": "no-store" } });
  }

  const { data, error } = await supabase
    .from("orders")
    .select("user_provider,user_provider_account_id");

  if (error || !data) {
    return NextResponse.json({ customers: 0, repurchaseRate: 0 }, { headers: { "Cache-Control": "no-store" } });
  }

  const purchaseCounts = new Map<string, number>();
  for (const order of data as MetricOrder[]) {
    if (!order.user_provider || !order.user_provider_account_id) continue;
    const key = `${order.user_provider}:${order.user_provider_account_id}`;
    purchaseCounts.set(key, (purchaseCounts.get(key) || 0) + 1);
  }

  const customers = purchaseCounts.size;
  const repeatCustomers = Array.from(purchaseCounts.values()).filter((count) => count >= 2).length;
  const repurchaseRate = customers > 0 ? Math.round((repeatCustomers / customers) * 100) : 0;

  return NextResponse.json({ customers, repurchaseRate }, { headers: { "Cache-Control": "no-store" } });
}
