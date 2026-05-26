"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";

type BalanceRequestStatus = "pending" | "answered" | "fulfilled" | "rejected";

type Props = {
  id: string;
  currentStatus: BalanceRequestStatus;
  existingNote?: string | null;
};

type ActionConfig = {
  next: BalanceRequestStatus;
  label: string;
  variant: "neutral" | "primary" | "danger";
  needsConfirm: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmPhrase?: string;
};

// answered/pending are soft triage states; fulfilled/rejected are terminal
// outcomes that touch user balance or trust and therefore require the
// confirm-phrase + reason dialog. The `adminNote` field on the existing API
// doubles as the audit reason.
const TRANSITIONS: Record<BalanceRequestStatus, ActionConfig[]> = {
  pending: [
    { next: "answered", label: "답변완료", variant: "neutral", needsConfirm: false },
    {
      next: "fulfilled",
      label: "지급완료",
      variant: "primary",
      needsConfirm: true,
      confirmTitle: "잔액 지급 완료 처리",
      confirmMessage:
        "이 요청에 대한 잔액 지급이 실제로 완료되었음을 기록합니다. 입력한 사유는 admin_note에 저장되고 감사 로그에 남습니다.",
      confirmPhrase: "FULFILL",
    },
    {
      next: "rejected",
      label: "거절",
      variant: "danger",
      needsConfirm: true,
      confirmTitle: "잔액 요청 거절",
      confirmMessage: "이 요청을 거절합니다. 사유는 고객 응대에도 사용될 수 있도록 기록됩니다.",
      confirmPhrase: "REJECT",
    },
  ],
  answered: [
    {
      next: "fulfilled",
      label: "지급완료",
      variant: "primary",
      needsConfirm: true,
      confirmTitle: "잔액 지급 완료 처리",
      confirmMessage:
        "이 요청에 대한 잔액 지급이 실제로 완료되었음을 기록합니다. 입력한 사유는 admin_note에 저장되고 감사 로그에 남습니다.",
      confirmPhrase: "FULFILL",
    },
    {
      next: "rejected",
      label: "거절",
      variant: "danger",
      needsConfirm: true,
      confirmTitle: "잔액 요청 거절",
      confirmMessage: "이 요청을 거절합니다. 사유는 고객 응대에도 사용될 수 있도록 기록됩니다.",
      confirmPhrase: "REJECT",
    },
  ],
  fulfilled: [
    { next: "pending", label: "재오픈", variant: "neutral", needsConfirm: false },
  ],
  rejected: [
    { next: "pending", label: "재오픈", variant: "neutral", needsConfirm: false },
  ],
};

const VARIANT_STYLE: Record<ActionConfig["variant"], string> = {
  neutral: "border-cream/15 text-cream/70 hover:border-cream/40 hover:text-cream",
  primary: "border-emerald-400/30 text-emerald-300 hover:border-emerald-300/60",
  danger: "border-[#D97757]/40 text-[#F0E2D2] hover:border-[#D97757]",
};

export function BalanceRequestStatusActions({ id, currentStatus, existingNote }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ActionConfig | null>(null);

  const submit = async (next: BalanceRequestStatus, adminNote?: string) => {
    setBusy(next);
    setError(null);
    try {
      // For soft transitions we preserve any existing admin_note rather than
      // wiping it; for terminal transitions we pass the freshly-typed reason.
      const note = adminNote ?? existingNote ?? undefined;
      const response = await fetch(`/api/admin/balance-requests/${id}`, {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status: next, adminNote: note }),
      });
      if (!response.ok) {
        setError(response.status === 401 ? "권한이 만료되었습니다." : "잠시 후 다시 시도해주세요.");
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 오류");
    } finally {
      setBusy(null);
    }
  };

  const handleClick = (action: ActionConfig) => {
    if (action.needsConfirm) {
      setDialog(action);
      return;
    }
    void submit(action.next);
  };

  const transitions = TRANSITIONS[currentStatus] || [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {transitions.map((action) => (
          <button
            key={action.next}
            type="button"
            onClick={() => handleClick(action)}
            disabled={busy !== null}
            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition disabled:opacity-50 ${VARIANT_STYLE[action.variant]}`}
          >
            {busy === action.next ? "..." : action.label}
          </button>
        ))}
        {error ? <span className="text-[10px] text-[#F0E2D2]">{error}</span> : null}
      </div>

      <AdminConfirmDialog
        open={dialog !== null}
        title={dialog?.confirmTitle || ""}
        message={dialog?.confirmMessage || ""}
        confirmPhrase={dialog?.confirmPhrase || ""}
        onConfirm={(reason) => submit(dialog!.next, reason)}
        onClose={() => setDialog(null)}
      />
    </>
  );
}
