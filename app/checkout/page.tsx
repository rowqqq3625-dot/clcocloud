import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { SiteHeaderShell } from "@/components/navigation/SiteHeaderShell";
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
    <main data-nosnippet className="auth-page-shell noise relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-12">
      <div className="pointer-events-none absolute -right-36 top-20 h-[560px] w-[560px] rounded-full bg-coral/20 blur-[180px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/70 blur-[220px]" />
      <SiteHeaderShell variant="floating" />
      <section className="container-cinematic relative z-[1]">
        <div className="py-10 sm:py-14">
          <CheckoutFlow plan={plan} defaultEmail={session.email || ""} />
        </div>
      </section>
    </main>
  );
}
