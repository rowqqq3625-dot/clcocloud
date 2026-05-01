"use client";

import { useEffect, useMemo, useState } from "react";
import { BrandLogo } from "@/components/ui/BrandLogo";
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
    <section className="relative overflow-hidden bg-cream-2 py-24 sm:py-28">
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-coral/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-peach/70 blur-[110px]" />

      <div className="container-cinematic relative z-[1]">
        <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow">Reviews</p>
            <h2 className="section-display mt-5 max-w-3xl text-[clamp(42px,5.8vw,82px)] font-semibold tracking-[-0.04em]">
              직접 사용해본 사람들이<br className="hidden sm:block" />
              다시 선택하는 이유.
            </h2>
          </div>
          <p className="max-w-[460px] break-keep text-[17px] leading-8 text-secondary">
            잔액은 명확하게, 관리는 가볍게.<br />
            필요한 만큼 쓰고 안전하게 관리하세요.
          </p>
        </div>
      </div>

      {hasReviews ? (
        <div className="review-marquee-mask relative z-[1] mt-16 overflow-hidden">
          <div className="review-marquee-track flex w-max gap-5">
            {loopedReviews.map((review, index) => <ReviewCard key={`${review.id}-${index}`} review={review} />)}
          </div>
        </div>
      ) : (
        <div className="container-cinematic relative z-[1] mt-16">
          <div className="relative overflow-hidden rounded-[34px] border border-[var(--border-subtle)] bg-cream p-8 shadow-[0_26px_80px_rgba(31,30,29,.08)] sm:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-coral/12 blur-[86px]" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral/80">First review</p>
                <h3 className="mt-4 text-[clamp(30px,4vw,52px)] font-[680] leading-[1.08] tracking-[-0.04em]">
                  첫 리뷰를 기다리는 중입니다.
                </h3>
              </div>
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-[28px] border border-coral/20 bg-coral/10">
                <BrandLogo size={48} />
              </div>
            </div>
          </div>
        </div>
      )}

      {!loaded ? <span className="sr-only">리뷰를 불러오는 중입니다.</span> : null}
    </section>
  );
}

function ReviewCard({ review }: { review: PublicReview }) {
  const name = splitMaskedName(review.masked_name);

  return (
    <article className="group relative flex h-[270px] w-[min(82vw,410px)] shrink-0 flex-col justify-between overflow-hidden rounded-[30px] border border-cream/10 bg-dark p-7 text-cream shadow-[0_30px_90px_rgba(15,14,13,.22)] transition duration-300 hover:-translate-y-1 hover:border-coral/45">
      <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-coral/24 blur-[58px] transition duration-300 group-hover:bg-coral/32" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,rgba(217,119,87,.20),transparent)]" />
      <div className="relative flex items-center justify-between">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-cream/10 bg-cream/[.08] shadow-[inset_0_1px_rgba(255,255,255,.08)]">
          <BrandLogo size={30} />
        </span>
        <span className="font-mono text-[12px] font-bold tracking-[0.18em] text-coral-hi">
          {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
        </span>
      </div>

      <p className="relative break-keep text-[19px] font-semibold leading-8 tracking-[-0.02em] text-cream/92">
        “{review.body}”
      </p>

      <div className="relative flex items-center justify-between border-t border-cream/10 pt-5">
        <p className="font-semibold text-cream/68">
          {name.visible}<span className="inline-block blur-[3px] select-none">{name.blurred || "…"}</span>
        </p>
        <span className="h-1.5 w-10 rounded-full bg-coral-hi/80 shadow-[0_0_20px_rgba(232,144,114,.45)]" />
      </div>
    </article>
  );
}
