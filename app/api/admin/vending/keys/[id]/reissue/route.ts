import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { sendBuyerPayDone } from "@/lib/bati";
import { recordVendingAction } from "@/lib/vending/log";
import { ReissueSchema } from "@/lib/vending/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PLAN_NAME: Record<string, string> = {
  STANDARD: "STANDARD 잔액형 키",
  PRO: "PRO 잔액형 키",
  ULTRA: "ULTRA 잔액형 키",
};

// POST /api/admin/vending/keys/:id/reissue
// 기존 키를 revoke 하고, 동일 주문에 신규 키를 issue_key_for_order 로 재발급한 뒤
// (옵션) 구매자에게 알림톡 재발송한다.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = ReissueSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { reason, notify_buyer } = parsed.data;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { data: oldKey, error: oldErr } = await supabase
    .from("api_key_inventory")
    .select("id,status,issued_order_no,product_code,plan_id")
    .eq("id", params.id)
    .maybeSingle();

  if (oldErr) return NextResponse.json({ error: "query_failed" }, { status: 500 });
  if (!oldKey) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (oldKey.status !== "issued" || !oldKey.issued_order_no) {
    return NextResponse.json({ error: "reissue_only_for_issued_key", status: oldKey.status }, { status: 409 });
  }

  const orderNo = oldKey.issued_order_no as string;

  // (1) 기존 키 revoke (DB 함수가 잠금 + 로그)
  const { error: revokeErr } = await supabase.rpc("revoke_key", {
    p_key_id: params.id,
    p_reason: `REISSUE: ${reason}`,
    p_actor: null,
  });
  if (revokeErr) {
    return NextResponse.json({ error: "revoke_failed", message: revokeErr.message }, { status: 500 });
  }

  // (2) 신규 키 발급 — 동일 order_no 로 issue_key_for_order
  const { data: issued, error: issueErr } = await supabase.rpc("issue_key_for_order", { p_order_no: orderNo });
  if (issueErr || !issued || issued.length === 0) {
    return NextResponse.json({
      error: "reissue_no_stock",
      message: issueErr?.message || "OUT_OF_STOCK",
      order_no: orderNo,
    }, { status: 409 });
  }
  const newKey = issued[0] as { api_key: string; key_id: string; plan_code: string };

  // (3) 감사 로그 — REISSUE 마커
  await recordVendingAction({
    supabase,
    action: "KEY_REISSUE",
    actor_admin_id: null,
    target_key_id: newKey.key_id,
    target_order_no: orderNo,
    plan_code: newKey.plan_code,
    before: { old_key_id: params.id, status: oldKey.status },
    after: { new_key_id: newKey.key_id, status: "issued", reason },
    req,
    admin_email: guard.session.admin_email,
  });

  // (4) 알림톡 재발송
  if (notify_buyer) {
    const { data: order } = await supabase
      .from("orders")
      .select("buyer_name,buyer_phone,amount,product_code")
      .eq("order_no", orderNo)
      .maybeSingle();

    if (order) {
      void sendBuyerPayDone({
        buyerName: order.buyer_name as string,
        buyerPhone: order.buyer_phone as string,
        orderNo,
        productName: PLAN_NAME[order.product_code as string] || `${order.product_code} 잔액형 키`,
        amount: order.amount as number,
        apiKey: newKey.api_key,
      }).catch((e) => console.error("[vending] reissue notify failed:", e));
    }
  }

  return NextResponse.json({ ok: true, new_key_id: newKey.key_id, order_no: orderNo });
}
