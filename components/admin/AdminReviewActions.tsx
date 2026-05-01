"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BonusStatus, ReviewRecord, ReviewStatus } from "@/lib/supabase-admin";

type ReviewLite = Pick<ReviewRecord, "id" | "status" | "bonus_status">;

export function AdminReviewActions({ review }: { review: ReviewLite }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  const update = async (payload: { status?: ReviewStatus; bonusStatus?: BonusStatus }, label: string) => {
    setBusy(label);
    await fetch(`/api/admin/reviews/${review.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    setBusy(null);
    router.refresh();
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => update({ status: "approved" }, "approve")} className="rounded-xl bg-[#5A8A6B]/10 px-3 py-2 text-xs font-bold text-[#5A8A6B] transition hover:bg-[#5A8A6B] hover:text-cream" disabled={busy !== null}>
        {busy === "approve" ? "처리중" : "승인"}
      </button>
      <button type="button" onClick={() => update({ status: "rejected", bonusStatus: "none" }, "reject")} className="rounded-xl bg-coral/10 px-3 py-2 text-xs font-bold text-coral transition hover:bg-coral hover:text-cream" disabled={busy !== null}>
        반려
      </button>
      <button type="button" onClick={() => update({ bonusStatus: "paid" }, "bonus")} className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-cream transition hover:bg-coral" disabled={busy !== null || review.bonus_status === "paid"}>
        $30 지급완료
      </button>
    </div>
  );
}
