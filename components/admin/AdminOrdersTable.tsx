import type { OrderRecord } from "@/lib/supabase-admin";

function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminOrdersTable({ orders }: { orders: OrderRecord[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-cream shadow-[0_24px_80px_rgba(31,30,29,.10)]">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full border-collapse text-left">
          <thead className="bg-cream-2 text-[11px] font-bold uppercase tracking-[0.14em] text-secondary">
            <tr>
              <th className="px-5 py-4">상태</th>
              <th className="px-5 py-4">플랜</th>
              <th className="px-5 py-4">가격</th>
              <th className="px-5 py-4">구매자</th>
              <th className="px-5 py-4">연락 이메일</th>
              <th className="px-5 py-4">OS</th>
              <th className="px-5 py-4">생성일</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-[var(--border-subtle)]/70 transition hover:bg-peach/25">
                <td className="px-5 py-4"><span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold uppercase text-coral">{order.status}</span></td>
                <td className="px-5 py-4 font-bold">{order.plan_name} · ${order.balance_usd}</td>
                <td className="px-5 py-4 font-mono font-semibold">₩{formatKrw(order.price_krw)}</td>
                <td className="px-5 py-4 text-sm text-secondary">{order.user_email || order.user_provider_account_id}</td>
                <td className="px-5 py-4 text-sm font-semibold">{order.contact_email}</td>
                <td className="px-5 py-4 text-sm">{order.os_targets.join(", ")}</td>
                <td className="px-5 py-4 text-sm text-secondary">{formatDate(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 ? <p className="px-5 py-10 text-center text-sm text-secondary">아직 pending 주문이 없습니다.</p> : null}
    </div>
  );
}
