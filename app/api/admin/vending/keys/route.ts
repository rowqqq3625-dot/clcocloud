import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { recordVendingAction } from "@/lib/vending/log";
import { computeFingerprint, computePreview } from "@/lib/vending/helpers";
import { KeyListQuerySchema, KeyRegisterSchema } from "@/lib/vending/schemas";
import type { KeyRow } from "@/lib/vending/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/vending/keys — 목록 (필터/정렬/페이지)
export async function GET(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = KeyListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query", details: parsed.error.flatten() }, { status: 400 });
  }
  const q = parsed.data;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  let query = supabase
    .from("api_key_inventory")
    .select(
      "id,plan_id,product_code,key_fingerprint,key_preview,status,memo,created_by,reserved_at,reserved_order_id,issued_at,issued_order_no,issued_order_id,revoked_at,revoked_reason,created_at,updated_at",
      { count: "exact" }
    );

  if (q.status) query = query.eq("status", q.status);
  if (q.plan_code) query = query.eq("product_code", q.plan_code);
  if (q.from) query = query.gte("created_at", q.from);
  if (q.to) query = query.lte("created_at", q.to);
  if (q.search) {
    query = query.or(`issued_order_no.ilike.%${q.search}%,memo.ilike.%${q.search}%,key_preview.ilike.%${q.search}%`);
  }

  query = query.order(q.sort, { ascending: q.order === "asc" });

  const from = (q.page - 1) * q.pageSize;
  const to = from + q.pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) {
    console.error("[vending] keys list failed:", error);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  return NextResponse.json({
    rows: data || [],
    total: count ?? 0,
    page: q.page,
    pageSize: q.pageSize,
  });
}

// POST /api/admin/vending/keys — 단건 등록
export async function POST(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = KeyRegisterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { plan_code, key_value, memo } = parsed.data;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { data: plan, error: planErr } = await supabase
    .from("plans")
    .select("id,code")
    .eq("code", plan_code)
    .eq("active", true)
    .maybeSingle();
  if (planErr || !plan) {
    return NextResponse.json({ error: "plan_not_found", plan_code }, { status: 404 });
  }

  const fingerprint = computeFingerprint(key_value);
  const preview = computePreview(key_value);

  const { data: inserted, error: insertErr } = await supabase
    .from("api_key_inventory")
    .insert({
      plan_id: plan.id,
      product_code: plan_code,
      key_value,
      key_fingerprint: fingerprint,
      key_preview: preview,
      memo: memo ?? null,
      status: "available",
    })
    .select("id,plan_id,product_code,key_fingerprint,key_preview,status,memo,created_at")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return NextResponse.json({ error: "duplicate_key", key_preview: preview }, { status: 409 });
    }
    console.error("[vending] keys insert failed:", insertErr);
    return NextResponse.json({ error: "insert_failed" }, { status: 500 });
  }

  await recordVendingAction({
    supabase,
    action: "KEY_REGISTER",
    actor_admin_id: null,
    target_key_id: inserted.id,
    plan_code,
    before: {},
    after: { status: "available", key_fingerprint: fingerprint, key_preview: preview },
    req,
    admin_email: guard.session.admin_email,
  });

  return NextResponse.json({ row: inserted as KeyRow }, { status: 201 });
}
