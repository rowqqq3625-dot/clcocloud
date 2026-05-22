import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      // Supabase 설정이 없는 경우 빈 배열 반환 (UI에서 준비 중 표시)
      return NextResponse.json({ success: true, data: [] });
    }

    const { data, error } = await supabase
      .from("bundle_products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Failed to fetch bundle products:", error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (error: any) {
    console.error("Error in GET /api/bundle-products:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
