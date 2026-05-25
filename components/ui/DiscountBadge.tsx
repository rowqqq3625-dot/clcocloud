import React from "react";

type DiscountBadgeProps = {
  percent: number;
  className?: string;
};

export function DiscountBadge({ percent, className = "" }: DiscountBadgeProps) {
  return (
    <span
      className={`absolute top-2 right-4 rotate-[14deg] z-20 text-[var(--coral)] font-mono text-[36px] font-extrabold tracking-tighter opacity-85 select-none pointer-events-none ${className}`}
    >
      {percent}%
    </span>
  );
}
