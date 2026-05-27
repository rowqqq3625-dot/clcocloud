"use client";

import { useEffect, useState } from "react";
import type { KeyRowSafe } from "@/lib/vending/types";

type Props = {
  open: boolean;
  orderNo: string;
  orderPlanCode: string;
  csrfToken: string;
  onClose: () => void;
  onSuccess?: () => void;
};

// paid_pending_key 주문에 가용 키 1개를 강제 매칭한다.
// 운영자가 특정 키를 선택하거나, 자동 픽업을 선택할 수 있다.
export function ManualIssueModal({ open, orderNo, orderPlanCode, csrfToken, onClose, onSuccess }: Props) {
  const [keys, setKeys] = useState<KeyRowSafe[]>([]);
  const [pick, setPick] = useState<string>("");
  const [notify, setNotify] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPick("");
    setNotify(true);
    setError(null);

    const load = async () => {
      try {
        const res = await fetch(`/api/admin/vending/keys?status=available&plan_code=${encodeURIComponent(orderPlanCode)}&pageSize=20`);
        const data = await res.json();
        setKeys((data.rows as KeyRowSafe[]) || []);
      } catch (e: any) {
        setError(e.message || "가용 키 조회 실패");
      }
    };
    void load();
  }, [open, orderPlanCode]);

  if (!open) return null;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/vending/manual-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-CSRF": csrfToken },
        body: JSON.stringify({
          order_no: orderNo,
          key_id: pick || undefined,
          notify_buyer: notify,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.message || "수동 매칭 실패");
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
      <div className="w-[min(560px,94vw)] rounded-3xl border border-cream/15 bg-[#1A1916] p-6 text-cream shadow-[0_24px_80px_rgba(0,0,0,.45)]">
        <p className="text-base font-bold text-[#D97757]">수동 키 매칭</p>
        <p className="mt-1 text-xs text-cream/60">
          주문 <span className="font-mono text-[#F0E2D2]">{orderNo}</span> ({orderPlanCode}) 에 가용 키를 강제 발급합니다.
        </p>

        <label className="mt-5 grid gap-1.5 text-xs text-cream/70">
          <span>키 선택 (미선택 시 자동 픽업)</span>
          <select
            value={pick}
            onChange={(e) => setPick(e.target.value)}
            className="rounded-2xl border border-cream/15 bg-black/40 px-4 py-2.5 text-sm outline-none focus:border-[#D97757]"
          >
            <option value="">— 자동 (가장 먼저 등록된 키) —</option>
            {keys.map((k) => (
              <option key={k.id} value={k.id}>
                {k.key_preview} · {k.product_code} · {fmt(k.created_at)}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-3 flex items-center gap-2 text-xs text-cream/80">
          <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
          구매자에게 알림톡 발송 (BATI PAY_DONE_KEY_DELIVERY)
        </label>

        {error ? (
          <p className="mt-3 rounded-2xl border border-[#D97757]/40 bg-[#D97757]/10 px-3 py-2 text-xs text-[#F0E2D2]">{error}</p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full border border-cream/15 px-4 py-2 text-xs font-bold text-cream/80 transition hover:border-cream/40 disabled:opacity-60">
            취소
          </button>
          <button type="button" onClick={submit} disabled={busy} className="rounded-full bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:bg-[#c5694b] disabled:opacity-60">
            매칭 실행
          </button>
        </div>
      </div>
    </div>
  );
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "—";
  }
}
