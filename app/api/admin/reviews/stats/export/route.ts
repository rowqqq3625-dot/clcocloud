import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const HEADER = [
  "id",
  "created_at",
  "approved_at",
  "status",
  "rating",
  "plan_code",
  "title",
  "body",
  "display_name",
  "masked_name",
  "user_provider",
  "user_provider_account_id",
  "reward_granted",
  "reward_amount_usd",
  "reward_granted_at",
  "helpful_count",
  "featured",
  "featured_order",
  "approved_by",
  "rejected_reason",
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = typeof value === "string" ? value : String(value);
  // Strip newlines from the body to keep one row per record on import.
  s = s.replace(/\r?\n/g, " ").replace(/"/g, '""');
  if (/[,"\s]/.test(s)) return `"${s}"`;
  return s;
}

// ---------------------------------------------------------------------------
// GET /api/admin/reviews/stats/export
// Streams a CSV of every review matching the (optional) filters. The
// admin stats dashboard offers Excel/Numbers-compatible export — we
// prepend a UTF-8 BOM so Korean text renders correctly in Excel.
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return new NextResponse("supabase_not_configured", { status: 503 });
  }

  const sp = request.nextUrl.searchParams;
  const status = sp.get("status");
  const fromDate = sp.get("fromDate");
  const toDate = sp.get("toDate");

  let query = supabase.from("reviews").select(HEADER.join(","));
  if (status && status !== "all") query = query.eq("status", status);
  if (fromDate) query = query.gte("created_at", fromDate);
  if (toDate) query = query.lte("created_at", toDate);
  query = query.order("created_at", { ascending: false }).limit(10_000);

  const { data, error } = await query;
  if (error) return new NextResponse("query_failed", { status: 500 });

  const rows = (data as unknown as Array<Record<string, unknown>>) || [];
  const csvLines = [HEADER.join(",")];
  for (const row of rows) {
    csvLines.push(HEADER.map((col) => csvCell(row[col])).join(","));
  }
  const body = "﻿" + csvLines.join("\n");

  const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reviews_${yyyymmdd}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
