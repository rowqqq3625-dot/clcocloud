"use client";

import { useEffect, useState } from "react";

/**
 * Generic destructive-action confirmation. Requires (a) the exact confirm
 * phrase and (b) a reason string before onConfirm fires. Wired by callers in
 * subsequent PRs; the shape is fixed here so audit-logged actions follow a
 * uniform UX.
 */
type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmPhrase: string;
  onConfirm: (reason: string) => Promise<void> | void;
  onClose: () => void;
};

export function AdminConfirmDialog({ open, title, message, confirmPhrase, onConfirm, onClose }: Props) {
  const [phrase, setPhrase] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setPhrase("");
      setReason("");
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const phraseOk = phrase === confirmPhrase;
  const reasonOk = reason.trim().length >= 4;
  const canConfirm = phraseOk && reasonOk && !busy;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] grid place-items-center bg-black/55 backdrop-blur-sm">
      <div className="w-[min(480px,92vw)] rounded-3xl border border-cream/15 bg-[#1A1916] p-6 text-cream shadow-[0_24px_80px_rgba(0,0,0,.45)]">
        <p className="text-base font-bold text-[#D97757]">{title}</p>
        <p className="mt-3 text-sm text-cream/75">{message}</p>

        <label className="mt-5 grid gap-1.5 text-xs text-cream/70">
          <span>
            계속하려면 <span className="font-mono text-[#F0E2D2]">{confirmPhrase}</span> 를 입력하세요.
          </span>
          <input
            type="text"
            value={phrase}
            onChange={(event) => setPhrase(event.target.value)}
            autoComplete="off"
            className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#D97757]"
          />
        </label>

        <label className="mt-3 grid gap-1.5 text-xs text-cream/70">
          <span>사유 (최소 4자)</span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={3}
            className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#D97757]"
          />
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-full border border-cream/15 px-4 py-2 text-xs font-bold text-cream/80 transition hover:border-cream/40 disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-60"
          >
            실행
          </button>
        </div>
      </div>
    </div>
  );
}
