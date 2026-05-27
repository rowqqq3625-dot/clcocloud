"use client";

import { useState } from "react";

type StarRatingProps = {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
};

/**
 * Interactive 1-5 star input. Hover preview + click commits.
 * Used in /reviews/new and the resubmit form on /mypage/reviews.
 */
export function StarRating({ value, onChange, disabled = false }: StarRatingProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value;

  return (
    <div
      className="flex gap-2"
      role="radiogroup"
      aria-label="별점"
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= display;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            disabled={disabled}
            onMouseEnter={() => !disabled && setHover(star)}
            onFocus={() => !disabled && setHover(star)}
            onBlur={() => setHover(null)}
            onClick={() => !disabled && onChange(star)}
            className={`grid h-12 w-12 place-items-center rounded-2xl border text-xl transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "border-coral bg-coral text-cream shadow-coral"
                : "border-[var(--border-subtle)] bg-white text-secondary hover:border-coral/50"
            }`}
            aria-label={`${star}점`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
