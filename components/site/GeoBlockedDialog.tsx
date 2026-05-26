"use client";

import { useEffect, useRef } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function GeoBlockedDialog({ open, onClose }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    buttonRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="geo-blocked-title"
      className="fixed inset-0 z-[100] grid place-items-center bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-[min(360px,92vw)] rounded-3xl border border-[var(--border-subtle)] bg-cream p-6 text-primary shadow-[0_24px_80px_rgba(31,30,29,.28)]"
        onClick={(event) => event.stopPropagation()}
      >
        <p id="geo-blocked-title" className="text-center text-base font-bold">
          현재 국가에서는 접근할 수 없습니다.
        </p>
        <div className="mt-5 grid">
          <button
            ref={buttonRef}
            type="button"
            onClick={onClose}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-cream transition hover:bg-coral"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
