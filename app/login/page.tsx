import { AuthPanel } from "@/components/auth/AuthPanel";
import { sanitizeReturnTo } from "@/lib/auth-session";

type LoginPageProps = {
  searchParams?: { error?: string; returnTo?: string };
};

export default function LoginPage({ searchParams }: LoginPageProps) {
  return <AuthPanel mode="login" error={searchParams?.error} returnTo={sanitizeReturnTo(searchParams?.returnTo)} />;
}
