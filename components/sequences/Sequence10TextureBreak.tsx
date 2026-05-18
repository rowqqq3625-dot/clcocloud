"use client";

import { useEffect, useMemo, useState } from "react";
import { Quote } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CCAnimatedContent } from "@/components/reactbits-wrapped/CCAnimatedContent";
import { CCSplitText } from "@/components/reactbits-wrapped/CCSplitText";
import { CCSpotlightCard } from "@/components/reactbits-wrapped/CCSpotlightCard";
import { splitMaskedName } from "@/lib/review-utils";

type PublicReview = {
  id: string;
  rating: number;
  body: string;
  masked_name: string;
  created_at: string;
};

type PublicReviewsResponse = {
  reviews: PublicReview[];
};

export function Sequence10TextureBreak() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/reviews/public", { cache: "no-store" })
      .then((response) => response.json() as Promise<PublicReviewsResponse>)
      .then((data) => {
        if (active) setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      })
      .catch(() => {
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, []);

  const loopedReviews = useMemo(() => [...reviews, ...reviews], [reviews]);
  const hasReviews = reviews.length > 0;

  return (
    <section className="cc-section bg-[var(--cream-2)] py-[var(--section-y)]">
      <div className="cc-max relative z-[1]">
        <div className="grid gap-8 lg:grid-cols-[0.68fr_0.32fr] lg:items-start">
          <div>
            <p className="cc-eyebrow">Reviews</p>
            <h2 className="cc-display mt-5 max-w-3xl text-[var(--ink)]">
              <span className="block"><CCSplitText text="직접 사용해본" delay={0.02} /></span>
              <span className="block"><CCSplitText text="사람들이" delay={0.02} /></span>
              <span className="block"><span className="cc-underline-draw">다시 선택하는 이유</span><span className="text-[var(--coral)]">.</span></span>
            </h2>
          </div>
          <CCAnimatedContent className="border-l-2 border-[var(--coral)] pl-4 pt-0 text-[var(--fs-body)] leading-[var(--lh-body)] tracking-[var(--tracking-body)] text-[var(--ink-soft)] lg:max-w-[280px] lg:pt-20" distance={16} delay={0.5}>
            <p>
              잔액은 명확하게, 관리는 가볍게.<br />
              필요한 만큼 쓰고 안전하게 관리하세요.
            </p>
          </CCAnimatedContent>
        </div>
      </div>

      {hasReviews ? (
        <div className="review-marquee-mask relative z-[1] mt-16 overflow-hidden">
          <div className="review-marquee-track flex w-max gap-5">
            {loopedReviews.map((review, index) => <ReviewCard key={`${review.id}-${index}`} review={review} />)}
          </div>
        </div>
      ) : (
        <CCAnimatedContent className="cc-max relative z-[1] mt-16" distance={24} duration={0.7} delay={0.6}>
          <CCSpotlightCard as="div" radius={320} className="relative overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[rgba(251,246,236,1)] p-9 shadow-[var(--shadow-md)] transition duration-200 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-[rgba(217,119,87,0.30)] hover:shadow-[var(--shadow-lg)] sm:p-10">
            <Quote className="absolute left-8 top-6 h-8 w-8 text-[rgba(217,119,87,0.20)]" aria-hidden="true" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-mono text-[var(--fs-eyebrow)] font-bold uppercase tracking-[var(--tracking-eyebrow)] text-[var(--coral)]">First review</p>
                <h3 className="mt-4 text-[var(--fs-h2)] font-semibold leading-[var(--lh-h)] tracking-[var(--tracking-h)] text-[var(--ink)]">
                  첫 리뷰를 기다리는 중입니다.
                </h3>
              </div>
              <div className="cc-float grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[rgba(217,119,87,0.10)] p-3 transition duration-200 ease-[var(--ease-spring)] hover:scale-[1.08]">
                <BrandLogo size={48} />
              </div>
            </div>
          </CCSpotlightCard>
        </CCAnimatedContent>
      )}

      <div className="cc-max relative z-[1] mt-16 rounded-[var(--r-md)] border border-[rgba(217,119,87,0.18)] bg-[rgba(217,119,87,0.06)] px-5 py-3 text-[var(--fs-caption)] leading-[1.6] text-[var(--ink-soft)]">
        <span className="mr-2 font-semibold text-[var(--coral)]">ⓘ</span>본 서비스는 Anthropic 자사서비스가 아닙니다. 공식 클로드코드와 호환되는 별도 API 키 발급/잔액 관리 서비스입니다.
      </div>
      {!loaded ? <span className="sr-only">리뷰를 불러오는 중입니다.</span> : null}
    </section>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  const name = splitMaskedName(review.masked_name);

  return (
    <article className="group relative flex h-[270px] w-[min(82vw,410px)] shrink-0 flex-col justify-between overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[rgba(251,246,236,1)] p-7 text-[var(--ink)] shadow-[var(--shadow-md)] transition duration-200 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-[rgba(217,119,87,0.30)] hover:shadow-[var(--shadow-lg)]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[rgba(217,119,87,0.14)] blur-[58px] transition duration-300 group-hover:bg-[rgba(217,119,87,0.20)]" />
      <div className="relative flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[rgba(217,119,87,0.18)] bg-[rgba(217,119,87,0.08)]">
          <BrandLogo size={30} />
        </span>
        <span className="font-mono text-[12px] font-bold tracking-[0.18em] text-[var(--coral)]">
          {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
        </span>
      </div>

      <p className="relative break-keep text-[19px] font-semibold leading-8 tracking-[-0.02em] text-[var(--ink)]">
        “{review.body}”
      </p>

      <div className="relative flex items-center justify-between border-t border-[var(--line)] pt-5">
        <p className="font-semibold text-[var(--ink-soft)]">
          {name.visible}<span className="inline-block blur-[3px] select-none">{name.blurred || "…"}</span>
        </p>
        <span className="h-1.5 w-10 rounded-full bg-[var(--coral-soft)] shadow-[0_0_20px_rgba(217,119,87,.25)]" />
      </div>
    </article>
  );
}
