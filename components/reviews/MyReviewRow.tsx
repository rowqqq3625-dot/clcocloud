"use client";

import { useState } from "react";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { ReviewResubmitForm } from "@/components/reviews/ReviewResubmitForm";
import type { MyReview, ReviewStatus } from "@/lib/reviews/types";

type MyReviewRowProps = {
  review: MyReview;
  bodyMinLen: number;
  bodyMaxLen: number;
};

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "검토중",
  approved: "승인됨",
  rejected: "반려됨",
  hidden: "숨김",
};

const STATUS_CLASS: Record<ReviewStatus, string> = {
  pending: "bg-coral/10 text-coral",
  approved: "bg-[#5A8A6B]/10 text-[#5A8A6B]",
  rejected: "bg-secondary/15 text-secondary",
  hidden: "bg-primary/10 text-primary/70",
};

function formatKoreanDate(iso: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export function MyReviewRow({ review, bodyMinLen, bodyMaxLen }: MyReviewRowProps) {
  const [editing, setEditing] = useState(false);

  return (
    <article className="rounded-3xl border border-[var(--border-subtle)] bg-white/80 p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <StarDisplay rating={review.rating} size="md" />
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STATUS_CLASS[review.status]}`}
            >
              {STATUS_LABEL[review.status]}
            </span>
            {review.featured ? (
              <span className="rounded-full bg-coral/10 px-2.5 py-0.5 text-[11px] font-bold text-coral">
                추천 리뷰
              </span>
            ) : null}
          </div>
          {review.title ? (
            <h3 className="mt-3 text-lg font-[680] tracking-[-0.02em]">{review.title}</h3>
          ) : null}
        </div>
        <span className="font-mono text-xs text-secondary">
          {formatKoreanDate(review.created_at)}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-wrap break-keep text-sm leading-7 text-primary">
        {review.body}
      </p>

      {review.plan_code ? (
        <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--border-subtle)]/30 px-2.5 py-1 text-[11px] font-mono font-bold uppercase tracking-wider text-secondary">
          {review.plan_code}
        </p>
      ) : null}

      {review.status === "rejected" && review.rejected_reason ? (
        <div className="mt-5 rounded-2xl border border-coral/25 bg-coral/10 p-4">
          <p className="text-xs font-bold text-coral">반려 사유</p>
          <p className="mt-1 break-keep text-sm leading-7 text-coral/90">
            {review.rejected_reason}
          </p>
        </div>
      ) : null}

      {review.reward_granted ? (
        <div className="mt-5 rounded-2xl border border-[#5A8A6B]/25 bg-[#5A8A6B]/10 p-4">
          <p className="text-xs font-bold text-[#5A8A6B]">보상 지급 완료</p>
          <p className="mt-1 text-sm font-semibold text-[#5A8A6B]">
            ${Number(review.reward_amount_usd).toFixed(2)} ·{" "}
            {formatKoreanDate(review.reward_granted_at)}
          </p>
        </div>
      ) : null}

      {review.status === "rejected" ? (
        editing ? (
          <ReviewResubmitForm
            reviewId={review.id}
            initialRating={review.rating}
            initialTitle={review.title}
            initialBody={review.body}
            bodyMinLen={bodyMinLen}
            bodyMaxLen={bodyMaxLen}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-coral px-4 text-xs font-bold text-cream shadow-coral transition hover:-translate-y-0.5 hover:bg-coral-hi"
          >
            수정해서 다시 제출
          </button>
        )
      ) : null}
    </article>
  );
}
