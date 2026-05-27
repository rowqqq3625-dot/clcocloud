import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { LogListQuerySchema } from "@/lib/vending/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/vending/logs — 활동 로그 페이지/필터
export async function GET(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = LogListQuerySchema.safeParse(Object.fromEntries(req.nextUrl.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query", details: parsed.error.flatten() }, { status: 400 });
  }
  const q = parsed.data;

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  let query = supabase
    .from("vending_action_logs")
    .select("id,actor_admin_id,action,target_key_id,target_order_no,plan_code,before_state,after_state,created_at", {
      count: "exact",
    });

  if (q.action) query = query.eq("action", q.action);
  if (q.actor) query = query.eq("actor_admin_id", q.actor);
  if (q.order_no) query = query.eq("target_order_no", q.order_no);
  if (q.from) query = query.gte("created_at", q.from);
  if (q.to) query = query.lte("created_at", q.to);

  query = query.order("created_at", { ascending: false });
  const from = (q.page - 1) * q.pageSize;
  const to = from + q.pageSize - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });

  return NextResponse.json({
    rows: data || [],
    total: count ?? 0,
    page: q.page,
    pageSize: q.pageSize,
  });
}
