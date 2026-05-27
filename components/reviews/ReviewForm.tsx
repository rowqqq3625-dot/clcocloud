"use client";

import { useMemo, useState } from "react";
import { StarRating } from "@/components/reviews/StarRating";

type ReviewFormConfig = {
  body_min_len: number;
  body_max_len: number;
  reward_usd: number;
  reward_krw: number;
};

type ReviewFormProps = {
  orderId: string;
  defaultName: string;
  config?: ReviewFormConfig;
};

const DEFAULT_CONFIG: ReviewFormConfig = {
  body_min_len: 20,
  body_max_len: 1000,
  reward_usd: 50,
  reward_krw: 70_000,
};

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: "로그인이 필요합니다.",
  invalid_review: "입력값을 다시 확인해주세요.",
  rating_invalid: "별점을 다시 선택해주세요.",
  body_length_invalid: "본문 길이가 허용 범위를 벗어났습니다.",
  title_too_long: "제목이 너무 깁니다.",
  order_not_found: "주문 정보를 찾을 수 없습니다.",
  order_not_paid: "결제 완료된 주문에서만 작성할 수 있습니다.",
  cooldown_not_passed: "결제 후 일정 기간이 지나야 작성할 수 있습니다.",
  review_already_exists: "이미 이 주문의 리뷰가 작성되어 있습니다.",
  supabase_not_configured: "리뷰 저장소 설정이 필요합니다.",
  rpc_failed: "잠시 후 다시 시도해주세요.",
};

/**
 * Review composer for /reviews/new. The form binds to a single
 * eligible order chosen by the parent `EligibleOrderPicker`. Body
 * bounds and reward amounts come from server-rendered config (the
 * live REVIEW_* env values), so the UI never drifts from what the
 * API actually enforces.
 *
 * Per spec: no aimtalk on submit — the completion modal is the only
 * post-submit signal to the user.
 */
export function ReviewForm({ orderId, defaultName, config = DEFAULT_CONFIG }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState(defaultName || "사용자");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedBody = body.trim();
  const bodyLen = trimmedBody.length;
  const canSubmit = useMemo(
    () =>
      !submitting &&
      rating >= 1 &&
      rating <= 5 &&
      bodyLen >= config.body_min_len &&
      bodyLen <= config.body_max_len &&
      displayName.trim().length > 0,
    [submitting, rating, bodyLen, displayName, config.body_min_len, config.body_max_len]
  );

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          rating,
          title: title.trim() || null,
          body: trimmedBody,
          displayName: displayName.trim(),
        }),
      });
      if (response.ok) {
        setDone(true);
        return;
      }
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      const code = data?.error || "rpc_failed";
      setError(ERROR_MESSAGES[code] || "리뷰 저장을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } catch {
      setError("네트워크 오류로 저장하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="rounded-[34px] border border-[var(--border-subtle)] bg-cream/90 p-8 text-center shadow-[0_24px_80px_rgba(31,30,29,.10)]">
        <p className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-coral text-2xl font-bold text-cream shadow-coral">
          ✓
        </p>
        <h1 className="mt-7 text-[clamp(32px,4vw,52px)] font-[680] leading-[1.06] tracking-[-0.045em]">
          리뷰 접수 완료
        </h1>
        <p className="mx-auto mt-5 max-w-lg break-keep text-[16px] leading-7 text-secondary">
          관리자가 검토한 뒤 ${config.reward_usd} API 잔액이 자동 지급됩니다.
          <br />
          상태는 마이페이지에서 확인하실 수 있어요.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/mypage/reviews"
            className="inline-flex min-h-12 items-center rounded-2xl bg-primary px-5 text-sm font-bold text-cream transition hover:bg-coral"
          >
            내 리뷰 확인
          </a>
          <a
            href="/reviews"
            className="inline-flex min-h-12 items-center rounded-2xl border border-[var(--border-subtle)] bg-cream px-5 text-sm font-bold text-secondary transition hover:border-coral/50 hover:text-coral"
          >
            전체 리뷰 보기
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-[34px] border border-[var(--border-subtle)] bg-cream/90 p-6 shadow-[0_24px_80px_rgba(31,30,29,.10)] backdrop-blur-xl sm:p-8">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral/80">
        Review Bonus
      </p>
      <h1 className="mt-4 text-[clamp(32px,4.6vw,56px)] font-[680] leading-[1.05] tracking-[-0.045em]">
        리뷰 작성하고
        <br />${config.reward_usd} 받기
      </h1>
      <p className="mt-5 max-w-xl break-keep text-[15.5px] leading-7 text-secondary">
        실제 사용 후기를 남겨주시면 관리자 검토 후 ${config.reward_usd} API 잔액이 자동 지급됩니다.
        보상은 1주문당 1회만 지급됩니다.
      </p>

      <div className="mt-8 grid gap-6">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
            별점
          </p>
          <div className="mt-3">
            <StarRating value={rating} onChange={setRating} disabled={submitting} />
          </div>
        </div>

        <label className="block">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
            공개 이름
          </span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={submitting}
            className="mt-3 h-14 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 text-sm font-semibold outline-none transition focus:border-coral focus:shadow-[0_0_0_4px_rgba(217,119,87,.10)] disabled:opacity-60"
            placeholder="김정후"
            maxLength={40}
          />
          <span className="mt-2 block text-xs text-secondary/70">
            판매 페이지에는 앞부분만 보이고 뒤는 흐림 처리됩니다.
          </span>
        </label>

        <label className="block">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
            제목 <span className="text-secondary/60">(선택)</span>
          </span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={submitting}
            className="mt-3 h-14 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 text-sm font-semibold outline-none transition focus:border-coral focus:shadow-[0_0_0_4px_rgba(217,119,87,.10)] disabled:opacity-60"
            placeholder="한 줄 요약 (50자 이내)"
            maxLength={50}
          />
        </label>

        <label className="block">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">
            사용 후기
            <span className="ml-1 text-secondary/60">
              ({config.body_min_len}~{config.body_max_len}자)
            </span>
          </span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            disabled={submitting}
            className="mt-3 min-h-44 w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-4 text-sm font-semibold leading-7 outline-none transition focus:border-coral focus:shadow-[0_0_0_4px_rgba(217,119,87,.10)] disabled:opacity-60"
            placeholder={`실제로 사용해본 느낌을 자유롭게 남겨주세요. (${config.body_min_len}자 이상)`}
            maxLength={config.body_max_len}
          />
          <span
            className={`mt-2 block text-right font-mono text-[11px] ${
              bodyLen >= config.body_min_len ? "text-secondary/70" : "text-coral"
            }`}
          >
            {bodyLen} / {config.body_max_len}
          </span>
        </label>
      </div>

      {error ? (
        <p className="mt-5 rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-bold text-coral">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="mt-7 min-h-14 w-full rounded-2xl bg-coral px-5 text-base font-bold text-cream shadow-coral transition hover:-translate-y-0.5 hover:bg-coral-hi disabled:cursor-not-allowed disabled:bg-secondary/30 disabled:shadow-none"
      >
        {submitting ? "저장 중…" : "리뷰 제출하기"}
      </button>
    </section>
  );
}
