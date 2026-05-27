import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeaderShell } from "@/components/navigation/SiteHeaderShell";
import { getSessionFromCookies } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "클코클라우드 | 개발자 대시보드 콘솔",
  description: "내 API 키 조회, 실시간 토큰 사용 그래프, 충전 잔액을 실시간으로 투명하게 관리하세요.",
  alternates: { canonical: "/dashboard" },
  openGraph: {
    title: "클코클라우드 | 개발자 대시보드 콘솔",
    description: "내 API 키 조회, 실시간 토큰 사용 그래프, 충전 잔액을 실시간으로 투명하게 관리하세요.",
    images: ["/og-logo.jpg"]
  }
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getSessionFromCookies(cookies());
  if (!session) redirect(`/start?returnTo=${encodeURIComponent("/dashboard")}`);

  return (
    <div className="min-h-screen bg-cream text-primary">
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-cream/95 backdrop-blur-xl">
        <SiteHeaderShell variant="solid" />
      </header>
      {children}
    </div>
  );
}
