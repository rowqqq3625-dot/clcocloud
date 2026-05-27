import { cookies } from "next/headers";
import { ADMIN_CSRF_COOKIE } from "@/lib/admin/config";
import { issueCsrfTokenOnCookieJar } from "@/lib/admin/csrf";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { MatchTable } from "./MatchTable";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PendingOrder = {
  id: string;
  order_no: string;
  product_code: string;
  buyer_name: string;
  buyer_phone: string;
  amount: number;
  paid_at: string | null;
  created_at: string;
};

export default async function MatchPage() {
  const cookieJar = cookies();
  const csrfToken = cookieJar.get(ADMIN_CSRF_COOKIE)?.value || issueCsrfTokenOnCookieJar(cookieJar);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return <p className="text-xs text-cream/60">Supabase 환경변수 미설정</p>;

  const { data } = await supabase
    .from("orders")
    .select("id,order_no,product_code,buyer_name,buyer_phone,amount,paid_at,created_at")
    .eq("status", "paid_pending_key")
    .order("paid_at", { ascending: false })
    .limit(100);

  const orders = (data || []) as PendingOrder[];

  // 플랜별 가용 카운트 (매칭 가능 여부 표시용)
  const { data: stockData } = await supabase
    .from("plan_stock_view")
    .select("plan_code,available_count");
  const availableMap = new Map<string, number>();
  for (const s of stockData || []) availableMap.set(s.plan_code as string, Number(s.available_count ?? 0));

  return (
    <div className="grid gap-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">VENDING / MATCH</p>
        <h1 className="mt-1 text-xl font-bold">주문 수동 매칭</h1>
        <p className="mt-1 text-[11px] text-cream/50">
          결제는 완료됐지만 키 발급이 실패한 주문 (status = paid_pending_key) 목록. 키를 강제 매칭하면 구매자에게 알림톡이 발송됩니다.
        </p>
      </header>

      <MatchTable orders={orders} availableMap={Object.fromEntries(availableMap)} csrfToken={csrfToken} />
    </div>
  );
}
