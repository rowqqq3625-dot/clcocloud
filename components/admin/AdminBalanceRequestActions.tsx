"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BalanceRequestRecord, BalanceRequestStatus } from "@/lib/supabase-admin";

export function AdminBalanceRequestActions({ request }: { request: Pick<BalanceRequestRecord, "id" | "admin_note"> }) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState(request.admin_note || "");
  const [busy, setBusy] = useState<string | null>(null);

  const update = async (status: BalanceRequestStatus) => {
    setBusy(status);
    await fetch(`/api/admin/balance-requests/${request.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote })
    });
    setBusy(null);
    router.refresh();
  };

  return (
    <div className="grid gap-2">
      <textarea
        value={adminNote}
        onChange={(event) => setAdminNote(event.target.value)}
        placeholder="관리자 메모 또는 답변"
        className="min-h-20 resize-none rounded-2xl border border-[var(--border-subtle)] bg-white px-3 py-2 text-xs font-semibold leading-5 outline-none focus:border-coral"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => update("answered")} className="rounded-xl bg-coral/10 px-3 py-2 text-xs font-bold text-coral transition hover:bg-coral hover:text-cream" disabled={busy !== null}>답변완료</button>
        <button type="button" onClick={() => update("fulfilled")} className="rounded-xl bg-[#5A8A6B]/10 px-3 py-2 text-xs font-bold text-[#5A8A6B] transition hover:bg-[#5A8A6B] hover:text-cream" disabled={busy !== null}>충전지급</button>
        <button type="button" onClick={() => update("rejected")} className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-cream transition hover:bg-coral" disabled={busy !== null}>거절</button>
      </div>
    </div>
  );
}
