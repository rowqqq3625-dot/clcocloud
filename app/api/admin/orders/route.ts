import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");
    const all = searchParams.get("all") === "true";

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
    }

    if (orderId) {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }

      const { data: issuedKeys } = await supabase
        .from("issued_api_keys")
        .select("id, fp16, last4, initial_balance, issued_at")
        .eq("order_id", orderId);

      const { data: alimtalkLogs } = await supabase
        .from("alimtalk_logs")
        .select("*")
        .eq("order_id", orderId)
        .order("sent_at", { ascending: false });

      return NextResponse.json({
        success: true,
        order,
        issuedKeys: issuedKeys || [],
        alimtalkLogs: alimtalkLogs || [],
      });
    }

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (!all) {
      query = query.limit(150);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders });
  } catch {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
