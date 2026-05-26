"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";

type Props = {
  orderId: string;
  orderNo: string;
  currentStatus: string;
  /** Called after a successful transition so the parent modal can refresh. */
  onDone?: () => void;
};

type ActionDef = {
  next: "cancelled" | "refunded";
  label: string;
  confirmPhrase: string;
  confirmTitle: string;
  confirmMessage: (orderNo: string) => string;
};

// Mirrors the server's ALLOWED_TRANSITIONS so the UI never offers an action
// the API will reject. The server is still the source of truth — clicking
// anything that's not in this map would silently 409.
const TRANSITIONS: Record<string, ActionDef[]> = {
  pending: [
    {
      next: "cancelled",
      label: "결제대기 취소",
      confirmPhrase: "CANCEL",
      confirmTitle: "주문 취소",
      confirmMessage: (no) => `주문 ${no}을 취소 상태로 변경합니다. 결제는 아직 발생하지 않은 상태입니다.`,
    },
  ],
  paid: [
    {
      next: "refunded",
      label: "환불 처리(부기)",
      confirmPhrase: "MARK_REFUNDED",
      confirmTitle: "환불 부기 처리",
      confirmMessage: (no) =>
        `주문 ${no}을 환불 상태로 기록합니다. ⚠ 이 액션은 PG 환불을 실행하지 않습니다 — PayApp에서 별도로 환불을 실행한 뒤 부기 기록용으로만 사용하세요.`,
    },
  ],
  paid_pending_key: [
    {
      next: "cancelled",
      label: "취소",
      confirmPhrase: "CANCEL",
      confirmTitle: "키 발급 대기 주문 취소",
      confirmMessage: (no) =>
        `주문 ${no}을 취소합니다. 결제가 발생했지만 키가 아직 발급되지 않은 상태입니다. PayApp 환불도 필요할 수 있습니다.`,
    },
    {
      next: "refunded",
      label: "환불 처리(부기)",
      confirmPhrase: "MARK_REFUNDED",
      confirmTitle: "환불 부기 처리",
      confirmMessage: (no) =>
        `주문 ${no}을 환불 상태로 기록합니다. PayApp에서 실제 환불을 실행한 뒤 사용하세요.`,
    },
  ],
  failed: [
    {
      next: "cancelled",
      label: "취소(정리)",
      confirmPhrase: "CANCEL",
      confirmTitle: "실패 주문 정리",
      confirmMessage: (no) => `실패 주문 ${no}을 취소 상태로 정리합니다.`,
    },
  ],
};

export function AdminOrderStatusActions({ orderId, orderNo, currentStatus, onDone }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<ActionDef | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actions = TRANSITIONS[currentStatus] || [];

  const handleConfirm = async (reason: string) => {
    if (!active) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status: active.next, reason }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "잠시 후 다시 시도해주세요.");
        return;
      }
      router.refresh();
      onDone?.();
    } catch {
      setError("네트워크 오류");
    } finally {
      setBusy(false);
    }
  };

  if (actions.length === 0) {
    return (
      <p className="text-[10px] text-cream/40">
        현재 상태({currentStatus})에서 변경 가능한 액션이 없습니다.
      </p>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => (
          <button
            key={action.next}
            type="button"
            onClick={() => setActive(action)}
            disabled={busy}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition disabled:opacity-50 ${
              action.next === "refunded"
                ? "border-[#D97757]/40 text-[#F0E2D2] hover:border-[#D97757]"
                : "border-amber-400/30 text-amber-300 hover:border-amber-300/60"
            }`}
          >
            {action.label}
          </button>
        ))}
        {error ? <span className="text-[10px] text-[#F0E2D2]">{error}</span> : null}
      </div>

      <AdminConfirmDialog
        open={active !== null}
        title={active?.confirmTitle || ""}
        message={active ? active.confirmMessage(orderNo) : ""}
        confirmPhrase={active?.confirmPhrase || ""}
        onConfirm={handleConfirm}
        onClose={() => setActive(null)}
      />
    </>
  );
}
