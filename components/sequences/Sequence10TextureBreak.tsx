"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CCAnimatedContent } from "@/components/reactbits-wrapped/CCAnimatedContent";
import { CCSplitText } from "@/components/reactbits-wrapped/CCSplitText";
import { EmptyState } from "@/components/ui/EmptyState";
import { splitMaskedName } from "@/lib/review-utils";

type PublicReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  masked_name: string;
  plan_code: string | null;
  featured?: boolean;
  helpful_count?: number;
  created_at: string;
};

type PublicReviewsResponse = {
  reviews: PublicReview[];
};

type StatsResponse = {
  stats: {
    total_reviews_approved: number;
    avg_rating: number | null;
    rating_distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
  };
};

const EMPTY_DIST = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } as const;

export function Sequence10TextureBreak() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [stats, setStats] = useState<StatsResponse["stats"] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/reviews/public", { cache: "no-store" })
        .then((r) => r.json() as Promise<PublicReviewsResponse>)
        .catch(() => ({ reviews: [] as PublicReview[] })),
      fetch("/api/reviews/stats", { cache: "no-store" })
        .then((r) => r.json() as Promise<StatsResponse>)
        .catch(
          () =>
            ({
              stats: {
                total_reviews_approved: 0,
                avg_rating: null,
                rating_distribution: EMPTY_DIST,
              },
            }) as StatsResponse
        ),
    ])
      .then(([reviewsRes, statsRes]) => {
        if (!active) return;
        setReviews(Array.isArray(reviewsRes.reviews) ? reviewsRes.reviews : []);
        setStats(statsRes.stats ?? null);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const loopedReviews = useMemo(() => {
    if (reviews.length === 0) return [];
    return [...reviews, ...reviews, ...reviews];
  }, [reviews]);

  const hasReviews = reviews.length > 0;
  const totalApproved = stats?.total_reviews_approved ?? 0;
  const avgRating = stats?.avg_rating ?? null;
  const distribution = stats?.rating_distribution ?? EMPTY_DIST;

  return (
    <section className="cc-section bg-[var(--cream-2)] py-[var(--section-y)] border-t border-[var(--line)]">
      <div className="cc-max relative z-[1]">
        <div className="grid gap-8 lg:grid-cols-[0.68fr_0.32fr] lg:items-start">
          <div>
            <p className="cc-eyebrow">Reviews</p>
            <h2 className="cc-display mt-5 max-w-3xl text-[var(--ink)]">
              <span className="block">
                <CCSplitText text="직접 사용해본" delay={0.02} />
              </span>
              <span className="block">
                <CCSplitText text="사람들이" delay={0.02} />
              </span>
              <span className="block">
                <span className="cc-underline-draw">다시 선택하는 이유</span>
                <span className="text-[var(--coral)]">.</span>
              </span>
            </h2>
          </div>
          <CCAnimatedContent
            className="border-l-2 border-[var(--coral)] pl-4 pt-0 text-[var(--fs-body)] leading-[var(--lh-body)] tracking-[var(--tracking-body)] text-[var(--ink-soft)] lg:max-w-[280px] lg:pt-20"
            distance={16}
            delay={0.5}
          >
            <p>
              잔액은 명확하게, 관리는 가볍게.
              <br />
              필요한 만큼 쓰고 안전하게 관리하세요.
            </p>
          </CCAnimatedContent>
        </div>

        {hasReviews ? (
          <div className="mt-10 grid gap-8 rounded-[28px] border border-[var(--line)] bg-cream/70 p-7 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-center lg:gap-12">
            <div className="flex items-end gap-4">
              <span className="text-[clamp(56px,8vw,84px)] font-[720] leading-none tracking-[-0.04em] text-[var(--ink)]">
                {avgRating != null ? avgRating.toFixed(1) : "—"}
              </span>
              <div className="pb-2">
                <span
                  className="block font-mono text-[14px] tracking-[0.18em] text-[var(--coral)]"
                  aria-label={`평균 별점 ${avgRating ?? 0}점`}
                >
                  {avgRating != null
                    ? "★".repeat(Math.round(avgRating)) +
                      "☆".repeat(5 - Math.round(avgRating))
                    : "☆☆☆☆☆"}
                </span>
                <p className="mt-1 text-xs font-semibold text-[var(--ink-soft)]">
                  실 구매자 {totalApproved.toLocaleString()}건 리뷰
                </p>
              </div>
            </div>
            <div className="grid gap-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count =
                  distribution[String(star) as "1" | "2" | "3" | "4" | "5"] ?? 0;
                const pct =
                  totalApproved > 0 ? Math.round((count / totalApproved) * 1000) / 10 : 0;
                return (
                  <div
                    key={star}
                    className="grid grid-cols-[44px_minmax(0,1fr)_72px] items-center gap-3 text-xs"
                  >
                    <span className="flex items-center gap-1 font-mono font-bold text-[var(--ink-soft)]">
                      <span className="text-[var(--coral)]" aria-hidden="true">
                        ★
                      </span>
                      {star}
                    </span>
                    <div
                      className="h-2.5 overflow-hidden rounded-full bg-[var(--line)]/40"
                      aria-hidden="true"
                    >
                      <div
                        className="h-full rounded-full bg-[var(--coral)] transition-[width] duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-right font-mono font-semibold text-[var(--ink-soft)] tabular-nums">
                      {count}
                      <span className="ml-1 text-[var(--ink-soft)]/60">·</span>
                      <span className="ml-1 text-[var(--ink-soft)]/60">{pct}%</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>

      {hasReviews ? (
        <>
          <div className="review-marquee-mask relative z-[1] mt-12 overflow-hidden">
            <div className="review-marquee-track flex w-max gap-5">
              {loopedReviews.map((review, index) => (
                <ReviewCard key={`${review.id}-${index}`} review={review} index={index} />
              ))}
            </div>
          </div>
          <div className="cc-max relative z-[1] mt-10 flex justify-center">
            <Link
              href="/reviews"
              className="group inline-flex items-center gap-2 rounded-full border border-[var(--coral)]/30 bg-[var(--coral)]/8 px-6 py-3 text-sm font-bold text-[var(--coral)] transition hover:bg-[var(--coral)] hover:text-cream"
            >
              전체 리뷰 보기
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </Link>
          </div>
        </>
      ) : (
        <CCAnimatedContent
          className="cc-max relative z-[1] mt-16"
          distance={24}
          duration={0.7}
          delay={0.6}
        >
          <EmptyState
            statusLabel="WAITING"
            headline="첫 리뷰를 기다리는 중입니다"
            description="서비스를 사용해보시고 첫 소중한 후기를 공유해 주세요."
            actionLabel="리뷰 남기기 →"
            onAction={() => window.open("/reviews", "_blank")}
          >
            <div className="animate-subtle-bob grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[rgba(217,119,87,0.10)] p-3 select-none">
              <BrandLogo size={48} type="icon" />
            </div>
          </EmptyState>
        </CCAnimatedContent>
      )}

      {!loaded ? <span className="sr-only">리뷰를 불러오는 중입니다.</span> : null}
    </section>
  );
}

function ReviewCard({ review, index }: { review: PublicReview; index: number }) {
  const name = splitMaskedName(review.masked_name);
  const [expanded, setExpanded] = useState(false);

  // Prefer the actual plan_code on the row; fall back to a deterministic
  // rotation so legacy rows still render a plan badge.
  const plans = ["STANDARD", "PRO", "ULTRA"];
  const plan = review.plan_code || plans[index % plans.length];

  return (
    <article className="group relative flex h-[290px] w-[min(82vw,410px)] shrink-0 flex-col justify-between overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[rgba(251,246,236,1)] p-7 text-[var(--ink)] shadow-[var(--shadow-md)] transition duration-200 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-[rgba(217,119,87,0.30)] hover:shadow-[var(--shadow-lg)]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[rgba(217,119,87,0.14)] blur-[58px] transition duration-300 group-hover:bg-[rgba(217,119,87,0.20)]" />

      <div className="relative flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[rgba(217,119,87,0.18)] bg-[rgba(217,119,87,0.08)]">
          <BrandLogo size={30} type="icon" />
        </span>

        <div className="flex flex-col items-end gap-1 font-mono">
          <span className="text-[12px] font-bold tracking-[0.18em] text-[var(--coral)]">
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
          </span>
          <span className="px-2 py-0.5 text-[9px] font-bold border border-[rgba(31,30,29,0.12)] rounded-full text-[var(--ink-soft)] bg-transparent uppercase tracking-wider scale-90 origin-right">
            {plan}
          </span>
        </div>
      </div>

      <div className="relative my-3">
        {review.title ? (
          <p className="mb-1 break-keep text-[14px] font-bold leading-tight text-[var(--ink)]">
            {review.title}
          </p>
        ) : null}
        <p
          className={`break-keep text-[15px] font-semibold leading-relaxed text-[var(--ink)] ${expanded ? "" : "line-clamp-2"}`}
        >
          “{review.body}”
        </p>
        {review.body.length > 55 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-1 text-[11px] font-semibold text-[var(--coral)] hover:text-[var(--coral-deep)] transition-colors relative inline-block"
          >
            <span className="relative">
              {expanded ? "접기 ←" : "더 보기 →"}
              <span className="absolute left-0 bottom-[-1px] w-full h-[0.5px] bg-current" />
            </span>
          </button>
        )}
      </div>

      <div className="relative flex items-center justify-between border-t border-[var(--line)] pt-4 mt-auto">
        <p className="font-semibold text-[var(--ink-soft)]">
          {name.visible}
          <span className="inline-block blur-[3px] select-none">{name.blurred || "…"}</span>
        </p>
        <span className="h-1.5 w-10 rounded-full bg-[var(--coral-soft)] shadow-[0_0_20px_rgba(217,119,87,.25)]" />
      </div>
    </article>
  );
}
