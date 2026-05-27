import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/cron/vending-release
//
// reserved 상태로 15분 이상 머무는 키를 available 로 복구한다.
// Vercel Cron, Supabase pg_cron, 외부 스케줄러 등 어디서 호출해도 동일하게 동작.
//
// 인증: Authorization: Bearer ${ADMIN_TOKEN}
//   . ADMIN_TOKEN 미설정 시 503 (운영자가 토큰을 발급해야 함)
//   . 잘못된 토큰 401
//
// 쿼리: ?minutes=N — 기본 15분, 1~1440분 허용
export async function GET(req: NextRequest) {
  const token = process.env.ADMIN_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "ADMIN_TOKEN not configured" }, { status: 503 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const raw = req.nextUrl.searchParams.get("minutes");
  let minutes = raw ? Number.parseInt(raw, 10) : 15;
  if (!Number.isFinite(minutes) || minutes < 1) minutes = 15;
  if (minutes > 1440) minutes = 1440;

  if (!supabaseAdmin) {
    return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });
  }

  const { data, error } = await supabaseAdmin.rpc("release_reserved_keys", {
    p_older_than_minutes: minutes,
  });

  if (error) {
    console.error("[vending] release_reserved_keys failed:", error);
    return NextResponse.json({ error: "release_failed", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, released: Number(data ?? 0), minutes });
}
