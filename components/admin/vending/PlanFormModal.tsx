"use client";

import { useEffect, useState } from "react";
import type { Plan } from "@/lib/vending/types";

type Props = {
  open: boolean;
  plan?: Plan | null; // 있으면 수정, 없으면 신규
  csrfToken: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function PlanFormModal({ open, plan, csrfToken, onClose, onSuccess }: Props) {
  const [code, setCode] = useState("");
  const [nameKo, setNameKo] = useState("");
  const [priceKrw, setPriceKrw] = useState<number>(0);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCode(plan?.code || "");
      setNameKo(plan?.name_ko || "");
      setPriceKrw(plan?.price_krw ?? 0);
      setActive(plan?.active ?? true);
      setBusy(false);
      setError(null);
    }
  }, [open, plan]);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vending/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-CSRF": csrfToken },
        body: JSON.stringify({ code: code.trim().toUpperCase(), name_ko: nameKo.trim(), price_krw: Number(priceKrw), active }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "플랜 저장 실패");
        return;
      }
      onSuccess?.();
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
        <p className="text-base font-bold text-[#D97757]">{plan ? "플랜 수정" : "신규 플랜"}</p>

        <div className="mt-4 grid gap-3">
          <label className="grid gap-1.5 text-xs text-cream/70">
            <span>코드 (대문자/숫자/_)</span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={!!plan}
              className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 font-mono text-xs outline-none focus:border-[#D97757] disabled:opacity-60"
              placeholder="STANDARD"
            />
          </label>
          <label className="grid gap-1.5 text-xs text-cream/70">
            <span>한글명</span>
            <input
              type="text"
              value={nameKo}
              onChange={(e) => setNameKo(e.target.value)}
              className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#D97757]"
              placeholder="STANDARD 잔액형 키"
            />
          </label>
          <label className="grid gap-1.5 text-xs text-cream/70">
            <span>가격 (KRW)</span>
            <input
              type="number"
              min={0}
              value={priceKrw}
              onChange={(e) => setPriceKrw(Number(e.target.value))}
              className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#D97757]"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-cream/80">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            활성 (비활성 시 새 결제·발급 차단)
          </label>
        </div>

        {error ? (
          <p className="mt-3 rounded-2xl border border-[#D97757]/40 bg-[#D97757]/10 px-3 py-2 text-xs text-[#F0E2D2]">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full border border-cream/15 px-4 py-2 text-xs font-bold text-cream/80 transition hover:border-cream/40 disabled:opacity-60">
            취소
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !code.trim() || !nameKo.trim()}
            className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-60"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
