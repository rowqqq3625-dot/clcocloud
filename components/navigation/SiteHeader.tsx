"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { DashboardGateLink } from "@/components/navigation/DashboardGateLink";

type SiteHeaderProps = {
  variant?: "floating" | "solid";
};

type SessionUser = {
  provider: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

type SessionResponse = {
  authenticated: boolean;
  user: SessionUser | null;
};

const providerLabels: Record<string, string> = {
  google: "Google",
  kakao: "Kakao",
  naver: "Naver"
};

export function SiteHeader({ variant = "floating" }: SiteHeaderProps) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/session", { cache: "no-store" })
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((data) => {
        if (active) setUser(data.authenticated ? data.user : null);
      })
      .catch(() => {
        if (active) setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!profileOpen) return undefined;

    const handlePointerDown = (event: PointerEvent) => {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProfileOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  const wrapperClass = variant === "floating"
    ? "container-cinematic sticky top-4 z-40 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-[28px] border border-[var(--border-subtle)] bg-glass px-4 py-3 backdrop-blur-xl md:rounded-full"
    : "container-cinematic flex min-h-[72px] flex-wrap items-center justify-between gap-x-5 gap-y-3 py-3";
  const linkClass = variant === "floating"
    ? "transition hover:text-coral"
    : "transition hover:text-coral";

  return (
    <nav className={wrapperClass} aria-label="상단 메뉴">
      <Link href="/" className="flex shrink-0 items-center gap-3 text-[17px] font-bold tracking-[-0.01em] text-primary">
        <BrandLogo size={28} />
        <span>클코클라우드</span>
      </Link>

      <div className="order-3 flex w-full items-center gap-3 overflow-x-auto whitespace-nowrap text-[12px] font-semibold text-secondary [scrollbar-width:none] md:order-none md:w-auto md:overflow-visible md:text-sm">
        {/* Left Menu Group */}
        <div className="flex items-center gap-4 md:gap-6">
          <Link className={linkClass} href="/#pricing">가격</Link>
          <Link className={linkClass} href="/#flow">사용법</Link>
          <Link className={linkClass} href="/docs">문서</Link>
          <Link className={linkClass} href="/#faq">FAQ</Link>
        </div>

        {/* Vertical Divider: 12px gap, 0.5px line (line 40% opacity) */}
        <span className="mx-1 h-3.5 w-[0.5px] bg-[var(--border-subtle)] opacity-40 md:mx-2" />

        {/* Right Menu Group */}
        <div className="flex items-center gap-4 md:gap-6">
          <DashboardGateLink className={linkClass} href="/dashboard">대시보드</DashboardGateLink>
          <DashboardGateLink className={linkClass} href="/assistant">어시스턴트</DashboardGateLink>
          <DashboardGateLink className={linkClass} href="/mypage">MY</DashboardGateLink>
        </div>
      </div>

      <div className="relative flex items-center gap-3 justify-end" ref={profileRef}>
        {/* Single CTA '로그인' button - Black bg, thin Coral border, scaled up */}
        <Link
          href="/start"
          className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-[12.5px] md:text-[13.5px] font-extrabold text-white border-[0.5px] border-[#D97757] shadow-md transition-all duration-300 hover:bg-neutral-900 hover:scale-105 active:scale-98"
        >
          로그인
        </Link>

        {user ? (
          <>
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-[var(--border-subtle)] bg-cream text-[11px] font-bold text-secondary shadow-sm transition hover:border-coral/45 hover:text-coral shrink-0"
              aria-label="프로필 메뉴"
              aria-expanded={profileOpen}
            >
              {user.image ? (
                <Image src={user.image} alt="" width={32} height={32} className="h-full w-full object-cover" unoptimized />
              ) : (
                <span>{(user.name || user.email || user.provider).slice(0, 1).toUpperCase()}</span>
              )}
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-11 z-[60] w-[260px] overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-cream/95 p-3 text-primary shadow-[0_24px_80px_rgba(31,30,29,.18)] backdrop-blur-xl">
                <div className="flex items-center gap-3 rounded-2xl bg-cream-2/70 p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--border-subtle)] bg-cream text-sm font-bold text-coral">
                    {user.image ? (
                      <Image src={user.image} alt="" width={40} height={40} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <span>{(user.name || user.email || user.provider).slice(0, 1).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{user.name || "연동 계정"}</p>
                    <p className="truncate text-xs text-secondary">{user.email || "이메일 없음"}</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-coral/80">
                      {providerLabels[user.provider] || user.provider}
                    </p>
                  </div>
                </div>
                <div className="mt-2 grid gap-1 text-sm font-semibold">
                  <DashboardGateLink href="/assistant" className="rounded-2xl px-3 py-2 text-secondary transition hover:bg-coral/10 hover:text-coral">
                    어시스턴트
                  </DashboardGateLink>
                  <DashboardGateLink href="/mypage" className="rounded-2xl px-3 py-2 text-secondary transition hover:bg-coral/10 hover:text-coral">
                    MY
                  </DashboardGateLink>
                  <Link href="/api/auth/logout" className="rounded-2xl px-3 py-2 text-xs font-bold text-secondary/75 transition hover:bg-primary hover:text-cream">
                    로그아웃
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </nav>
  );
}
