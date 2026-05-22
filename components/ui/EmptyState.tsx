import React from "react";

type EmptyStateProps = {
  statusLabel: string;
  headline: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: React.ReactNode;
};

export function EmptyState({
  statusLabel,
  headline,
  description,
  actionLabel,
  onAction,
  className = "",
  children,
}: EmptyStateProps) {
  return (
    <div
      className={`relative w-full rounded-[20px] border border-[var(--line)] bg-[var(--cream-2)] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 text-left ${className}`}
    >
      <div className="flex-1 flex flex-col items-start">
        {/* Status indicator: 좌상단 코럴 점 + mono 11px 상태 라벨 */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--coral)] animate-pulse" />
          <span className="font-mono text-[11px] font-semibold text-[var(--ink-soft)] uppercase tracking-widest">
            · STATUS: {statusLabel}
          </span>
        </div>

        {/* Headline: weight 560 */}
        <h4 className="text-[20px] font-[560] text-[var(--ink)] mb-2 leading-snug">
          {headline}
        </h4>

        {/* Description: 1줄 안내 잉크 소프트 13px */}
        <p className="text-[13px] text-[var(--ink-soft)] leading-relaxed mb-6">
          {description}
        </p>

        {/* Secondary CTA (optional): 1px line, 코럴 underline 0.5px */}
        {actionLabel && (
          <button
            onClick={onAction}
            className="group relative inline-flex items-center text-[13px] font-semibold text-[var(--coral)] transition-transform duration-200 hover:-translate-y-0.5"
          >
            <span className="relative">
              {actionLabel}
              <span className="absolute left-0 bottom-[-2px] w-full h-[0.5px] bg-[var(--coral)] transition-transform duration-300 origin-left scale-x-100 group-hover:scale-x-110" />
            </span>
          </button>
        )}
      </div>

      {/* Optional right-side content slot (e.g. mascot) */}
      {children && (
        <div className="flex shrink-0 items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}
