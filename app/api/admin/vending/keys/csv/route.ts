import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { recordVendingAction } from "@/lib/vending/log";
import { computeFingerprint, computePreview, getBulkMax, isValidKeyFormat, parseCsv } from "@/lib/vending/helpers";
import type { BulkRegisterResult } from "@/lib/vending/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/vending/keys/csv — multipart/form-data 업로드
// CSV 헤더: plan_code, api_key, memo
export async function POST(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "invalid_form" }, { status: 400 });

  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file_required" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "file_too_large" }, { status: 413 });

  const text = await file.text();
  const { headers, rows } = parseCsv(text);
  if (!headers.includes("plan_code") || !headers.includes("api_key")) {
    return NextResponse.json({ error: "missing_headers", expected: ["plan_code", "api_key", "memo (optional)"] }, { status: 400 });
  }

  const max = getBulkMax();
  if (rows.length > max) {
    return NextResponse.json({ error: "too_many_rows", max, got: rows.length }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { data: plansData } = await supabase.from("plans").select("id,code").eq("active", true);
  const planMap = new Map<string, string>();
  for (const p of plansData || []) planMap.set(p.code as string, p.id as string);

  const result: BulkRegisterResult = {
    total: rows.length,
    registered: 0,
    duplicates: 0,
    failures: [],
  };

  const seenInBatch = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2; // 헤더 다음 줄부터
    const planCode = (row.plan_code || "").trim().toUpperCase();
    const key = (row.api_key || "").trim();
    const memo = (row.memo || "").trim() || null;
    const preview = key ? computePreview(key) : "—";

    if (!planCode || !key) {
      result.failures.push({ line, key_preview: preview, reason: "missing_field" });
      continue;
    }
    if (!isValidKeyFormat(key)) {
      result.failures.push({ line, key_preview: preview, reason: "invalid_format" });
      continue;
    }
    const planId = planMap.get(planCode);
    if (!planId) {
      result.failures.push({ line, key_preview: preview, reason: `plan_not_found:${planCode}` });
      continue;
    }
    if (seenInBatch.has(key)) {
      result.failures.push({ line, key_preview: preview, reason: "duplicate_in_input" });
      continue;
    }
    seenInBatch.add(key);

    const fingerprint = computeFingerprint(key);
    const { error: insertErr } = await supabase.from("api_key_inventory").insert({
      plan_id: planId,
      product_code: planCode,
      key_value: key,
      key_fingerprint: fingerprint,
      key_preview: preview,
      memo,
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
    before: {},
    after: { source: "csv", registered: result.registered, duplicates: result.duplicates, failures: result.failures.length },
    req,
    admin_email: guard.session.admin_email,
  });

  return NextResponse.json(result, { status: 201 });
}
