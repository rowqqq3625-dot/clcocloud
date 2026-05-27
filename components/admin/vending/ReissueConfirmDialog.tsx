"use client";

import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  keyId: string;
  keyPreview: string | null;
  orderNo: string | null;
  csrfToken: string;
  onClose: () => void;
  onSuccess?: (newKeyId: string) => void;
};

// 재발급 확인 — 기존 키 revoke + 동일 주문에 신규 키 issue + (옵션) 알림톡 재발송.
// 사유 4자 이상 + 정확 문구 REISSUE 입력 필요.
export function ReissueConfirmDialog({ open, keyId, keyPreview, orderNo, csrfToken, onClose, onSuccess }: Props) {
  const [phrase, setPhrase] = useState("");
  const [reason, setReason] = useState("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPhrase("");
      setReason("");
      setNotify(true);
      setBusy(false);
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  const canConfirm = phrase === "REISSUE" && reason.trim().length >= 4 && !busy;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vending/keys/${keyId}/reissue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-CSRF": csrfToken },
        body: JSON.stringify({ reason: reason.trim(), notify_buyer: notify }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "재발급 실패");
        return;
      }
      onSuccess?.(data.new_key_id);
      onClose();
    } catch (e: any) {
      setError(e.message || "네트워크 오류");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] grid place-items-center bg-black/55 backdrop-blur-sm">
      <div className="w-[min(480px,92vw)] rounded-3xl border border-cream/15 bg-[#1A1916] p-6 text-cream shadow-[0_24px_80px_rgba(0,0,0,.45)]">
        <p className="text-base font-bold text-[#D97757]">API 키 재발급</p>
        <p className="mt-3 text-sm text-cream/75">
          {keyPreview || keyId} 키를 폐기하고 주문 {orderNo || "—"} 에 신규 키를 발급합니다. 가용 키가 없으면 실패합니다.
        </p>

        <label className="mt-5 grid gap-1.5 text-xs text-cream/70">
          <span>계속하려면 <span className="font-mono text-[#F0E2D2]">REISSUE</span> 를 입력하세요.</span>
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            autoComplete="off"
            className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#D97757]"
          />
        </label>

        <label className="mt-3 grid gap-1.5 text-xs text-cream/70">
          <span>사유 (최소 4자)</span>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#D97757]"
          />
        </label>

        <label className="mt-3 flex items-center gap-2 text-xs text-cream/80">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          구매자에게 알림톡 재발송 (BATI PAY_DONE_KEY_DELIVERY)
        </label>

        {error ? (
          <p className="mt-3 rounded-2xl border border-[#D97757]/40 bg-[#D97757]/10 px-3 py-2 text-xs text-[#F0E2D2]">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full border border-cream/15 px-4 py-2 text-xs font-bold text-cream/80 transition hover:border-cream/40 disabled:opacity-60">
            취소
          </button>
          <button type="button" onClick={handleConfirm} disabled={!canConfirm} className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-60">
            재발급
          </button>
        </div>
      </div>
    </div>
  );
}
