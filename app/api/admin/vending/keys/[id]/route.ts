import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { recordVendingAction } from "@/lib/vending/log";
import { KeyUpdateSchema } from "@/lib/vending/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_COLUMNS =
  "id,plan_id,product_code,key_fingerprint,key_preview,status,memo,created_by,reserved_at,reserved_order_id,issued_at,issued_order_no,issued_order_id,revoked_at,revoked_reason,created_at,updated_at";

// GET /api/admin/vending/keys/:id — 상세 (key_value 미포함)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { data: row, error } = await supabase
    .from("api_key_inventory")
    .select(SAFE_COLUMNS)
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // 발급 이력 (관련 주문)
  const { data: issuance } = await supabase
    .from("issued_api_keys")
    .select("id,order_no,issued_at")
    .eq("key_id", params.id)
    .order("issued_at", { ascending: false });

  return NextResponse.json({ row, issuance: issuance || [] });
}

// PATCH /api/admin/vending/keys/:id — memo 또는 plan_code 변경
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = KeyUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { data: before, error: beforeErr } = await supabase
    .from("api_key_inventory")
    .select("id,plan_id,product_code,status,memo")
    .eq("id", params.id)
    .maybeSingle();
  if (beforeErr) return NextResponse.json({ error: "query_failed" }, { status: 500 });
  if (!before) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (parsed.data.memo !== undefined) update.memo = parsed.data.memo;
  if (parsed.data.plan_code) {
    const { data: plan } = await supabase
      .from("plans")
      .select("id,code")
      .eq("code", parsed.data.plan_code)
      .eq("active", true)
      .maybeSingle();
    if (!plan) return NextResponse.json({ error: "plan_not_found" }, { status: 404 });
    if (before.status !== "available") {
      return NextResponse.json({ error: "plan_change_only_when_available", current_status: before.status }, { status: 409 });
    }
    update.plan_id = plan.id;
    update.product_code = plan.code;
  }
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "empty_update" }, { status: 400 });
  }

  const { data: after, error: updateErr } = await supabase
    .from("api_key_inventory")
    .update(update)
    .eq("id", params.id)
    .select(SAFE_COLUMNS)
    .single();

  if (updateErr) {
    console.error("[vending] key update failed:", updateErr);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await recordVendingAction({
    supabase,
    action: "KEY_UPDATE",
    actor_admin_id: null,
    target_key_id: params.id,
    plan_code: (after as any).product_code,
    before: { memo: before.memo, plan_id: before.plan_id, product_code: before.product_code },
    after: update,
    req,
    admin_email: guard.session.admin_email,
  });

  return NextResponse.json({ row: after });
}
