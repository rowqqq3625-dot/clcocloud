import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionFromCookies, isAdminSession } from "@/lib/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function verifyAdmin() {
  const session = getSessionFromCookies(cookies());
  return isAdminSession(session);
}

// GET: 어드민용 번들 리스트
export async function GET() {
  if (!verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client config error" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("bundle_products")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: 번들 상품 생성
export async function POST(req: Request) {
  if (!verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      product_code,
      display_name,
      ai_partner,
      description,
      period_months,
      included_balance,
      price_krw,
      original_price_krw,
      is_featured,
      is_active,
      sort_order,
    } = body;

    if (!product_code || !display_name || !ai_partner) {
      return NextResponse.json({ error: "필수 입력값이 누락되었습니다. (상품코드, 표시명, AI파트너)" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client config error" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("bundle_products")
      .insert({
        product_code: product_code.toUpperCase(),
        display_name,
        ai_partner,
        description,
        period_months: period_months !== "" ? Number(period_months) : null,
        included_balance: included_balance !== "" ? Number(included_balance) : null,
        price_krw: price_krw !== "" ? Number(price_krw) : null,
        original_price_krw: original_price_krw !== "" ? Number(original_price_krw) : null,
        is_featured: !!is_featured,
        is_active: is_active !== undefined ? !!is_active : true,
        sort_order: sort_order !== undefined ? Number(sort_order) : 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: 번들 상품 수정
export async function PUT(req: Request) {
  if (!verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id,
      product_code,
      display_name,
      ai_partner,
      description,
      period_months,
      included_balance,
      price_krw,
      original_price_krw,
      is_featured,
      is_active,
      sort_order,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "수정할 번들 상품 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client config error" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("bundle_products")
      .update({
        product_code: product_code ? product_code.toUpperCase() : undefined,
        display_name,
        ai_partner,
        description,
        period_months: period_months === "" || period_months === null ? null : Number(period_months),
        included_balance: included_balance === "" || included_balance === null ? null : Number(included_balance),
        price_krw: price_krw === "" || price_krw === null ? null : Number(price_krw),
        original_price_krw: original_price_krw === "" || original_price_krw === null ? null : Number(original_price_krw),
        is_featured: is_featured !== undefined ? !!is_featured : undefined,
        is_active: is_active !== undefined ? !!is_active : undefined,
        sort_order: sort_order !== undefined ? Number(sort_order) : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: 번들 상품 삭제
export async function DELETE(req: Request) {
  if (!verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "삭제할 번들 상품 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client config error" }, { status: 500 });
    }

    const { error } = await supabase
      .from("bundle_products")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
