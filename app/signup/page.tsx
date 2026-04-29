import { AuthPanel } from "@/components/auth/AuthPanel";
import { sanitizeReturnTo } from "@/lib/auth-session";

type SignupPageProps = {
  searchParams?: { error?: string; returnTo?: string };
};

export default function SignupPage({ searchParams }: SignupPageProps) {
  return <AuthPanel mode="signup" error={searchParams?.error} returnTo={sanitizeReturnTo(searchParams?.returnTo)} />;
}
