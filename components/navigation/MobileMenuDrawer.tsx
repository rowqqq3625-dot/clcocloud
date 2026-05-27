"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { DashboardGateLink } from "@/components/navigation/DashboardGateLink";

type SessionUser = {
  provider: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

type MobileMenuDrawerProps = {
  open: boolean;
  onClose: () => void;
  user: SessionUser | null;
  isAdminCandidate: boolean;
  adminEntryBusy: boolean;
  onAdminEntry: () => void;
};

const STATIC_LINKS: Array<{ label: string; href: string }> = [
  { label: "가격", href: "/#pricing" },
  { label: "사용법", href: "/#flow" },
  { label: "문서", href: "/docs" },
  { label: "FAQ", href: "/#faq" }
];

const GATED_LINKS: Array<{ label: string; href: string }> = [
  { label: "대시보드", href: "/dashboard" },
  { label: "어시스턴트", href: "/assistant" },
  { label: "MY", href: "/mypage" }
];

export function MobileMenuDrawer({
  open,
  onClose,
  user,
  isAdminCandidate,
  adminEntryBusy,
  onAdminEntry
}: MobileMenuDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 60);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[80] md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="모바일 메뉴"
          id="mobile-menu-drawer"
        >
          <motion.button
            type="button"
            aria-label="메뉴 닫기"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-0 flex h-full w-[min(100vw,360px)] flex-col bg-cream text-primary shadow-[0_24px_80px_rgba(31,30,29,.28)]"
            style={{
              paddingTop: "max(env(safe-area-inset-top), 0px)",
              paddingBottom: "max(env(safe-area-inset-bottom), 0px)"
            }}
          >
            <div className="flex h-14 items-center justify-between px-5">
              <Link href="/" onClick={onClose} aria-label="클코클라우드 홈" className="flex items-center">
                <BrandLogo size={28} type="full" />
              </Link>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="메뉴 닫기"
                className="grid h-11 w-11 place-items-center rounded-full text-primary transition hover:bg-[var(--border-subtle)]/40 active:scale-[0.97]"
              >
                <X size={24} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>

            {user ? (
              <div className="mx-5 mb-2 flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-cream-2/70 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--border-subtle)] bg-cream text-sm font-bold text-coral">
                  <DrawerAvatar user={user} size={40} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{user.name || "연동 계정"}</p>
                  <p className="truncate text-xs text-secondary">{user.email || "이메일 없음"}</p>
                </div>
              </div>
            ) : null}

            <nav aria-label="모바일 주 메뉴" className="flex-1 overflow-y-auto">
              <ul className="flex flex-col px-2 py-1">
                {STATIC_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="flex h-14 items-center justify-between rounded-2xl px-4 text-[18px] font-semibold text-primary transition active:scale-[0.99] active:bg-[var(--border-subtle)]/40 hover:bg-[var(--border-subtle)]/30"
                    >
                      <span>{item.label}</span>
                      <ChevronRight size={20} strokeWidth={1.75} className="text-secondary" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
                {GATED_LINKS.map((item) => (
                  <li key={item.href}>
                    <DashboardGateLink
                      href={item.href}
                      className="flex h-14 items-center justify-between rounded-2xl px-4 text-[18px] font-semibold text-primary transition active:scale-[0.99] active:bg-[var(--border-subtle)]/40 hover:bg-[var(--border-subtle)]/30"
                    >
                      <span className="flex flex-1 items-center justify-between">
                        <span>{item.label}</span>
                        <ChevronRight size={20} strokeWidth={1.75} className="text-secondary" aria-hidden="true" />
                      </span>
                    </DashboardGateLink>
                  </li>
                ))}
                {isAdminCandidate ? (
                  <li>
                    <button
                      type="button"
                      onClick={() => {
                        onAdminEntry();
                        onClose();
                      }}
                      disabled={adminEntryBusy}
                      className="flex h-14 w-full items-center justify-between rounded-2xl px-4 text-left text-[18px] font-semibold text-primary transition active:scale-[0.99] active:bg-[var(--border-subtle)]/40 hover:bg-[var(--border-subtle)]/30 disabled:opacity-60"
                    >
                      <span>관리자 페이지</span>
                      <ChevronRight size={20} strokeWidth={1.75} className="text-secondary" aria-hidden="true" />
                    </button>
                  </li>
                ) : null}
              </ul>
            </nav>

            <div className="border-t border-[var(--border-subtle)] px-5 pb-5 pt-4">
              <Link
                href="/start"
                onClick={onClose}
                className="flex h-[52px] items-center justify-center rounded-full bg-coral text-base font-bold text-cream transition active:scale-[0.98] hover:brightness-105"
              >
                시작하기
              </Link>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

function DrawerAvatar({ user, size }: { user: SessionUser; size: number }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(user.image) && !imgFailed;
  const initial = (user.name || user.email || user.provider || "?").slice(0, 1).toUpperCase();

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.image as string}
        alt=""
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        loading="lazy"
        decoding="async"
        onError={() => setImgFailed(true)}
        className="h-full w-full object-cover"
      />
    );
  }

  return <span>{initial}</span>;
}
