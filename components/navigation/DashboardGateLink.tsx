"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useLayoutEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { BrandLogo } from "@/components/ui/BrandLogo";

type DashboardGateLinkProps = {
  children: ReactNode;
  className?: string;
  dotClassName?: string;
};

type SessionResponse = {
  authenticated: boolean;
};

export function DashboardGateLink({ children, className = "", dotClassName }: DashboardGateLinkProps) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  useLayoutEffect(() => {
    if (!open) return undefined;

    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousOverflow = document.body.style.overflow;
    const previousPosition = document.body.style.position;
    const previousTop = document.body.style.top;
    const previousLeft = document.body.style.left;
    const previousRight = document.body.style.right;
    const previousWidth = document.body.style.width;
    const previousPaddingRight = document.body.style.paddingRight;
    const previousOverscroll = document.body.style.overscrollBehavior;

    window.__clcoLenis?.stop();
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const blockScroll = (event: Event) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("wheel", blockScroll, { passive: false, capture: true });
    document.addEventListener("touchmove", blockScroll, { passive: false, capture: true });
    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousOverflow;
      document.body.style.position = previousPosition;
      document.body.style.top = previousTop;
      document.body.style.left = previousLeft;
      document.body.style.right = previousRight;
      document.body.style.width = previousWidth;
      document.body.style.paddingRight = previousPaddingRight;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("wheel", blockScroll, { capture: true });
      document.removeEventListener("touchmove", blockScroll, { capture: true });
      window.scrollTo(0, scrollY);
      window.__clcoLenis?.start();
    };
  }, [open]);

  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (checking) return;

    setChecking(true);
    try {
      const response = await fetch("/api/session", { cache: "no-store" });
      const data = (await response.json()) as SessionResponse;
      if (data.authenticated) {
        window.location.href = "/dashboard";
        return;
      }
    } catch {
      // 서버 보호가 최종 방어선이다. UX 단계에서는 시작 팝업으로 보낸다.
    } finally {
      setChecking(false);
    }

    setOpen(true);
  };

  return (
    <>
      <Link href="/dashboard" onClick={handleClick} className={className} aria-haspopup="dialog" aria-expanded={open}>
        {dotClassName ? <span className={dotClassName} /> : null}
        {children}
      </Link>
      <DashboardLockedModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function DashboardLockedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[999] grid min-h-[100dvh] place-items-center overflow-y-auto px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dashboard-locked-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            type="button"
            aria-label="팝업 닫기"
            className="absolute inset-0 cursor-default bg-[rgba(15,14,13,.50)] backdrop-blur-[14px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="noise relative mx-auto w-full max-w-[430px] overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-cream p-5 text-primary shadow-[0_38px_120px_rgba(15,14,13,.34)] sm:p-6"
            initial={{ opacity: 0, y: 28, scale: 0.9, rotateX: 8 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
            exit={{ opacity: 0, y: 18, scale: 0.94 }}
            transition={{ type: "spring", stiffness: 360, damping: 24, mass: 0.82 }}
          >
            <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-coral/25 blur-[80px]" />
            <div className="pointer-events-none absolute -bottom-28 left-[-5rem] h-72 w-72 rounded-full bg-peach/70 blur-[90px]" />
            <button
              type="button"
              onClick={onClose}
              className="absolute right-5 top-5 z-[2] grid h-9 w-9 place-items-center rounded-full border border-[var(--border-subtle)] bg-cream/80 text-2xl font-light leading-none text-secondary shadow-sm transition hover:border-coral/50 hover:text-coral"
              aria-label="닫기"
            >
              ×
            </button>

            <div className="relative z-[1]">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-coral/20 bg-coral/10 shadow-[inset_0_1px_rgba(255,255,255,.6)]">
                  <BrandLogo size={32} />
                </span>
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-coral/80">Dashboard</p>
                  <p className="mt-1 text-sm font-semibold text-secondary">로그인 필요</p>
                </div>
              </div>

              <h2 id="dashboard-locked-title" className="mt-7 break-keep text-[clamp(30px,7vw,42px)] font-[680] leading-[1.08] tracking-[-0.04em]">
                API 키로 시작하세요.
              </h2>
              <p className="mt-4 max-w-[320px] break-keep text-[15px] leading-6 text-secondary">
                잔액 · 주문 · API 키
              </p>

              <motion.a
                href="/start?returnTo=/dashboard"
                className="mt-7 flex min-h-14 w-full items-center justify-between rounded-2xl bg-coral px-5 text-base font-bold text-cream shadow-coral transition hover:bg-coral-hi"
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>바로 시작하기</span>
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-cream/18 font-mono">→</span>
              </motion.a>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
