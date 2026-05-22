import React from "react";

type DiscountBadgeProps = {
  percent: number;
  className?: string;
};

export function DiscountBadge({ percent, className = "" }: DiscountBadgeProps) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full border border-coral/30 bg-coral-soft/12 text-coral-solid font-mono text-[11px] font-semibold uppercase tracking-wider ${className}`}
    >
      약 {percent}% 절감
    </span>
  );
}
