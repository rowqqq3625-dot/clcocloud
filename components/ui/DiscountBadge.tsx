import React from "react";

type DiscountBadgeProps = {
  percent: number;
  className?: string;
};

export function DiscountBadge({ percent, className = "" }: DiscountBadgeProps) {
  return (
    <span
      className={`absolute -top-5 -right-2 rotate-[14deg] z-20 text-[var(--cream)] font-mono text-[36px] font-black tracking-tighter select-none pointer-events-none drop-shadow-[0_6px_14px_rgba(0,0,0,0.38)] ${className}`}
    >
      {percent}%
    </span>
  );
}
