import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { EligibleOrderPicker } from "@/components/reviews/EligibleOrderPicker";
import { getEligibleOrders } from "@/lib/reviews/eligibility";
import { getReviewConfig } from "@/lib/reviews/config";
import { getSessionFromCookies } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "리뷰 작성 | 클코클라우드",
  description: "실제 구매한 주문에 대해 별점·후기를 남기고 $50 API 잔액 보상을 받으세요.",
};

type SearchParams = { orderId?: string };

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const session = getSessionFromCookies(cookies());
  if (!session) {
    const back = searchParams?.orderId
      ? `/reviews/new?orderId=${encodeURIComponent(searchParams.orderId)}`
      : "/reviews/new";
    redirect(`/start?returnTo=${encodeURIComponent(back)}`);
  }

  const config = getReviewConfig();
  const orders = await getEligibleOrders({
    provider: session.provider,
    providerAccountId: session.providerAccountId,
  });

  const defaultName = session.name || session.email?.split("@")[0] || "사용자";

  return (
    <main className="reviews-shell relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-10">
      <div className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-coral/16 blur-[190px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/70 blur-[220px]" />
      <SiteHeader variant="floating" />

      <section className="container-cinematic relative z-[1] max-w-6xl py-12">
        <div className="mb-7">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral/80">
            New Review
          </p>
          <h1 className="mt-3 text-[clamp(34px,4.6vw,54px)] font-[680] leading-[1.05] tracking-[-0.04em]">
            결제하신 주문에 대해 후기를 남겨주세요.
          </h1>
          <p className="mt-4 max-w-2xl break-keep text-[15px] leading-7 text-secondary">
            결제 + 키 발급 + {config.eligibilityAfterDays}일 경과 조건을 모두 만족한 주문이 작성 가능 상태로 표시됩니다.
            승인 시 ${config.rewardUsd} API 잔액이 자동 지급됩니다.
          </p>
        </div>

        <EligibleOrderPicker
          orders={orders}
          initialOrderId={searchParams?.orderId || null}
          defaultName={defaultName}
          config={{
            eligibility_after_days: config.eligibilityAfterDays,
            body_min_len: config.bodyMinLen,
            body_max_len: config.bodyMaxLen,
            reward_usd: config.rewardUsd,
            reward_krw: config.rewardKrw,
          }}
        />
      </section>
    </main>
  );
}
