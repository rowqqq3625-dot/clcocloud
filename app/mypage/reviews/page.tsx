import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { MyReviewRow } from "@/components/reviews/MyReviewRow";
import { getSessionFromCookies } from "@/lib/auth-session";
import { getReviewConfig } from "@/lib/reviews/config";
import { getUserReviews } from "@/lib/reviews/queries";
import { getEligibleOrders } from "@/lib/reviews/eligibility";
import { getUserCreditBalance, getUserCreditHistory } from "@/lib/reviews/reward";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "내 리뷰 | 클코클라우드",
  description: "내가 작성한 리뷰의 검토 상태와 보상 지급 내역을 확인할 수 있습니다.",
};

function formatKrw(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatKoreanDateTime(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default async function MyReviewsPage() {
  const session = getSessionFromCookies(cookies());
  if (!session) redirect(`/start?returnTo=${encodeURIComponent("/mypage/reviews")}`);

  const identity = {
    provider: session.provider,
    providerAccountId: session.providerAccountId,
  };
  const config = getReviewConfig();

  const [reviews, eligibleOrders, balance, history] = await Promise.all([
    getUserReviews(identity),
    getEligibleOrders(identity),
    getUserCreditBalance(identity),
    getUserCreditHistory(identity, 12),
  ]);

  const writable = eligibleOrders.filter((o) => o.is_eligible);

  return (
    <main className="reviews-shell relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-10">
      <div className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-coral/10 blur-[190px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/60 blur-[220px]" />
      <SiteHeader variant="floating" />

      <section className="container-cinematic relative z-[1] py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral/80">
              My Reviews
            </p>
            <h1 className="mt-3 text-[clamp(36px,5vw,60px)] font-[680] leading-[1.04] tracking-[-0.045em]">
              내가 작성한 리뷰
            </h1>
            <p className="mt-3 break-keep text-[15px] leading-7 text-secondary">
              검토 상태와 보상 지급 내역을 한 곳에서 확인하세요. 반려된 리뷰는 수정 후 다시 제출할 수 있어요.
            </p>
          </div>
          <Link
            href="/mypage"
            className="inline-flex min-h-11 items-center rounded-2xl border border-[var(--border-subtle)] bg-cream px-4 text-xs font-bold text-secondary transition hover:border-coral/50 hover:text-coral"
          >
            ← 마이페이지
          </Link>
        </div>

        {writable.length > 0 ? (
          <section className="mt-7 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-coral/30 bg-coral/10 px-5 py-4">
            <div>
              <p className="text-sm font-bold text-coral">
                리뷰 작성 가능한 주문 {writable.length}건
              </p>
              <p className="mt-1 text-xs text-coral/80">
                결제 + {config.eligibilityAfterDays}일 경과 + 키 발급을 모두 충족한 주문입니다. 작성하면 검토 후 ${config.rewardUsd} 보상이 자동 지급돼요.
              </p>
            </div>
            <Link
              href="/reviews/new"
              className="inline-flex min-h-11 items-center rounded-2xl bg-coral px-4 text-xs font-bold text-cream shadow-coral transition hover:-translate-y-0.5 hover:bg-coral-hi"
            >
              지금 작성하기
            </Link>
          </section>
        ) : null}

        <section className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,.66fr)_minmax(0,.34fr)]">
          <div className="grid gap-4">
            {reviews.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--border-subtle)] bg-cream/60 px-6 py-16 text-center">
                <p className="text-lg font-bold">아직 작성한 리뷰가 없어요.</p>
                <p className="mt-2 text-sm text-secondary">
                  결제하신 주문이 있다면 리뷰를 남기고 ${config.rewardUsd} 보상을 받아보세요.
                </p>
                <Link
                  href="/reviews/new"
                  className="mt-6 inline-flex min-h-12 items-center rounded-2xl bg-coral px-5 text-sm font-bold text-cream shadow-coral transition hover:-translate-y-0.5 hover:bg-coral-hi"
                >
                  리뷰 작성 페이지로
                </Link>
              </div>
            ) : (
              reviews.map((review) => (
                <MyReviewRow
                  key={review.id}
                  review={review}
                  bodyMinLen={config.bodyMinLen}
                  bodyMaxLen={config.bodyMaxLen}
                />
              ))
            )}
          </div>

          <aside className="grid gap-4">
            <section className="rounded-3xl border border-[var(--border-subtle)] bg-cream/85 p-6 shadow-sm">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-coral/80">
                Credit Balance
              </p>
              <h2 className="mt-2 text-3xl font-[680] tracking-[-0.03em]">
                ${balance.balance_usd.toFixed(2)}
              </h2>
              <p className="mt-1 text-xs text-secondary">
                ≈ ₩{formatKrw(balance.balance_krw)}
                {balance.last_credit_at
                  ? ` · 최근 ${formatKoreanDateTime(balance.last_credit_at)}`
                  : ""}
              </p>
              <p className="mt-3 text-xs leading-6 text-secondary/70">
                리뷰 승인, 충전, 환불 등 모든 보상은 이 잔액에 즉시 반영됩니다.
              </p>
            </section>

            <section className="rounded-3xl border border-[var(--border-subtle)] bg-cream/85 p-6 shadow-sm">
              <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
                보상 지급 내역
              </p>
              {history.length === 0 ? (
                <p className="mt-4 text-xs text-secondary/70">아직 지급 내역이 없습니다.</p>
              ) : (
                <ul className="mt-4 grid gap-2">
                  {history.map((row) => {
                    const positive = Number(row.amount_usd) >= 0;
                    return (
                      <li
                        key={row.id}
                        className="rounded-2xl border border-[var(--border-subtle)]/70 bg-white/60 px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-secondary">{row.source}</span>
                          <span
                            className={`font-mono text-sm font-bold ${positive ? "text-[#5A8A6B]" : "text-coral"}`}
                          >
                            {positive ? "+" : ""}${Number(row.amount_usd).toFixed(2)}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-secondary/70">
                          {formatKoreanDateTime(row.created_at)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </aside>
        </section>
      </section>
    </main>
  );
}
