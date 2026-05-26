import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderNo = searchParams.get("orderNo");

    if (!orderNo) {
      return NextResponse.json({ error: "주문 번호가 누락되었습니다." }, { status: 400 });
    }

    if (!supabase) {
      return NextResponse.json({ error: "데이터베이스 연결에 실패했습니다." }, { status: 500 });
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("order_no, product_code, amount, buyer_name, buyer_phone")
      .eq("order_no", orderNo)
      .maybeSingle();

    if (error || !order) {
      console.error(`[Order Info API] Query error or order not found: ${error?.message}`);
      return NextResponse.json({ error: "주문을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error("[Order Info API] Exception:", err);
    return NextResponse.json({ error: "서버 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
