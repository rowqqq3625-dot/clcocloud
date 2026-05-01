"use client";

import { useMemo, useState } from "react";

export function ReviewForm({ orderId, defaultName }: { orderId: string; defaultName: string }) {
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState(defaultName || "사용자");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = useMemo(() => rating >= 1 && rating <= 5 && body.trim().length >= 10 && displayName.trim().length > 0, [body, displayName, rating]);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, rating, body, displayName })
      });
      if (!response.ok) throw new Error("review_failed");
      setDone(true);
    } catch {
      setError("리뷰 저장을 완료하지 못했습니다. 이미 작성했거나 잠시 후 다시 시도해야 합니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <section className="rounded-[34px] border border-[var(--border-subtle)] bg-cream/90 p-8 text-center shadow-[0_24px_80px_rgba(31,30,29,.10)]">
        <p className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-coral text-2xl font-bold text-cream shadow-coral">✓</p>
        <h1 className="mt-7 text-[clamp(36px,5vw,62px)] font-[680] leading-[1.05] tracking-[-0.045em]">리뷰 접수 완료</h1>
        <p className="mx-auto mt-5 max-w-lg break-keep text-[16px] leading-7 text-secondary">
          관리자가 리뷰와 주문을 확인한 뒤 $30 추가 지급을 처리합니다.
        </p>
        <a href="/mypage" className="mt-8 inline-flex min-h-12 items-center rounded-2xl bg-primary px-5 text-sm font-bold text-cream transition hover:bg-coral">
          마이페이지로 돌아가기
        </a>
      </section>
    );
  }

  return (
    <section className="rounded-[34px] border border-[var(--border-subtle)] bg-cream/90 p-6 shadow-[0_24px_80px_rgba(31,30,29,.10)] backdrop-blur-xl sm:p-8">
      <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral/80">Review Bonus</p>
      <h1 className="mt-4 text-[clamp(38px,6vw,72px)] font-[680] leading-[1.04] tracking-[-0.05em]">리뷰 작성하고<br />$30 받기</h1>
      <p className="mt-5 max-w-xl break-keep text-[16px] leading-7 text-secondary">
        API 키 발급 완료 후 실제 사용 후기를 남기면 관리자가 확인한 뒤 $30를 추가 충전합니다.
      </p>

      <div className="mt-8 grid gap-6">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">별점</p>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`grid h-12 w-12 place-items-center rounded-2xl border text-xl transition ${star <= rating ? "border-coral bg-coral text-cream shadow-coral" : "border-[var(--border-subtle)] bg-white text-secondary hover:border-coral/50"}`}
                aria-label={`${star}점`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">공개 이름</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            className="mt-3 h-14 w-full rounded-2xl border border-[var(--border-subtle)] bg-white px-4 text-sm font-semibold outline-none transition focus:border-coral focus:shadow-[0_0_0_4px_rgba(217,119,87,.10)]"
            placeholder="김정후"
            maxLength={40}
          />
          <span className="mt-2 block text-xs text-secondary/70">판매 페이지에는 앞부분만 보이고 뒤는 흐림 처리됩니다.</span>
        </label>

        <label className="block">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-secondary">사용 후기</span>
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="mt-3 min-h-40 w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-white px-4 py-4 text-sm font-semibold leading-7 outline-none transition focus:border-coral focus:shadow-[0_0_0_4px_rgba(217,119,87,.10)]"
            placeholder="실제로 사용해본 느낌을 짧게 남겨주세요."
            maxLength={600}
          />
          <span className="mt-2 block text-right font-mono text-[11px] text-secondary/70">{body.length}/600</span>
        </label>
      </div>

      {error ? <p className="mt-5 rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3 text-sm font-bold text-coral">{error}</p> : null}
      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit || submitting}
        className="mt-7 min-h-14 w-full rounded-2xl bg-coral px-5 text-base font-bold text-cream shadow-coral transition hover:-translate-y-0.5 hover:bg-coral-hi disabled:cursor-not-allowed disabled:bg-secondary/30 disabled:shadow-none"
      >
        {submitting ? "저장 중" : "리뷰 제출하기"}
      </button>
    </section>
  );
}
