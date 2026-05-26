import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { getSessionFromCookies, sanitizeReturnTo } from "@/lib/auth-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "클코클라우드 | 첫 시작 가이드",
  description: "API 키 충전 발급부터 터미널 CLI 환경 셋업까지, 개발 효율 극대화를 위한 로드맵.",
  alternates: { canonical: "/start" },
  openGraph: {
    title: "클코클라우드 | 첫 시작 가이드",
    description: "API 키 충전 발급부터 터미널 CLI 환경 셋업까지, 개발 효율 극대화를 위한 로드맵.",
    images: ["/og-logo.jpg"]
  }
};

type StartPageProps = {
  searchParams?: { error?: string; returnTo?: string };
};

export default function StartPage({ searchParams }: StartPageProps) {
  const returnTo = sanitizeReturnTo(searchParams?.returnTo);
  const session = getSessionFromCookies(cookies());

  if (session) redirect(returnTo || "/mypage");

  return <AuthPanel mode="signup" error={searchParams?.error} returnTo={returnTo} />;
}
