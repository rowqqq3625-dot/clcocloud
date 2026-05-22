import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionFromCookies, isAdminSession } from "@/lib/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function verifyAdmin() {
  const session = getSessionFromCookies(cookies());
  return isAdminSession(session);
}

// GET: 잔액충전 문의 전체 조회
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
      .from("topup_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inquiries: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: 문의 상태 변경 (open | contacted | completed | closed)
export async function PUT(req: Request) {
  if (!verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "ID와 변경할 상태값(status)이 누락되었습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client config error" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("topup_inquiries")
      .update({ status })
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
