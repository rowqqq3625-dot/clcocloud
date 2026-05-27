import { cookies } from "next/headers";
import { ADMIN_CSRF_COOKIE } from "@/lib/admin/config";
import { issueCsrfTokenOnCookieJar } from "@/lib/admin/csrf";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { Plan } from "@/lib/vending/types";
import { PlansClient } from "./PlansClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PlansPage() {
  const cookieJar = cookies();
  const csrfToken = cookieJar.get(ADMIN_CSRF_COOKIE)?.value || issueCsrfTokenOnCookieJar(cookieJar);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return <p className="text-xs text-cream/60">Supabase 환경변수 미설정</p>;

  const { data } = await supabase
    .from("plans")
    .select("id,code,name_ko,price_krw,active,created_at,updated_at")
    .order("price_krw");

  return (
    <div className="grid gap-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">VENDING / PLANS</p>
        <h1 className="mt-1 text-xl font-bold">플랜 마스터</h1>
        <p className="mt-1 text-[11px] text-cream/50">자판기에 등록 가능한 플랜 코드. 비활성 시 새 결제·발급이 차단됩니다.</p>
      </header>
      <PlansClient plans={(data || []) as Plan[]} csrfToken={csrfToken} />
    </div>
  );
}
