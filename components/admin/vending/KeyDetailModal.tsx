"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  keyId: string;
  csrfToken: string;
  onClose: () => void;
};

// 키 원문 노출 모달.
// "원문 표시" 버튼 클릭 시 /reveal POST 호출 → 5초 후 자동 마스킹.
// 매 노출은 KEY_REVEAL 감사 로그를 남긴다.
export function KeyDetailModal({ open, keyId, csrfToken, onClose }: Props) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setRevealed(null);
      setError(null);
      setBusy(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]);

  if (!open) return null;

  const handleReveal = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/vending/keys/${keyId}/reveal`, {
        method: "POST",
        headers: { "X-Admin-CSRF": csrfToken },
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "원문 조회 실패");
        return;
      }
      setRevealed(data.key_value as string);
      const ttl = Number(data.expires_in_seconds || 5) * 1000;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setRevealed(null), ttl);
    } catch (e: any) {
      setError(e.message || "네트워크 오류");
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!revealed) return;
    try {
      await navigator.clipboard.writeText(revealed);
    } catch {
      // 무시 — 클립보드 권한 없을 수 있음
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] grid place-items-center bg-black/55 backdrop-blur-sm">
      <div className="w-[min(560px,94vw)] rounded-3xl border border-cream/15 bg-[#1A1916] p-6 text-cream shadow-[0_24px_80px_rgba(0,0,0,.45)]">
        <p className="text-base font-bold text-[#D97757]">키 원문 노출</p>
        <p className="mt-1 text-xs text-cream/60">
          버튼을 누르면 5초간 원문이 표시되고 자동으로 마스킹됩니다. 매 노출이 감사 로그에 기록됩니다.
        </p>

        <div className="mt-5 rounded-2xl border border-cream/15 bg-black/40 p-4 font-mono text-xs">
          {revealed ? (
            <div className="flex items-center justify-between gap-2">
              <span className="break-all text-emerald-300">{revealed}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-full bg-[#D97757]/20 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-[#F0E2D2] hover:bg-[#D97757]/30"
              >
                복사
              </button>
            </div>
          ) : (
            <span className="text-cream/40">{busy ? "조회 중..." : "원문이 마스킹되어 있습니다."}</span>
          )}
        </div>

        {error ? (
          <p className="mt-3 rounded-2xl border border-[#D97757]/40 bg-[#D97757]/10 px-3 py-2 text-xs text-[#F0E2D2]">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full border border-cream/15 px-4 py-2 text-xs font-bold text-cream/80 transition hover:border-cream/40">
            닫기
          </button>
          <button
            type="button"
            onClick={handleReveal}
            disabled={busy}
            className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-60"
          >
            {revealed ? "다시 표시" : "원문 표시 (5초)"}
          </button>
        </div>
      </div>
    </div>
  );
}
