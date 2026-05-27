"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Props = {
  expiresAt: string;
};

function format(remainingMs: number): string {
  if (remainingMs <= 0) return "00:00";
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function AdminSessionCountdown({ expiresAt }: Props) {
  const router = useRouter();
  const expiryMs = useRef<number>(new Date(expiresAt).getTime());
  // Initial value is null on both server and client to avoid the inevitable
  // sub-second drift between SSR render and client hydration (Date.now() differs).
  // useEffect populates the real value on mount.
  const [remaining, setRemaining] = useState<number | null>(null);
  const [evicted, setEvicted] = useState(false);

  // Tick every second.
  useEffect(() => {
    setRemaining(Math.max(0, expiryMs.current - Date.now()));
    const id = window.setInterval(() => {
      const remainingMs = Math.max(0, expiryMs.current - Date.now());
      setRemaining(remainingMs);
      if (remainingMs <= 0) {
        window.clearInterval(id);
        router.replace("/admin-gate");
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [router]);

  // Heartbeat every 30 seconds: detect single-session takeover.
  useEffect(() => {
    let cancelled = false;
    const probe = async () => {
      try {
        const response = await fetch("/api/admin/session/heartbeat", {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
        });
        if (cancelled) return;
        if (!response.ok) {
          setEvicted(true);
          window.setTimeout(() => router.replace("/admin-gate"), 1500);
          return;
        }
        const data = (await response.json()) as { expiresAt?: string };
        if (data?.expiresAt) {
          expiryMs.current = new Date(data.expiresAt).getTime();
        }
      } catch {
        // Network blips: silent.
      }
    };
    const id = window.setInterval(probe, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [router]);

  const warning = remaining !== null && remaining > 0 && remaining < 5 * 60_000;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-mono uppercase tracking-[0.2em] text-cream/40">세션</span>
      <span
        className={[
          "font-mono tabular-nums",
          warning ? "text-[#D97757]" : "text-cream/80",
        ].join(" ")}
        aria-live="polite"
      >
        {remaining === null ? "--:--" : format(remaining)}
      </span>
      {evicted ? (
        <span className="ml-2 rounded-full bg-[#D97757]/20 px-2 py-0.5 text-[10px] font-bold text-[#F0E2D2]">
          관리자 세션이 다른 위치에서 갱신되었습니다. 다시 인증해주세요.
        </span>
      ) : null}
    </div>
  );
}
