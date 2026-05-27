"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { DashboardGateLink } from "@/components/navigation/DashboardGateLink";
import { GeoBlockedDialog } from "@/components/site/GeoBlockedDialog";
import { MobileMenuDrawer } from "@/components/navigation/MobileMenuDrawer";

export type SessionUser = {
  provider: string;
  email: string | null;
  name: string | null;
  image: string | null;
};

type SiteHeaderProps = {
  variant?: "floating" | "solid";
  initialUser?: SessionUser | null;
  initialAdminCandidate?: boolean;
};

type SessionResponse = {
  authenticated: boolean;
  user: SessionUser | null;
  isAdminCandidate?: boolean;
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

const providerLabels: Record<string, string> = {
  google: "Google",
  kakao: "Kakao",
  naver: "Naver"
};

function ProfileAvatar({
  user,
  size,
  textClassName = "text-[11px] font-bold text-secondary",
}: {
  user: SessionUser;
  size: number;
  textClassName?: string;
}) {
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

  return <span className={textClassName}>{initial}</span>;
}

export function SiteHeader({
  variant = "floating",
  initialUser = null,
  initialAdminCandidate = false,
}: SiteHeaderProps) {
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [isAdminCandidate, setIsAdminCandidate] = useState(initialAdminCandidate);
  const [profileOpen, setProfileOpen] = useState(false);
  const [geoBlockedOpen, setGeoBlockedOpen] = useState(false);
  const [adminEntryBusy, setAdminEntryBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    let active = true;

    fetch("/api/session", { cache: "no-store", credentials: "same-origin" })
      .then((response) => response.json() as Promise<SessionResponse>)
      .then((data) => {
        if (!active) return;
        setUser(data.authenticated ? data.user : null);
        setIsAdminCandidate(Boolean(data.isAdminCandidate));
      })
      .catch(() => {
        // Keep server-hydrated state on transient errors to avoid flashing
        // the logged-out UI when the user is in fact authenticated.
      });

    return () => {
      active = false;
    };
  }, []);

  const handleAdminEntry = async () => {
    if (adminEntryBusy) return;
    setAdminEntryBusy(true);
    setProfileOpen(false);
    try {
      const csrf = readCookie("clco-admin-csrf");
      const response = await fetch("/api/admin/entry/start", {
        method: "POST",
        credentials: "same-origin",
        headers: csrf ? { "X-Admin-CSRF": csrf } : undefined,
      });
      if (response.ok) {
        const data = (await response.json().catch(() => null)) as { next?: string } | null;
        router.push(data?.next || "/admin-gate");
        return;
      }
      if (response.status === 403) {
        setGeoBlockedOpen(true);
        return;
      }
      // Other failures: stay silent — never reveal admin existence.
    } catch {
      // Network error: silent.
    } finally {
      setAdminEntryBusy(false);
    }
  };

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
      <Link href="/" className="flex shrink-0 items-center gap-2 hover:opacity-90 transition-opacity" aria-label="클코클라우드 홈">
        <BrandLogo size={28} type="full" />
      </Link>

      <div className="hidden w-full items-center gap-3 overflow-x-auto whitespace-nowrap text-[12px] font-semibold text-secondary [scrollbar-width:none] md:order-none md:flex md:w-auto md:overflow-visible md:text-sm">
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
        {!user && (
          <Link
            href="/start"
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-[12.5px] md:text-[13.5px] font-extrabold text-white border-[0.5px] border-[#D97757] shadow-md transition-all duration-300 hover:bg-neutral-900 hover:scale-105 active:scale-98"
          >
            로그인
          </Link>
        )}

        {user ? (
          <>
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              className="grid h-8 w-8 place-items-center overflow-hidden rounded-full border border-[var(--border-subtle)] bg-cream text-[11px] font-bold text-secondary shadow-sm transition hover:border-coral/45 hover:text-coral shrink-0"
              aria-label="프로필 메뉴"
              aria-expanded={profileOpen}
            >
              <ProfileAvatar user={user} size={32} />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 top-11 z-[60] w-[260px] overflow-hidden rounded-3xl border border-[var(--border-subtle)] bg-cream/95 p-3 text-primary shadow-[0_24px_80px_rgba(31,30,29,.18)] backdrop-blur-xl">
                <div className="flex items-center gap-3 rounded-2xl bg-cream-2/70 p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--border-subtle)] bg-cream text-sm font-bold text-coral">
                    <ProfileAvatar user={user} size={40} textClassName="text-sm font-bold text-coral" />
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
                  {isAdminCandidate ? (
                    <button
                      type="button"
                      onClick={handleAdminEntry}
                      disabled={adminEntryBusy}
                      className="rounded-2xl px-3 py-2 text-left text-secondary transition hover:bg-coral/10 hover:text-coral disabled:opacity-60"
                    >
                      관리자 페이지
                    </button>
                  ) : null}
                  <Link href="/api/auth/logout" className="rounded-2xl px-3 py-2 text-xs font-bold text-secondary/75 transition hover:bg-primary hover:text-cream">
                    로그아웃
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <button
          type="button"
          onClick={() => {
            setProfileOpen(false);
            setDrawerOpen(true);
          }}
          aria-label="메뉴 열기"
          aria-expanded={drawerOpen}
          aria-controls="mobile-menu-drawer"
          className="grid h-11 w-11 place-items-center rounded-full text-primary transition active:scale-[0.97] hover:bg-[var(--border-subtle)]/40 md:hidden"
        >
          <Menu size={24} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
      <GeoBlockedDialog open={geoBlockedOpen} onClose={() => setGeoBlockedOpen(false)} />
      <MobileMenuDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        user={user}
        isAdminCandidate={isAdminCandidate}
        adminEntryBusy={adminEntryBusy}
        onAdminEntry={handleAdminEntry}
      />
    </nav>
  );
}
