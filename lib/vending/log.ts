import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { logAdminAction } from "@/lib/admin/audit";
import type { VendingActionType } from "./types";

type RequestLike = {
  headers: { get(name: string): string | null };
};

type RecordOptions = {
  supabase: SupabaseClient;
  action: VendingActionType;
  actor_admin_id?: string | null;
  target_key_id?: string | null;
  target_order_no?: string | null;
  plan_code?: string | null;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  // 있으면 admin_audit_logs 에도 미러 (IP/UA/국가 컨텍스트 포함)
  req?: RequestLike;
  admin_email?: string | null;
};

// vending_action_logs 인서트 + (옵션) admin_audit_logs 미러.
// DB 함수 log_vending_action 을 호출해 SECURITY DEFINER 권한으로 인서트한다.
export async function recordVendingAction(opts: RecordOptions): Promise<void> {
  const {
    supabase,
    action,
    actor_admin_id = null,
    target_key_id = null,
    target_order_no = null,
    plan_code = null,
    before = {},
    after = {},
    req,
    admin_email,
  } = opts;

  const { error } = await supabase.rpc("log_vending_action", {
    p_actor: actor_admin_id,
    p_action: action,
    p_key_id: target_key_id,
    p_order_no: target_order_no,
    p_plan_code: plan_code,
    p_before: before,
    p_after: after,
  });

  if (error) {
    console.error(`[vending] log_vending_action failed for ${action}:`, error);
  }

  // admin_audit_logs 미러 — API 라우트 컨텍스트에서만 (req 가 있을 때)
  if (req && admin_email !== undefined) {
    try {
      await logAdminAction({
        email: admin_email,
        action: `VENDING_${action}`,
        targetType: target_key_id ? "vending_key" : "vending",
        targetId: target_key_id,
        payload: {
          target_order_no,
          plan_code,
          before,
          after,
        },
        req,
      });
    } catch (err) {
      console.error(`[vending] logAdminAction mirror failed for ${action}:`, err);
    }
  }
}
