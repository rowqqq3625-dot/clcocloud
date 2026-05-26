"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminSessionCountdown } from "./AdminSessionCountdown";

type Props = {
  email: string;
  country: string | null;
  expiresAt: string;
};

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return undefined;
}

export function AdminTopbar({ email, country, expiresAt }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onLogout = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const csrf = readCookie("clco-admin-csrf");
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        headers: csrf ? { "X-Admin-CSRF": csrf } : undefined,
      });
    } finally {
      router.replace("/");
    }
  };

  return (
    <header className="flex items-center justify-between gap-4 border-b border-cream/10 bg-[#1A1916] px-6 py-3">
      <div className="flex items-center gap-3 text-xs text-cream/60">
        <span className="font-mono uppercase tracking-[0.2em] text-cream/40">관리자</span>
        <span className="truncate text-cream/80">{email}</span>
        <span className="rounded-full border border-cream/15 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em]">
          {country || "—"}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <AdminSessionCountdown expiresAt={expiresAt} />
        <button
          type="button"
          onClick={onLogout}
          disabled={busy}
          className="rounded-full border border-cream/15 px-4 py-1.5 text-xs font-bold text-cream/80 transition hover:border-[#D97757] hover:text-[#D97757] disabled:opacity-60"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
