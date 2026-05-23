import React from "react";

interface QuotaBadgeProps {
  usedCount: number;
  dailyLimit: number;
}

export function QuotaBadge({ usedCount, dailyLimit }: QuotaBadgeProps) {
  const isExceeded = usedCount >= dailyLimit;
  const isNearLimit = usedCount >= dailyLimit - 5 && !isExceeded;

  return (
    <span
      className="font-mono text-[11px] font-semibold transition-colors duration-200"
      style={{
        color: isExceeded
          ? "var(--coral)"
          : isNearLimit
          ? "var(--coral-soft)"
          : "rgba(31, 30, 29, 0.60)" // --ink soft 60%
      }}
      aria-label={`일일 사용량: 30회 중 ${usedCount}회 사용`}
    >
      오늘 {usedCount}/{dailyLimit}
    </span>
  );
}
