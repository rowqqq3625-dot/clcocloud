import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { recordVendingAction } from "@/lib/vending/log";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/vending/keys/:id/reveal
// 키 원문을 1회 응답한다. 매 호출이 KEY_REVEAL 감사 로그를 남긴다.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { data: row, error } = await supabase
    .from("api_key_inventory")
    .select("id,key_value,key_fingerprint,key_preview,product_code,status")
    .eq("id", params.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });
  if (!row) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (!row.key_value) return NextResponse.json({ error: "no_raw_key" }, { status: 404 });

  await recordVendingAction({
    supabase,
    action: "KEY_REVEAL",
    actor_admin_id: null,
    target_key_id: params.id,
    plan_code: row.product_code as string | null,
    before: {},
    after: { key_fingerprint: row.key_fingerprint, key_preview: row.key_preview, status: row.status },
    req,
    admin_email: guard.session.admin_email,
  });

  return NextResponse.json({
    key_value: row.key_value,
    key_preview: row.key_preview,
    key_fingerprint: row.key_fingerprint,
    expires_in_seconds: 5,
  });
}
