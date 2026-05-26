"use client";

import { useState } from "react";

export function AdminMembersCsvButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/members/export", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!response.ok) {
        setError(response.status === 401 ? "권한이 만료되었습니다." : "내보내기에 실패했습니다.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `clcocloud_members_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      setError("네트워크 오류");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="rounded-full border border-cream/15 px-4 py-1.5 text-xs font-bold text-cream/80 transition hover:border-[#D97757] hover:text-cream disabled:opacity-60"
      >
        {busy ? "내보내는 중..." : "CSV 다운로드"}
      </button>
      {error ? <span className="text-[10px] text-[#F0E2D2]">{error}</span> : null}
    </div>
  );
}
