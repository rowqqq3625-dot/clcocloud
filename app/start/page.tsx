import { AuthPanel } from "@/components/auth/AuthPanel";
import { getSessionFromCookies, sanitizeReturnTo } from "@/lib/auth-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

type StartPageProps = {
  searchParams?: { error?: string; returnTo?: string };
};

export default function StartPage({ searchParams }: StartPageProps) {
  const returnTo = sanitizeReturnTo(searchParams?.returnTo);
  const session = getSessionFromCookies(cookies());

  if (session) redirect(returnTo || "/mypage");

  return <AuthPanel mode="signup" error={searchParams?.error} returnTo={returnTo} />;
}
