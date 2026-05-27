"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { KeyRowSafe, Plan, VendingKeyStatus } from "@/lib/vending/types";
import { KeyTable } from "@/components/admin/vending/KeyTable";
import { KeyRegisterModal } from "@/components/admin/vending/KeyRegisterModal";
import { RevokeConfirmDialog } from "@/components/admin/vending/RevokeConfirmDialog";
import { ReissueConfirmDialog } from "@/components/admin/vending/ReissueConfirmDialog";

type Filters = {
  status?: string;
  plan_code?: string;
  search?: string;
};

type Props = {
  rows: KeyRowSafe[];
  total: number;
  page: number;
  pageSize: number;
  baseHref: string;
  plans: Plan[];
  csrfToken: string;
  currentFilters: Filters;
};

const STATUS_OPTS: Array<{ value: string; label: string }> = [
  { value: "", label: "전체 상태" },
  { value: "available", label: "가용" },
  { value: "reserved", label: "예약" },
  { value: "issued", label: "발급" },
  { value: "revoked", label: "폐기" },
  { value: "expired", label: "만료" },
];

export function KeysPageClient({ rows, total, page, pageSize, baseHref, plans, csrfToken, currentFilters }: Props) {
  const router = useRouter();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<KeyRowSafe | null>(null);
  const [reissueTarget, setReissueTarget] = useState<KeyRowSafe | null>(null);

  const [status, setStatus] = useState(currentFilters.status || "");
  const [planCode, setPlanCode] = useState(currentFilters.plan_code || "");
  const [search, setSearch] = useState(currentFilters.search || "");

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (planCode) params.set("plan_code", planCode);
    if (search) params.set("search", search);
    router.push(`/admin-panel/vending/keys${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const reset = () => {
    setStatus("");
    setPlanCode("");
    setSearch("");
    router.push("/admin-panel/vending/keys");
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-cream/10 bg-[#1F1E1D]/70 px-4 py-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-cream/15 bg-black/40 px-3 py-1.5 text-xs outline-none focus:border-[#D97757]"
        >
          {STATUS_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={planCode}
          onChange={(e) => setPlanCode(e.target.value)}
          className="rounded-xl border border-cream/15 bg-black/40 px-3 py-1.5 text-xs outline-none focus:border-[#D97757]"
        >
          <option value="">전체 플랜</option>
          {plans.map((p) => (
            <option key={p.id} value={p.code}>{p.code}</option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          placeholder="주문번호 / 메모 / 키 프리뷰"
          className="flex-1 rounded-xl border border-cream/15 bg-black/40 px-3 py-1.5 text-xs outline-none focus:border-[#D97757]"
        />
        <button onClick={applyFilters} className="rounded-full bg-[#D97757] px-4 py-1.5 text-xs font-bold text-cream hover:bg-[#c5694b]">필터</button>
        <button onClick={reset} className="rounded-full border border-cream/15 px-4 py-1.5 text-xs font-bold text-cream/80 hover:border-cream/40">초기화</button>
        <button onClick={() => setRegisterOpen(true)} className="rounded-full bg-[#D97757]/20 px-4 py-1.5 text-xs font-bold text-[#F0E2D2] hover:bg-[#D97757]/30">+ 키 등록</button>
      </div>

      <KeyTable
        rows={rows}
        total={total}
        page={page}
        pageSize={pageSize}
        baseHref={baseHref}
        onRowAction={(row, action) => {
          if (action === "revoke") setRevokeTarget(row);
          else if (action === "reissue") setReissueTarget(row);
        }}
      />

      <KeyRegisterModal
        open={registerOpen}
        plans={plans}
        csrfToken={csrfToken}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => router.refresh()}
      />

      {revokeTarget ? (
        <RevokeConfirmDialog
          open
          keyId={revokeTarget.id}
          keyPreview={revokeTarget.key_preview}
          csrfToken={csrfToken}
          onClose={() => setRevokeTarget(null)}
          onSuccess={() => {
            setRevokeTarget(null);
            router.refresh();
          }}
        />
      ) : null}

      {reissueTarget ? (
        <ReissueConfirmDialog
          open
          keyId={reissueTarget.id}
          keyPreview={reissueTarget.key_preview}
          orderNo={reissueTarget.issued_order_no}
          csrfToken={csrfToken}
          onClose={() => setReissueTarget(null)}
          onSuccess={() => {
            setReissueTarget(null);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

// referenced for type-check parity even though not directly used here
export type _StatusUnused = VendingKeyStatus;
