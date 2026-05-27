"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";

/**
 * Single-row "회수" action used inside the reward ledger table.
 * Opens an inline prompt asking for the reason + whether to hide
 * the review, then calls the revoke endpoint and refreshes.
 */
export function RevokeRewardButton({ rewardLedgerId }: { rewardLedgerId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const click = async () => {
    if (busy) return;
    const reason = window.prompt("회수 사유를 입력하세요");
    if (!reason?.trim()) return;
    const hide = window.confirm("이 리뷰도 함께 숨김 처리할까요? (확인=숨김, 취소=보상만 회수)");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/rewards/${rewardLedgerId}/revoke`, {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ reason: reason.trim(), hideReview: hide }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "action_failed");
        return;
      }
      router.refresh();
    } catch {
      setError("network_error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={click}
        disabled={busy}
        className="rounded-lg border border-[#D97757]/40 bg-[#D97757]/10 px-3 py-1 text-[11px] font-bold text-[#F0E2D2] transition hover:bg-[#D97757]/20 disabled:opacity-50"
      >
        {busy ? "처리중…" : "회수"}
      </button>
      {error ? <span className="font-mono text-[10px] text-[#F0E2D2]">{error}</span> : null}
    </span>
  );
}
