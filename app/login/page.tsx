import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { sanitizeReturnTo } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "클코클라우드 | 로그인 및 접속",
  description: "소셜 로그인을 통해 몇 초 만에 안전하고 빠르게 대시보드 콘솔에 접속해 보세요.",
  alternates: { canonical: "/login" },
  openGraph: {
    title: "클코클라우드 | 로그인 및 접속",
    description: "소셜 로그인을 통해 몇 초 만에 안전하고 빠르게 대시보드 콘솔에 접속해 보세요.",
    images: ["/og-logo.jpg"]
  }
};

type LoginPageProps = {
  searchParams?: { error?: string; returnTo?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <AuthPanel mode="login" error={searchParams?.error} returnTo={sanitizeReturnTo(searchParams?.returnTo)} />;
}
