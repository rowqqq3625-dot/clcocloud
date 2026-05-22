import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { getSessionFromCookies } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "클로드 API 키 사용량조회",
  description: "클코클라우드 API 키 잔액 및 사용량을 실시간으로 확인합니다."
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = getSessionFromCookies(cookies());
  if (!session) redirect(`/start?returnTo=${encodeURIComponent("/dashboard")}`);

  return (
    <div className="min-h-screen bg-cream text-primary">
      <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-cream/95 backdrop-blur-xl">
        <SiteHeader variant="solid" />
      </header>
      {children}
    </div>
  );
}
