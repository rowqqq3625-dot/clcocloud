import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionFromCookies, isAdminSession } from "@/lib/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function verifyAdmin() {
  const session = getSessionFromCookies(cookies());
  return isAdminSession(session);
}

export async function GET(req: Request) {
  if (!verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const status = searchParams.get("status");
    const all = searchParams.get("all") === "true";

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client config error" }, { status: 500 });
    }

    // 1. 특정 주문 상세 조회인 경우
    if (orderId) {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError) {
        return NextResponse.json({ error: orderError.message }, { status: 404 });
      }

      // 발급된 키 조회
      const { data: issuedKeys, error: keyError } = await supabase
        .from("issued_api_keys")
        .select("id, fp16, last4, initial_balance, issued_at")
        .eq("order_id", orderId);

      // 알림톡 발송 로그 조회
      const { data: alimtalkLogs, error: logError } = await supabase
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

    // 2. 전체 주문 목록 조회인 경우
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (!all) {
      // 일반 조회의 경우 페이지네이션 또는 150개 제한
      query = query.limit(150);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      return NextResponse.json({ error: ordersError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
