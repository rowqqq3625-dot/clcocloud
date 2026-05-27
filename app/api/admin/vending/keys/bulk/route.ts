import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { recordVendingAction } from "@/lib/vending/log";
import { computeFingerprint, computePreview, getBulkMax, parseBulkText } from "@/lib/vending/helpers";
import { BulkRegisterSchema } from "@/lib/vending/schemas";
import type { BulkRegisterResult } from "@/lib/vending/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/vending/keys/bulk — 텍스트 박스 다건 등록 (한 줄당 1키)
export async function POST(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = BulkRegisterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }
  const { plan_code, raw_text, memo } = parsed.data;
  const max = getBulkMax();

  const { keys, skipped } = parseBulkText(raw_text, max);

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

  const result: BulkRegisterResult = {
    total: keys.length + skipped.length,
    registered: 0,
    duplicates: 0,
    failures: skipped.map((s) => ({ line: s.line, key_preview: computePreview(s.raw), reason: s.reason })),
  };

  for (const { line, key } of keys) {
    const fingerprint = computeFingerprint(key);
    const preview = computePreview(key);
    const { error: insertErr } = await supabase
      .from("api_key_inventory")
      .insert({
        plan_id: plan.id,
        product_code: plan_code,
        key_value: key,
        key_fingerprint: fingerprint,
        key_preview: preview,
        memo: memo ?? null,
        status: "available",
      });

    if (insertErr) {
      if (insertErr.code === "23505") {
        result.duplicates++;
        result.failures.push({ line, key_preview: preview, reason: "duplicate_in_db" });
      } else {
        result.failures.push({ line, key_preview: preview, reason: insertErr.message });
      }
      continue;
    }
    result.registered++;
  }

  await recordVendingAction({
    supabase,
    action: "KEY_BULK_REGISTER",
    actor_admin_id: null,
    plan_code,
    before: {},
    after: { registered: result.registered, duplicates: result.duplicates, failures: result.failures.length },
    req,
    admin_email: guard.session.admin_email,
  });

  return NextResponse.json(result, { status: 201 });
}
