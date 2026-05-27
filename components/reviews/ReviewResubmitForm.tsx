"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "@/components/reviews/StarRating";

type Props = {
  reviewId: string;
  initialRating: number;
  initialTitle: string | null;
  initialBody: string;
  bodyMinLen: number;
  bodyMaxLen: number;
  onCancel?: () => void;
};

/**
 * Inline edit form for /mypage/reviews. Shown when the user clicks
 * "수정해서 다시 제출" on a rejected review. PATCHes /api/reviews/:id
 * and refreshes the page on success so the new pending state shows.
 */
export function ReviewResubmitForm({
  reviewId,
  initialRating,
  initialTitle,
  initialBody,
  bodyMinLen,
  bodyMaxLen,
  onCancel,
}: Props) {
  const router = useRouter();
  const [rating, setRating] = useState(initialRating);
  const [title, setTitle] = useState(initialTitle || "");
  const [body, setBody] = useState(initialBody);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedBody = body.trim();
  const canSubmit =
    !submitting &&
    rating >= 1 &&
    rating <= 5 &&
    trimmedBody.length >= bodyMinLen &&
    trimmedBody.length <= bodyMaxLen;

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          title: title.trim() || null,
          body: trimmedBody,
        }),
      });
      if (response.ok) {
        router.refresh();
        onCancel?.();
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error || "rpc_failed");
    } catch {
      setError("network_error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-coral/30 bg-coral/5 p-5">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-coral/80">
        수정 후 재제출
      </p>

      <div className="mt-4 grid gap-4">
        <div>
          <p className="text-xs font-bold text-secondary">별점</p>
          <div className="mt-2">
            <StarRating value={rating} onChange={setRating} disabled={submitting} />
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-bold text-secondary">제목 (선택)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            maxLength={50}
            className="mt-2 h-12 w-full rounded-xl border border-[var(--border-subtle)] bg-white px-3 text-sm font-semibold outline-none focus:border-coral disabled:opacity-60"
          />
        </label>

        <label className="block">
          <span className="text-xs font-bold text-secondary">
            본문 ({bodyMinLen}~{bodyMaxLen}자)
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={submitting}
            maxLength={bodyMaxLen}
            className="mt-2 min-h-32 w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-white px-3 py-3 text-sm font-semibold leading-7 outline-none focus:border-coral disabled:opacity-60"
          />
          <span
            className={`mt-1 block text-right text-[11px] font-mono ${
              trimmedBody.length >= bodyMinLen ? "text-secondary/70" : "text-coral"
            }`}
          >
            {trimmedBody.length} / {bodyMaxLen}
          </span>
        </label>

        {error ? (
          <p className="rounded-xl border border-coral/30 bg-coral/10 px-3 py-2 text-xs font-bold text-coral">
            {error === "review_not_rejected"
              ? "이 리뷰는 더 이상 수정할 수 없는 상태입니다."
              : error === "network_error"
                ? "네트워크 오류로 저장하지 못했습니다."
                : "다시 제출하지 못했습니다. 잠시 후 다시 시도하세요."}
          </p>
        ) : null}

        <div className="flex justify-end gap-2">
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-xs font-bold text-secondary transition hover:text-primary disabled:opacity-60"
            >
              취소
            </button>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-xl bg-coral px-5 py-2 text-xs font-bold text-cream shadow-coral transition hover:bg-coral-hi disabled:cursor-not-allowed disabled:bg-secondary/30 disabled:shadow-none"
          >
            {submitting ? "저장 중…" : "다시 제출"}
          </button>
        </div>
      </div>
    </div>
  );
}
