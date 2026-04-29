import { AuthPanel } from "@/components/auth/AuthPanel";
import { sanitizeReturnTo } from "@/lib/auth-session";

type StartPageProps = {
  searchParams?: { error?: string; returnTo?: string };
};

export default function StartPage({ searchParams }: StartPageProps) {
  return <AuthPanel mode="signup" error={searchParams?.error} returnTo={sanitizeReturnTo(searchParams?.returnTo)} />;
}
