import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { getSessionFromCookies } from "@/lib/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

type ReviewPageProps = {
  params: { orderId: string };
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const session = getSessionFromCookies(cookies());
  if (!session) redirect(`/start?returnTo=${encodeURIComponent(`/reviews/${params.orderId}`)}`);

  const supabase = getSupabaseAdminClient();
  let state: "config" | "not-found" | "not-issued" | "duplicate" | "ready" = "config";

  if (supabase) {
    const { data: order } = await supabase
      .from("orders")
      .select("id,status")
      .eq("id", params.orderId)
      .eq("user_provider", session.provider)
      .eq("user_provider_account_id", session.providerAccountId)
      .maybeSingle();

    if (!order) {
      state = "not-found";
    } else if (order.status !== "issued") {
      state = "not-issued";
    } else {
      const { data: review } = await supabase.from("reviews").select("id").eq("order_id", params.orderId).maybeSingle();
      state = review ? "duplicate" : "ready";
    }
  }

  const defaultName = session.name || session.email?.split("@")[0] || "사용자";

  return (
    <main className="auth-page-shell noise relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-10">
      <div className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-coral/16 blur-[190px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/70 blur-[220px]" />
      <SiteHeader variant="floating" />
      <section className="container-cinematic relative z-[1] max-w-3xl py-12">
        {state === "ready" ? <ReviewForm orderId={params.orderId} defaultName={defaultName} /> : <ReviewBlocked state={state} />}
      </section>
    </main>
  );
}

function ReviewBlocked({ state }: { state: "config" | "not-found" | "not-issued" | "duplicate" }) {
  const messages = {
    config: "리뷰 저장소 설정이 필요합니다.",
    "not-found": "확인 가능한 주문이 없습니다.",
    "not-issued": "API 키 발급 완료 후 리뷰를 작성할 수 있습니다.",
    duplicate: "이미 이 주문의 리뷰가 접수되었습니다."
  };

  return (
    <section className="rounded-[34px] border border-[var(--border-subtle)] bg-cream/90 p-8 text-center shadow-[0_24px_80px_rgba(31,30,29,.10)]">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral/80">Review</p>
      <h1 className="mt-5 text-[clamp(36px,5vw,62px)] font-[680] leading-[1.05] tracking-[-0.045em]">{messages[state]}</h1>
      <a href="/mypage" className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-primary px-5 text-sm font-bold text-cream transition hover:bg-coral">
        마이페이지로 돌아가기
      </a>
    </section>
  );
}
