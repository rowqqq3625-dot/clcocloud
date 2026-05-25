"use client";

import { useEffect, useMemo, useState } from "react";
import { Quote } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { CCAnimatedContent } from "@/components/reactbits-wrapped/CCAnimatedContent";
import { CCSplitText } from "@/components/reactbits-wrapped/CCSplitText";
import { EmptyState } from "@/components/ui/EmptyState";
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

  const loopedReviews = useMemo(() => {
    if (reviews.length === 0) return [];
    // 무한 롤링을 위해 3배 이상 복제
    return [...reviews, ...reviews, ...reviews];
  }, [reviews]);

  const hasReviews = reviews.length > 0;

  return (
    <section className="cc-section bg-[var(--cream-2)] py-[var(--section-y)] border-t border-[var(--line)]">
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
            {loopedReviews.map((review, index) => (
              <ReviewCard key={`${review.id}-${index}`} review={review} index={index} />
            ))}
          </div>
        </div>
      ) : (
        <CCAnimatedContent className="cc-max relative z-[1] mt-16" distance={24} duration={0.7} delay={0.6}>
          <EmptyState
            statusLabel="WAITING"
            headline="첫 리뷰를 기다리는 중입니다"
            description="서비스를 사용해보시고 첫 소중한 후기를 공유해 주세요."
            actionLabel="리뷰 남기기 →"
            onAction={() => window.open("/reviews", "_blank")}
          >
            {/* Mascot with 5s bob motion */}
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

  // 임의의 플랜 배지 (STANDARD / PRO / ULTRA)
  const plans = ["STANDARD", "PRO", "ULTRA"];
  const plan = plans[index % plans.length];

  return (
    <article className="group relative flex h-[290px] w-[min(82vw,410px)] shrink-0 flex-col justify-between overflow-hidden rounded-[var(--r-xl)] border border-[var(--line)] bg-[rgba(251,246,236,1)] p-7 text-[var(--ink)] shadow-[var(--shadow-md)] transition duration-200 ease-[var(--ease-out)] hover:-translate-y-1 hover:border-[rgba(217,119,87,0.30)] hover:shadow-[var(--shadow-lg)]">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[rgba(217,119,87,0.14)] blur-[58px] transition duration-300 group-hover:bg-[rgba(217,119,87,0.20)]" />
      
      <div className="relative flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[rgba(217,119,87,0.18)] bg-[rgba(217,119,87,0.08)]">
          <BrandLogo size={30} type="icon" />
        </span>
        
        {/* Rating & Plan Badge */}
        <div className="flex flex-col items-end gap-1 font-mono">
          <span className="text-[12px] font-bold tracking-[0.18em] text-[var(--coral)]">
            {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
          </span>
          <span className="px-2 py-0.5 text-[9px] font-bold border border-[rgba(31,30,29,0.12)] rounded-full text-[var(--ink-soft)] bg-transparent uppercase tracking-wider scale-90 origin-right">
            {plan}
          </span>
        </div>
      </div>

      <div className="relative my-3">
        <p className={`break-keep text-[16px] font-semibold leading-relaxed text-[var(--ink)] ${expanded ? "" : "line-clamp-2"}`}>
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
          {name.visible}<span className="inline-block blur-[3px] select-none">{name.blurred || "…"}</span>
        </p>
        <span className="h-1.5 w-10 rounded-full bg-[var(--coral-soft)] shadow-[0_0_20px_rgba(217,119,87,.25)]" />
      </div>
    </article>
  );
}
