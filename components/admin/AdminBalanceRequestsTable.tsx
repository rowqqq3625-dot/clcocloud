import { AdminBalanceRequestActions } from "@/components/admin/AdminBalanceRequestActions";
import type { BalanceRequestRecord } from "@/lib/supabase-admin";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminBalanceRequestsTable({ requests }: { requests: BalanceRequestRecord[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-cream shadow-[0_24px_80px_rgba(31,30,29,.10)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead className="bg-cream-2 text-[11px] font-bold uppercase tracking-[0.14em] text-secondary">
            <tr>
              <th className="px-5 py-4">상태</th>
              <th className="px-5 py-4">이메일</th>
              <th className="px-5 py-4">요청</th>
              <th className="px-5 py-4">메시지</th>
              <th className="px-5 py-4">생성일</th>
              <th className="px-5 py-4">관리</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id} className="border-t border-[var(--border-subtle)]/70 align-top transition hover:bg-peach/25">
                <td className="px-5 py-4"><span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">{request.status}</span></td>
                <td className="px-5 py-4 text-sm font-semibold">{request.contact_email}</td>
                <td className="px-5 py-4 font-bold">{request.request_amount}</td>
                <td className="max-w-[360px] px-5 py-4 text-sm leading-6 text-secondary">{request.message}</td>
                <td className="px-5 py-4 text-sm text-secondary">{formatDate(request.created_at)}</td>
                <td className="px-5 py-4"><AdminBalanceRequestActions request={request} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {requests.length === 0 ? <p className="px-5 py-10 text-center text-sm text-secondary">아직 잔액충전 문의가 없습니다.</p> : null}
    </div>
  );
}
