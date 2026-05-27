import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { sendBuyerPayDone } from "@/lib/bati";
import { recordVendingAction } from "@/lib/vending/log";
import { ManualIssueSchema } from "@/lib/vending/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_NAME: Record<string, string> = {
  STANDARD: "STANDARD 잔액형 키",
  PRO: "PRO 잔액형 키",
  ULTRA: "ULTRA 잔액형 키",
};

// POST /api/admin/vending/manual-issue
// paid_pending_key 상태의 주문에 가용 키 1개를 강제 매칭한다.
//   . key_id 지정 시 해당 키를 사용 (운영자가 특정 키 선택 가능)
//   . 미지정 시 issue_key_for_order 가 자동 픽업
//   . 발급 후 (옵션) 구매자 알림톡 재발송
export async function POST(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = ManualIssueSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { order_no, key_id, notify_buyer } = parsed.data;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id,order_no,status,buyer_name,buyer_phone,product_code,amount")
    .eq("order_no", order_no)
    .maybeSingle();
  if (orderErr) return NextResponse.json({ error: "query_failed" }, { status: 500 });
  if (!order) return NextResponse.json({ error: "order_not_found" }, { status: 404 });
  if (order.status !== "paid_pending_key" && order.status !== "paid") {
    return NextResponse.json({ error: "order_not_eligible", current_status: order.status }, { status: 409 });
  }

  // key_id 지정 시 사전에 reserve 처리 → 그 다음 issue_key_for_order 호출
  if (key_id) {
    const { data: target, error: targetErr } = await supabase
      .from("api_key_inventory")
      .select("id,status,plan_id,product_code")
      .eq("id", key_id)
      .maybeSingle();
    if (targetErr) return NextResponse.json({ error: "query_failed" }, { status: 500 });
    if (!target) return NextResponse.json({ error: "key_not_found" }, { status: 404 });
    if (target.status !== "available") {
      return NextResponse.json({ error: "key_not_available", current_status: target.status }, { status: 409 });
    }
    if (target.product_code !== order.product_code) {
      return NextResponse.json({ error: "plan_mismatch", key_plan: target.product_code, order_plan: order.product_code }, { status: 409 });
    }

    const { error: reserveErr } = await supabase
      .from("api_key_inventory")
      .update({ status: "reserved", reserved_at: new Date().toISOString(), reserved_order_id: order.id })
      .eq("id", key_id)
      .eq("status", "available");
    if (reserveErr) return NextResponse.json({ error: "reserve_failed", message: reserveErr.message }, { status: 500 });
  }

  const { data: issued, error: issueErr } = await supabase.rpc("issue_key_for_order", { p_order_no: order_no });
  if (issueErr || !issued || issued.length === 0) {
    return NextResponse.json({
      error: "issue_failed",
      message: issueErr?.message || "OUT_OF_STOCK",
    }, { status: 409 });
  }
  const newKey = issued[0] as { api_key: string; key_id: string; plan_code: string };

  // paid_pending_key → paid 로 전이
  await supabase
    .from("orders")
    .update({ status: "paid", issued_key_id: newKey.key_id })
    .eq("id", order.id);

  await recordVendingAction({
    supabase,
    action: "MANUAL_ISSUE",
    actor_admin_id: null,
    target_key_id: newKey.key_id,
    target_order_no: order_no,
    plan_code: newKey.plan_code,
    before: { order_status: order.status },
    after: { order_status: "paid", key_id: newKey.key_id, requested_key_id: key_id ?? null },
    req,
    admin_email: guard.session.admin_email,
  });

  if (notify_buyer) {
    void sendBuyerPayDone({
      buyerName: order.buyer_name as string,
      buyerPhone: order.buyer_phone as string,
      orderNo: order_no,
      productName: PLAN_NAME[order.product_code as string] || `${order.product_code} 잔액형 키`,
      amount: order.amount as number,
      apiKey: newKey.api_key,
    }).catch((e) => console.error("[vending] manual-issue notify failed:", e));
  }

  return NextResponse.json({ ok: true, key_id: newKey.key_id, plan_code: newKey.plan_code });
}
