import Link from "next/link";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { splitMaskedName } from "@/lib/review-utils";
import type { PublicReview } from "@/lib/reviews/types";

type ReviewCardProps = {
  review: PublicReview;
  href?: string;
  variant?: "default" | "compact";
};

function formatKoreanDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(d);
}

/**
 * Public-facing review card. Used in /reviews grid, landing-page
 * slider, and the case-study cross-link surfaces. Title is optional —
 * when absent, body becomes the headline (2-line clamp).
 */
export function ReviewCard({ review, href, variant = "default" }: ReviewCardProps) {
  const { visible, blurred } = splitMaskedName(review.masked_name);
  const detailHref = href || `/reviews/${review.id}`;

  return (
    <Link
      href={detailHref}
      className={`group block rounded-3xl border border-[var(--border-subtle)] bg-cream/85 p-6 shadow-[0_18px_60px_rgba(31,30,29,.06)] backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-coral/35 hover:shadow-[0_24px_80px_rgba(31,30,29,.10)] ${
        variant === "compact" ? "p-5" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <StarDisplay rating={review.rating} size={variant === "compact" ? "sm" : "md"} />
        {review.featured ? (
          <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-coral">
            추천
          </span>
        ) : null}
      </div>

      {review.title ? (
        <h3 className="mt-4 line-clamp-2 break-keep text-[18px] font-[680] leading-tight tracking-[-0.02em] text-primary">
          {review.title}
        </h3>
      ) : null}

      <p
        className={`mt-3 break-keep text-[14.5px] leading-7 text-secondary ${
          review.title ? "line-clamp-3" : "line-clamp-4"
        }`}
      >
        {review.body}
      </p>

      <div className="mt-5 flex items-center justify-between text-xs text-secondary">
        <span className="font-semibold">
          <span>{visible}</span>
          <span className="text-secondary/60">{blurred}</span>
        </span>
        <div className="flex items-center gap-3">
          {review.plan_code ? (
            <span className="rounded-full bg-[var(--border-subtle)]/30 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-secondary">
              {review.plan_code}
            </span>
          ) : null}
          <span className="font-mono">{formatKoreanDate(review.created_at)}</span>
        </div>
      </div>

      {review.helpful_count > 0 ? (
        <p className="mt-3 text-xs text-secondary/70">도움돼요 {review.helpful_count}</p>
      ) : null}
    </Link>
  );
}
