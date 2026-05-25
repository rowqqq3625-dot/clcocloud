"use client";

import Link from "next/link";
import { useState, type MouseEvent, type ReactNode } from "react";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";

type DashboardGateLinkProps = {
  href?: string;
  children: ReactNode;
  className?: string;
  dotClassName?: string;
};

type SessionResponse = {
  authenticated: boolean;
};

export function DashboardGateLink({ href = "/dashboard", children, className = "", dotClassName }: DashboardGateLinkProps) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleClick = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (checking) return;

    setChecking(true);
    try {
      const response = await fetch("/api/session", { cache: "no-store" });
      const data = (await response.json()) as SessionResponse;
      if (data.authenticated) {
        window.location.href = href;
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
      <Link href={href} onClick={handleClick} className={className} aria-haspopup="dialog" aria-expanded={open}>
        {dotClassName ? <span className={dotClassName} /> : null}
        {children}
      </Link>
      <LoginRequiredModal open={open} onClose={() => setOpen(false)} returnTo={href} />
    </>
  );
}
