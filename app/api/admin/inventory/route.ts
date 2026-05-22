import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionFromCookies, isAdminSession } from "@/lib/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { getFingerprint } from "@/lib/fingerprint";
import { encryptKey } from "@/lib/keyEncryption";

export const dynamic = "force-dynamic";

// 어드민 세션 검증 헬퍼
function verifyAdmin() {
  const session = getSessionFromCookies(cookies());
  return isAdminSession(session);
}

// GET: 인벤토리 목록 및 상품별 재고 통계
export async function GET() {
  if (!verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client config error" }, { status: 500 });
    }

    // 1. 전체 인벤토리 목록 가져오기 (보안상 raw_key_encrypted는 제외하고, fp16/last4/상태 정보만 가져옴)
    const { data: inventory, error: invError } = await supabase
      .from("api_key_inventory")
      .select("id, fp16, last4, product_code, status, reserved_at, issued_at, created_at")
      .order("created_at", { ascending: false });

    if (invError) {
      return NextResponse.json({ error: invError.message }, { status: 500 });
    }

    // 2. 최근 24시간 동안 발급된 키 개수 구하기
    const past24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentIssued, error: recentError } = await supabase
      .from("api_key_inventory")
      .select("product_code")
      .eq("status", "issued")
      .gte("issued_at", past24h);

    if (recentError) {
      return NextResponse.json({ error: recentError.message }, { status: 500 });
    }

    // 3. 상품별 통계 집계
    // 상품코드별: available, reserved, issued, recent24h
    const stats: Record<string, { available: number; reserved: number; issued: number; recent24h: number }> = {};
    
    // 기본 키값 초기화
    const plans = ["STANDARD", "PRO", "ULTRA"];
    plans.forEach(plan => {
      stats[plan] = { available: 0, reserved: 0, issued: 0, recent24h: 0 };
    });

    inventory?.forEach((item) => {
      const code = item.product_code;
      if (!stats[code]) {
        stats[code] = { available: 0, reserved: 0, issued: 0, recent24h: 0 };
      }
      if (item.status === "available") stats[code].available++;
      else if (item.status === "reserved") stats[code].reserved++;
      else if (item.status === "issued") stats[code].issued++;
    });

    recentIssued?.forEach((item) => {
      const code = item.product_code;
      if (stats[code]) {
        stats[code].recent24h++;
      }
    });

    return NextResponse.json({ success: true, inventory, stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: API 키 인벤토리 등록
export async function POST(req: Request) {
  if (!verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { keys, productCode, initialBalance } = await req.json();

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json({ error: "등록할 API 키를 제공해주세요." }, { status: 400 });
    }

    if (!productCode || !initialBalance) {
      return NextResponse.json({ error: "상품 코드와 초기 잔액이 누락되었습니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client config error" }, { status: 500 });
    }

    const insertRows = [];
    const duplicates = [];

    // 각 키에 대해 fingerprint와 암호화 적용
    for (const rawKey of keys) {
      const trimmed = rawKey.trim();
      if (!trimmed) continue;

      const { fp_full, fp16, last4 } = getFingerprint(trimmed);
      
      // 혹시 중복된 키가 DB에 이미 있는지 사전 검사
      const { data: existing } = await supabase
        .from("api_key_inventory")
        .select("id")
        .eq("fp_full", fp_full)
        .maybeSingle();

      if (existing) {
        duplicates.push(`${fp16}...${last4}`);
        continue;
      }

      // AES-256-GCM 암호화
      const encrypted = encryptKey(trimmed);

      insertRows.push({
        fp_full,
        fp16,
        last4,
        raw_key_encrypted: encrypted,
        initial_balance: initialBalance,
        product_code: productCode,
        status: "available",
      });
    }

    if (insertRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "등록할 수 있는 신규 키가 없습니다. (전부 중복이거나 빈 입력값)",
        duplicates,
      }, { status: 400 });
    }

    const { error: insertError } = await supabase
      .from("api_key_inventory")
      .insert(insertRows);

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      insertedCount: insertRows.length,
      duplicates,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: 인벤토리 키 삭제
export async function DELETE(req: Request) {
  if (!verifyAdmin()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "삭제할 키 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client config error" }, { status: 500 });
    }

    // available 상태인 키만 삭제 허용
    const { data: keyCheck } = await supabase
      .from("api_key_inventory")
      .select("status")
      .eq("id", id)
      .single();

    if (!keyCheck) {
      return NextResponse.json({ error: "해당 키를 찾을 수 없습니다." }, { status: 404 });
    }

    if (keyCheck.status !== "available") {
      return NextResponse.json({ error: "사용 가능(available) 상태인 키만 삭제할 수 있습니다." }, { status: 400 });
    }

    const { error } = await supabase
      .from("api_key_inventory")
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
