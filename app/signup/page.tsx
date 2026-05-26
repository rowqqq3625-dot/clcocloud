import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { sanitizeReturnTo } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "클코클라우드 | 회원가입",
  description: "클코클라우드 계정을 만들고 끊김 없는 공식 클로드코드 API 연동을 시작해 보세요.",
  alternates: { canonical: "/signup" },
  openGraph: {
    title: "클코클라우드 | 회원가입",
    description: "클코클라우드 계정을 만들고 끊김 없는 공식 클로드코드 API 연동을 시작해 보세요.",
    images: ["/og-logo.jpg"]
  }
};

type SignupPageProps = {
  searchParams?: { error?: string; returnTo?: string };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  return <AuthPanel mode="signup" error={searchParams?.error} returnTo={sanitizeReturnTo(searchParams?.returnTo)} />;
}
