import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { getSessionFromCookies } from "@/lib/auth-session";
import { getPricingPlan } from "@/lib/pricing";

type CheckoutPageProps = {
  searchParams?: { plan?: string };
};

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const plan = getPricingPlan(searchParams?.plan);
  const session = getSessionFromCookies(cookies());
  if (!session) redirect(`/start?returnTo=${encodeURIComponent(`/checkout?plan=${plan.id}`)}`);

  return (
    <main className="auth-page-shell noise relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-12">
      <div className="pointer-events-none absolute -right-36 top-20 h-[560px] w-[560px] rounded-full bg-coral/20 blur-[180px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/70 blur-[220px]" />
      <section className="container-cinematic relative z-[1]">
        <header className="flex items-center justify-between gap-4 py-4">
          <a href="/" className="flex items-center gap-3 text-lg font-bold tracking-[-0.01em]">
            <BrandLogo size={34} />
            클코클라우드
          </a>
          <a href="/#pricing" className="rounded-full border border-[var(--border-subtle)] bg-cream px-4 py-2 text-sm font-bold text-secondary transition hover:border-coral/50 hover:text-coral">가격으로 돌아가기</a>
        </header>
        <div className="py-10 sm:py-14">
          <CheckoutFlow plan={plan} defaultEmail={session.email || ""} />
        </div>
      </section>
    </main>
  );
}
