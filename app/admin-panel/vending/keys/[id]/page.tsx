import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ADMIN_CSRF_COOKIE } from "@/lib/admin/config";
import { issueCsrfTokenOnCookieJar } from "@/lib/admin/csrf";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { KeyRowSafe } from "@/lib/vending/types";
import { KeyDetailActions } from "./KeyDetailActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_COLUMNS =
  "id,plan_id,product_code,key_fingerprint,key_preview,status,memo,created_by,reserved_at,reserved_order_id,issued_at,issued_order_no,issued_order_id,revoked_at,revoked_reason,created_at,updated_at";

export default async function KeyDetailPage({ params }: { params: { id: string } }) {
  const cookieJar = cookies();
  const csrfToken = cookieJar.get(ADMIN_CSRF_COOKIE)?.value || issueCsrfTokenOnCookieJar(cookieJar);

  const supabase = getSupabaseAdminClient();
  if (!supabase) return <p className="text-xs text-cream/60">Supabase 환경변수 미설정</p>;

  const { data: row } = await supabase
    .from("api_key_inventory")
    .select(SAFE_COLUMNS)
    .eq("id", params.id)
    .maybeSingle();

  if (!row) notFound();
  const key = row as KeyRowSafe;

  const { data: issuance } = await supabase
    .from("issued_api_keys")
    .select("id,order_no,issued_at")
    .eq("key_id", params.id)
    .order("issued_at", { ascending: false });

  const { data: order } = key.issued_order_no
    ? await supabase
        .from("orders")
        .select("order_no,buyer_name,buyer_phone,amount,status,paid_at,product_code")
        .eq("order_no", key.issued_order_no)
        .maybeSingle()
    : { data: null };

  return (
    <div className="grid gap-5">
      <header className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cream/40">VENDING / KEY DETAIL</p>
          <h1 className="mt-1 font-mono text-lg font-bold">{key.key_preview || key.id}</h1>
          <p className="mt-1 text-[11px] text-cream/50">
            {key.product_code} · 상태 <span className="text-[#F0E2D2]">{key.status}</span>
          </p>
        </div>
        <Link href="/admin-panel/vending/keys" className="rounded-full border border-cream/15 px-3 py-1.5 text-xs font-bold text-cream/80 hover:border-cream/40">목록</Link>
      </header>

      <section className="grid gap-3 rounded-2xl border border-cream/10 bg-[#1F1E1D]/70 p-5 text-sm">
        <Row label="ID" value={<span className="font-mono text-[11px]">{key.id}</span>} />
        <Row label="Fingerprint (SHA-256)" value={<span className="font-mono text-[11px] text-cream/70">{key.key_fingerprint || "—"}</span>} />
        <Row label="등록일" value={fmt(key.created_at)} />
        <Row label="갱신일" value={fmt(key.updated_at)} />
        <Row label="예약일 / 주문" value={`${fmt(key.reserved_at)}${key.reserved_order_id ? ` · ${key.reserved_order_id.slice(0, 8)}…` : ""}`} />
        <Row label="발급일 / 주문번호" value={`${fmt(key.issued_at)}${key.issued_order_no ? ` · ${key.issued_order_no}` : ""}`} />
        <Row label="폐기일 / 사유" value={`${fmt(key.revoked_at)}${key.revoked_reason ? ` · ${key.revoked_reason}` : ""}`} />
        <Row label="메모" value={key.memo || "—"} />
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-bold text-cream/80">관련 주문</h2>
        {order ? (
          <div className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/70 p-5 text-sm grid gap-2">
            <Row label="주문번호" value={<span className="font-mono">{order.order_no}</span>} />
            <Row label="구매자" value={`${order.buyer_name} · ${order.buyer_phone}`} />
            <Row label="금액 / 결제" value={`${Number(order.amount).toLocaleString()}원 · ${order.status} · ${fmt(order.paid_at)}`} />
          </div>
        ) : (
          <p className="text-xs text-cream/40">연결된 주문 없음.</p>
        )}
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-bold text-cream/80">발급 이력</h2>
        <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
          {!issuance || issuance.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-cream/40">이력 없음.</p>
          ) : (
            <ul className="divide-y divide-cream/5 text-xs">
              {issuance.map((i: any) => (
                <li key={i.id} className="flex items-center justify-between px-4 py-2 text-cream/80">
                  <span className="font-mono">{i.order_no}</span>
                  <span className="font-mono text-[10px] text-cream/50">{fmt(i.issued_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <KeyDetailActions keyId={key.id} keyPreview={key.key_preview} status={key.status} issuedOrderNo={key.issued_order_no} csrfToken={csrfToken} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="font-mono uppercase tracking-[0.16em] text-cream/40">{label}</span>
      <span className="text-cream/85">{value}</span>
    </div>
  );
}

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "—";
  }
}
