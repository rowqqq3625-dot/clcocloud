import React from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { PrimaryButton } from "@/components/ui/PrimaryButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-primary">
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-cream/95 backdrop-blur-xl">
        <nav className="container-cinematic flex min-h-[72px] items-center justify-between gap-5 py-3">
          <a href="/" className="flex shrink-0 items-center gap-3 text-[17px] font-bold tracking-[-0.01em] text-primary">
            <BrandLogo size={28} />
            클코클라우드
          </a>
          <div className="hidden items-center gap-8 text-sm font-semibold text-secondary md:flex">
            <a className="transition hover:text-coral" href="/">홈</a>
            <a className="relative text-primary opacity-80 after:absolute after:-bottom-2 after:left-0 after:h-[1.5px] after:w-full after:bg-coral" href="/dashboard">Dashboard</a>
            <a className="transition hover:text-coral" href="/#pricing">Pricing</a>
          </div>
          <PrimaryButton href="/checkout?plan=pro" arrow="→">충전하기</PrimaryButton>
        </nav>
      </header>
      {children}
    </div>
  );
}
