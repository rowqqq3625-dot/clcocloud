"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";

type InquiryStatus = "open" | "contacted" | "completed" | "closed";

type Props = {
  id: string;
  currentStatus: InquiryStatus;
};

type ActionConfig = {
  next: InquiryStatus;
  label: string;
  variant: "neutral" | "primary" | "danger";
  needsConfirm: boolean;
  confirmTitle?: string;
  confirmMessage?: string;
  confirmPhrase?: string;
};

// Per-status next-step transitions. "completed" and "closed" require the
// destructive-action dialog (confirm phrase + reason); "contacted" is a soft
// triage transition that fires immediately.
const TRANSITIONS: Record<InquiryStatus, ActionConfig[]> = {
  open: [
    { next: "contacted", label: "연락중", variant: "neutral", needsConfirm: false },
    {
      next: "completed",
      label: "완료",
      variant: "primary",
      needsConfirm: true,
      confirmTitle: "문의를 완료 처리합니다",
      confirmMessage: "이 문의를 완료 상태로 전환하고 감사 로그에 기록합니다.",
      confirmPhrase: "COMPLETE",
    },
  ],
  contacted: [
    {
      next: "completed",
      label: "완료",
      variant: "primary",
      needsConfirm: true,
      confirmTitle: "문의를 완료 처리합니다",
      confirmMessage: "이 문의를 완료 상태로 전환하고 감사 로그에 기록합니다.",
      confirmPhrase: "COMPLETE",
    },
    {
      next: "closed",
      label: "종결",
      variant: "danger",
      needsConfirm: true,
      confirmTitle: "문의를 종결 처리합니다",
      confirmMessage: "응대하지 않고 종결합니다. 사유는 감사 로그에 보관됩니다.",
      confirmPhrase: "CLOSE",
    },
  ],
  completed: [
    { next: "open", label: "재오픈", variant: "neutral", needsConfirm: false },
  ],
  closed: [
    { next: "open", label: "재오픈", variant: "neutral", needsConfirm: false },
  ],
};

const VARIANT_STYLE: Record<ActionConfig["variant"], string> = {
  neutral: "border-cream/15 text-cream/70 hover:border-cream/40 hover:text-cream",
  primary: "border-emerald-400/30 text-emerald-300 hover:border-emerald-300/60",
  danger: "border-[#D97757]/40 text-[#F0E2D2] hover:border-[#D97757]",
};

export function InquiryStatusActions({ id, currentStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ActionConfig | null>(null);

  const submit = async (next: InquiryStatus, reason?: string) => {
    setBusy(next);
    setError(null);
    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PUT",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ id, status: next, reason }),
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
