"use client";

import { useState } from "react";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";

type Props = {
  logId: string;
  templateCode: string;
  phone: string;
  /** Optional callback after a successful resend (e.g. close modal / refetch). */
  onResent?: () => void;
};

export function AlimtalkResendButton({ logId, templateCode, phone, onResent }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async (reason: string) => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/alimtalk-logs/${logId}/resend`, {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "재전송에 실패했습니다.");
        return;
      }
      setSuccess(true);
      onResent?.();
    } catch {
      setError("네트워크 오류");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
          setSuccess(false);
        }}
        disabled={busy}
        className="rounded-full border border-amber-400/30 px-2 py-0.5 text-[9px] font-bold text-amber-300 transition hover:border-amber-300/60 disabled:opacity-50"
      >
        {busy ? "..." : success ? "재전송됨" : "재전송"}
      </button>
      {error ? <span className="ml-2 text-[10px] text-[#F0E2D2]">{error}</span> : null}

      <AdminConfirmDialog
        open={open}
        title="알림톡 재전송"
        message={`템플릿 ${templateCode} 를(을) ${phone}(으)로 다시 발송합니다. 동일한 변수값으로 재발송되며, 발송 결과는 alimtalk_logs와 감사 로그에 기록됩니다.`}
        confirmPhrase="RESEND"
        onConfirm={handleConfirm}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
