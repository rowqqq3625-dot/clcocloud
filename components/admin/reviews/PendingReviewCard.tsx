"use client";

import { useState } from "react";
import { ReviewReviewModal } from "@/components/admin/reviews/ReviewReviewModal";
import type { AdminReview } from "@/lib/reviews/types";

/**
 * Single pending-review card on the operations dashboard. Clicking
 * "지금 검토하기" opens the shared ReviewReviewModal — the same modal
 * used from the list table — so the operator's review surface is
 * identical everywhere.
 */
export function PendingReviewCard({
  review,
  defaultRewardUsd,
}: {
  review: AdminReview;
  defaultRewardUsd: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <article className="flex items-start justify-between gap-4 rounded-2xl border border-cream/10 bg-[#15140F] p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[#D97757]" aria-label={`${review.rating}점`}>
              {"★".repeat(review.rating)}
              <span className="text-cream/20">{"★".repeat(5 - review.rating)}</span>
            </span>
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-amber-300">
              pending
            </span>
            {review.plan_code ? (
              <span className="rounded-full bg-cream/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-cream/70">
                {review.plan_code}
              </span>
            ) : null}
          </div>
          {review.title ? (
            <h3 className="mt-2 truncate text-sm font-bold text-cream">{review.title}</h3>
          ) : null}
          <p className="mt-1 line-clamp-2 text-xs leading-6 text-cream/70">{review.body}</p>
          <p className="mt-1.5 font-mono text-[10px] text-cream/40">
            {review.display_name} · {new Date(review.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:brightness-110"
        >
          지금 검토
        </button>
      </article>

      <ReviewReviewModal
        reviewId={open ? review.id : null}
        open={open}
        onClose={() => setOpen(false)}
        defaultRewardUsd={defaultRewardUsd}
      />
    </>
  );
}
