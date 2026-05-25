import React from "react";

type StepCardProps = {
  stepNumber: string; // e.g. "01", "02"
  title?: string;
  boxText?: string;
  className?: string;
};

export function StepCard({ stepNumber, boxText, className = "" }: StepCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-[rgba(247,241,232,0.08)] bg-[rgba(247,241,232,0.04)] p-6 flex flex-col min-h-[200px] group transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(217,119,87,0.40)] hover:bg-[rgba(247,241,232,0.06)] hover:shadow-[0_24px_60px_-24px_rgba(217,119,87,0.25)] ${className}`}
    >
      {/* Watermark in bottom right - shifted slightly and layered on top (z-20, opacity 14%) to avoid clipping */}
      <span className="absolute bottom-[2px] right-[8px] font-mono text-[84px] font-bold text-[var(--cream-soft)] opacity-[0.14] select-none pointer-events-none leading-none z-20">
        {stepNumber}
      </span>

      <div className="relative z-10 flex flex-col flex-grow justify-between">
        {/* Top row: Coral step badge */}
        <div className="flex items-center mb-6">
          <span className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-[var(--coral)] text-[var(--cream)] font-mono text-[12px] font-semibold shadow-[0_4px_12px_rgba(217,119,87,0.3)]">
            {parseInt(stepNumber, 10)}
          </span>
        </div>

        {/* Bottom row: Text block (if present) */}
        {boxText && (
          <div className="relative rounded-xl bg-[rgba(251,246,236,0.05)] border border-[rgba(251,246,236,0.10)] p-5 flex items-center justify-center text-center z-10 min-h-[90px] shadow-[inset_0_1px_rgba(251,246,236,0.08)]">
            <span className="font-sans text-[18px] font-extrabold text-[var(--cream)] tracking-tight leading-snug">
              {boxText}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
