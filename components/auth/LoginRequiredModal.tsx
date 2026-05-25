"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/ui/BrandLogo";

interface LoginRequiredModalProps {
  open: boolean;
  onClose: () => void;
  returnTo?: string;
}

export function LoginRequiredModal({ open, onClose, returnTo = "/dashboard" }: LoginRequiredModalProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const [active, setActive] = useState(false);

  // Smooth CSS Transition State Machine with a safe paint sequence (50ms)
  useEffect(() => {
    if (open) {
      setShouldRender(true);
      // Let the browser paint the initial hidden state first
      const timer = setTimeout(() => {
        setActive(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setActive(false);
      // Wait for the exit transition to finish before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Handle body scroll-locking smoothly (with Lenis freeze support)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      // Freeze Lenis smooth scroll globally
      if (typeof window !== "undefined" && (window as any).__clcoLenis) {
        (window as any).__clcoLenis.stop();
      }

      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") onClose();
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        if (typeof window !== "undefined" && (window as any).__clcoLenis) {
          (window as any).__clcoLenis.start();
        }
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, onClose]);

  if (!shouldRender) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[10000] grid min-h-[100dvh] place-items-center overflow-y-auto px-4 py-6 ${
        active ? "pointer-events-auto" : "pointer-events-none"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-locked-title"
    >
      {/* Hardware-accelerated independent Backdrop Blur Transition */}
      <button
        type="button"
        aria-label="팝업 닫기"
        className={`absolute inset-0 cursor-default bg-[#0F0E0D]/18 backdrop-blur-[6px] transition-all duration-300 ease-out ${
          active ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />

      {/* Main Modal Card with Claude Signature Serif Font & Spring-like scaling transition */}
      <div
        className={`noise relative mx-auto w-full max-w-[380px] overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-cream p-6 text-primary shadow-[0_32px_96px_rgba(15,14,13,.35)] sm:p-7 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          active ? "scale-100 translate-y-0 opacity-100" : "scale-95 translate-y-4 opacity-0"
        }`}
      >
        {/* Soft Warm-glow Lighting Spheres */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-coral/20 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 left-[-6rem] h-72 w-72 rounded-full bg-peach/60 blur-[90px]" />
        
        {/* Elegant Minimalist 'X' Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 z-[2] grid h-9 w-9 place-items-center rounded-full border border-[var(--border-subtle)] bg-cream/70 text-2xl font-light leading-none text-secondary shadow-sm transition-all duration-300 hover:border-coral/40 hover:bg-cream hover:text-coral hover:scale-105 active:scale-95"
          aria-label="닫기"
        >
          ×
        </button>

        <div className="relative z-[1] flex flex-col justify-between h-full">
          {/* Header: Logo and Label */}
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-coral/15 bg-coral/8 shadow-[inset_0_1px_rgba(255,255,255,.5)]">
              <BrandLogo size={24} />
            </span>
            <div>
              <p className="text-[13px] font-bold tracking-tight text-secondary">로그인 필요</p>
            </div>
          </div>

          {/* Main Headline: Anthropic Claude Signature Serif Font with accent & line break */}
          <div className="mt-7 mb-7">
            <h2 
              id="login-locked-title" 
              className="break-keep text-[32px] sm:text-[34px] font-[600] leading-[1.20] tracking-[-0.045em] text-[#1F1E1D]"
              style={{ fontFamily: "'Spectral', 'Georgia', 'Noto Serif KR', 'Nanum Myeongjo', serif" }}
            >
              아이디어가<br />
              <span className="text-coral">현실이 되는 순간.</span>
            </h2>
          </div>

          {/* Action Button: Pill design with elegant interaction */}
          <a
            href={`/start?returnTo=${encodeURIComponent(returnTo)}`}
            className="flex min-h-12 w-full items-center justify-between rounded-[16px] bg-coral px-5 text-[14px] font-bold text-cream shadow-coral transition-all duration-300 hover:bg-coral-deep hover:-translate-y-0.5 active:scale-98"
          >
            <span>로그인 하러가기</span>
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-cream/15 font-mono text-xs">→</span>
          </a>
        </div>
      </div>
    </div>,
    document.body
  );
}
