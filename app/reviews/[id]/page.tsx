import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { HelpfulButton } from "@/components/reviews/HelpfulButton";
import { getSessionFromCookies } from "@/lib/auth-session";
import { getReviewById, hasUserVotedHelpful } from "@/lib/reviews/queries";
import { splitMaskedName } from "@/lib/review-utils";

export const dynamic = "force-dynamic";

type RouteProps = { params: { id: string } };

export async function generateMetadata({ params }: RouteProps): Promise<Metadata> {
  const review = await getReviewById(params.id);
  if (!review) return { title: "리뷰" };
  const title = review.title || `${review.rating}점 리뷰`;
  return {
    title: `${title} | 클코클라우드 리뷰`,
    description: review.body.slice(0, 140),
    alternates: { canonical: `/reviews/${params.id}` },
    openGraph: {
      title,
      description: review.body.slice(0, 140),
    },
  };
}

function formatKoreanDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(d);
}

export default async function ReviewDetailPage({ params }: RouteProps) {
  const review = await getReviewById(params.id);
  if (!review) notFound();

  const session = getSessionFromCookies(cookies());
  const voted = session
    ? await hasUserVotedHelpful(params.id, {
        provider: session.provider,
        providerAccountId: session.providerAccountId,
      })
    : false;

  const { visible, blurred } = splitMaskedName(review.masked_name);

  return (
    <main className="reviews-shell relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-10">
      <div className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-coral/10 blur-[190px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/60 blur-[220px]" />
      <SiteHeader variant="floating" />

      <section className="container-cinematic relative z-[1] max-w-3xl py-12">
        <Link
          href="/reviews"
          className="inline-flex items-center gap-2 text-sm font-bold text-secondary transition hover:text-coral"
        >
          ← 전체 리뷰
        </Link>

        <article className="mt-6 rounded-[34px] border border-[var(--border-subtle)] bg-cream/90 p-7 shadow-[0_24px_80px_rgba(31,30,29,.10)] sm:p-10">
          <div className="flex items-center justify-between gap-3">
            <StarDisplay rating={review.rating} size="lg" />
            <span className="inline-flex items-center gap-2 rounded-full bg-coral/10 px-3 py-1 text-[11px] font-bold text-coral">
              <span aria-hidden="true">✓</span>
              실제 구매자 작성
            </span>
          </div>

          {review.title ? (
            <h1 className="mt-6 break-keep text-[clamp(28px,4vw,44px)] font-[680] leading-[1.1] tracking-[-0.035em]">
              {review.title}
            </h1>
          ) : null}

          <div className="mt-6 whitespace-pre-wrap break-keep text-[16px] leading-8 text-primary">
            {review.body}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border-subtle)] pt-6 text-xs text-secondary">
            <div>
              <span className="font-semibold">
                <span>{visible}</span>
                <span className="text-secondary/60">{blurred}</span>
              </span>
              <span className="mx-2 text-secondary/40">·</span>
              <span className="font-mono">{formatKoreanDate(review.created_at)}</span>
              {review.plan_code ? (
                <>
                  <span className="mx-2 text-secondary/40">·</span>
                  <span className="rounded-full bg-[var(--border-subtle)]/30 px-2 py-0.5 font-mono font-bold uppercase tracking-wider">
                    {review.plan_code}
                  </span>
                </>
              ) : null}
            </div>
            <HelpfulButton
              reviewId={review.id}
              initialVoted={voted}
              initialCount={review.helpful_count}
              authenticated={Boolean(session)}
            />
          </div>
        </article>

        <p className="mt-6 text-center text-xs text-secondary">
          이 리뷰는 결제 + API 키 발급 + 운영자 승인 단계를 모두 통과했습니다.
        </p>
      </section>
    </main>
  );
}
