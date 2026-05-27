"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Plan } from "@/lib/vending/types";
import { PlanFormModal } from "@/components/admin/vending/PlanFormModal";

type Props = {
  plans: Plan[];
  csrfToken: string;
};

export function PlansClient({ plans, csrfToken }: Props) {
  const router = useRouter();
  const [editTarget, setEditTarget] = useState<Plan | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={() => setCreateOpen(true)}
          className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream hover:bg-[#c5694b]"
        >
          + 신규 플랜
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/70">
        <table className="w-full table-fixed text-left text-xs">
          <thead className="bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
            <tr>
              <th className="w-[15%] px-3 py-2 font-mono">코드</th>
              <th className="w-[35%] px-3 py-2 font-mono">한글명</th>
              <th className="w-[15%] px-3 py-2 font-mono text-right">가격</th>
              <th className="w-[10%] px-3 py-2 font-mono">활성</th>
              <th className="w-[15%] px-3 py-2 font-mono">갱신일</th>
              <th className="w-[10%] px-3 py-2 font-mono text-right">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/5 text-cream/85">
            {plans.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-10 text-center text-cream/40">플랜 없음.</td></tr>
            ) : (
              plans.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 font-mono">{p.code}</td>
                  <td className="px-3 py-2">{p.name_ko}</td>
                  <td className="px-3 py-2 font-mono tabular-nums text-right">{Number(p.price_krw).toLocaleString()}원</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${p.active ? "bg-emerald-500/15 text-emerald-300" : "bg-cream/10 text-cream/50"}`}>
                      {p.active ? "active" : "inactive"}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-cream/60">{fmt(p.updated_at)}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => setEditTarget(p)}
                      className="rounded-full border border-cream/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-cream/70 hover:border-cream/40"
                    >
                      수정
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PlanFormModal
        open={createOpen}
        plan={null}
        csrfToken={csrfToken}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => router.refresh()}
      />
      <PlanFormModal
        open={!!editTarget}
        plan={editTarget}
        csrfToken={csrfToken}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          router.refresh();
        }}
      />
    </>
  );
}

function fmt(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  } catch {
    return iso;
  }
}
