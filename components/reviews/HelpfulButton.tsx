"use client";

import { useState } from "react";

type HelpfulButtonProps = {
  reviewId: string;
  initialVoted: boolean;
  initialCount: number;
  authenticated: boolean;
};

/**
 * Toggle "도움돼요" vote for a review. Renders for everyone but only
 * fires the API for authenticated users — anonymous viewers get a
 * gentle "로그인 후 이용" hint via the disabled state.
 *
 * The server is the source of truth: we display the count returned by
 * /api/reviews/:id/helpful so a stale optimistic value can't linger if
 * the toggle was idempotent for any reason.
 */
export function HelpfulButton({
  reviewId,
  initialVoted,
  initialCount,
  authenticated,
}: HelpfulButtonProps) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  const onClick = async () => {
    if (!authenticated || pending) return;
    setPending(true);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) return;
      const data = (await response.json()) as { voted: boolean; helpful_count: number };
      setVoted(data.voted);
      setCount(data.helpful_count);
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!authenticated || pending}
      title={authenticated ? "도움돼요" : "로그인 후 이용 가능"}
      aria-pressed={voted}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        voted
          ? "border-coral bg-coral text-cream shadow-coral hover:bg-coral-hi"
          : "border-[var(--border-subtle)] bg-cream text-secondary hover:border-coral/50 hover:text-coral"
      }`}
    >
      <span aria-hidden="true">{voted ? "♥" : "♡"}</span>
      <span>도움돼요</span>
      <span className="font-mono tabular-nums">{count}</span>
    </button>
  );
}
