"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ManualIssueModal } from "@/components/admin/vending/ManualIssueModal";

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

type Props = {
  orders: PendingOrder[];
  availableMap: Record<string, number>;
  csrfToken: string;
};

export function MatchTable({ orders, availableMap, csrfToken }: Props) {
  const router = useRouter();
  const [target, setTarget] = useState<PendingOrder | null>(null);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
            <tr>
              <th className="w-[18%] px-3 py-2 font-mono">주문번호</th>
              <th className="w-[12%] px-3 py-2 font-mono">플랜</th>
              <th className="w-[10%] px-3 py-2 font-mono">가용</th>
              <th className="w-[14%] px-3 py-2 font-mono">구매자</th>
              <th className="w-[14%] px-3 py-2 font-mono">연락처</th>
              <th className="w-[10%] px-3 py-2 font-mono text-right">금액</th>
              <th className="w-[12%] px-3 py-2 font-mono">결제시각</th>
              <th className="w-[10%] px-3 py-2 font-mono text-right">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/5 text-cream/85">
            {orders.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-10 text-center text-cream/40">대기 중 주문 없음.</td></tr>
            ) : (
              orders.map((o) => {
                const avail = availableMap[o.product_code] ?? 0;
                const lowOrEmpty = avail === 0;
                return (
                  <tr key={o.id}>
                    <td className="px-3 py-2 font-mono text-[11px]">{o.order_no}</td>
                    <td className="px-3 py-2 font-mono text-[10px]">{o.product_code}</td>
                    <td className={`px-3 py-2 font-mono ${lowOrEmpty ? "text-[#D97757]" : "text-emerald-300"}`}>{avail}</td>
                    <td className="px-3 py-2">{o.buyer_name}</td>
                    <td className="px-3 py-2 font-mono text-[11px] text-cream/70">{o.buyer_phone}</td>
                    <td className="px-3 py-2 font-mono tabular-nums text-right">{Number(o.amount).toLocaleString()}원</td>
                    <td className="px-3 py-2 font-mono text-[10px] text-cream/70">{fmt(o.paid_at)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => setTarget(o)}
                        disabled={lowOrEmpty}
                        className="rounded-full bg-[#D97757] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-cream hover:bg-[#c5694b] disabled:opacity-30"
                      >
                        매칭
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {target ? (
        <ManualIssueModal
          open
          orderNo={target.order_no}
          orderPlanCode={target.product_code}
          csrfToken={csrfToken}
          onClose={() => setTarget(null)}
          onSuccess={() => {
            setTarget(null);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return "—";
  }
}
