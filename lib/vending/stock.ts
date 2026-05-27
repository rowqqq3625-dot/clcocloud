import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanStock } from "./types";
import { getLowStockThreshold } from "./helpers";

// plan_stock_view 전체 조회.
export async function loadPlanStock(supabase: SupabaseClient): Promise<PlanStock[]> {
  const { data, error } = await supabase
    .from("plan_stock_view")
    .select("plan_code,available_count,reserved_count,issued_count,revoked_count,expired_count,total_count");

  if (error) {
    console.error("[vending] loadPlanStock failed:", error);
    return [];
  }
  return (data || []).map((r) => ({
    plan_code: r.plan_code as string,
    available_count: Number(r.available_count ?? 0),
    reserved_count: Number(r.reserved_count ?? 0),
    issued_count: Number(r.issued_count ?? 0),
    revoked_count: Number(r.revoked_count ?? 0),
    expired_count: Number(r.expired_count ?? 0),
    total_count: Number(r.total_count ?? 0),
  }));
}

// 임계치(기본 5) 이하인 플랜만 추려서 반환.
export async function getLowStockPlans(supabase: SupabaseClient, threshold?: number): Promise<PlanStock[]> {
  const t = threshold ?? getLowStockThreshold();
  const all = await loadPlanStock(supabase);
  return all.filter((p) => p.available_count <= t);
}

// 고아 키 카운트 — 백필 미완료 모니터링용.
export async function countOrphanKeys(supabase: SupabaseClient): Promise<number> {
  const { count, error } = await supabase
    .from("api_key_inventory")
    .select("id", { count: "exact", head: true })
    .is("plan_id", null);
  if (error) return 0;
  return count ?? 0;
}
