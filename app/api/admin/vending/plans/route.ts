import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { recordVendingAction } from "@/lib/vending/log";
import { PlanUpsertSchema } from "@/lib/vending/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/vending/plans — 플랜 목록
export async function GET(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("plans")
    .select("id,code,name_ko,price_krw,active,created_at,updated_at")
    .order("price_krw", { ascending: true });

  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });
  return NextResponse.json({ rows: data || [] });
}

// POST /api/admin/vending/plans — upsert
export async function POST(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = PlanUpsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { data: before } = await supabase
    .from("plans")
    .select("id,code,name_ko,price_krw,active")
    .eq("code", parsed.data.code)
    .maybeSingle();

  const { data: row, error } = await supabase
    .from("plans")
    .upsert(parsed.data, { onConflict: "code" })
    .select("id,code,name_ko,price_krw,active,created_at,updated_at")
    .single();

  if (error) {
    console.error("[vending] plan upsert failed:", error);
    return NextResponse.json({ error: "upsert_failed" }, { status: 500 });
  }

  await recordVendingAction({
    supabase,
    action: "PLAN_UPSERT",
    actor_admin_id: null,
    plan_code: parsed.data.code,
    before: before || {},
    after: parsed.data,
    req,
    admin_email: guard.session.admin_email,
  });

  return NextResponse.json({ row });
}
