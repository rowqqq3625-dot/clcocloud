import React from "react";
import { CopyButton } from "./CopyButton";

type StepCardProps = {
  stepNumber: string; // e.g. "01", "02"
  title: string;
  codeContent?: string;
  className?: string;
};

export function StepCard({ stepNumber, title, codeContent, className = "" }: StepCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[20px] border border-[rgba(247,241,232,0.08)] bg-[rgba(247,241,232,0.04)] p-6 flex flex-col min-h-[220px] group transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(217,119,87,0.40)] hover:bg-[rgba(247,241,232,0.06)] hover:shadow-[0_24px_60px_-24px_rgba(217,119,87,0.25)] ${className}`}
    >
      {/* Watermark in bottom right - shifted slightly and layered on top (z-20, opacity 14%) to avoid clipping */}
      <span className="absolute bottom-[2px] right-[8px] font-mono text-[84px] font-bold text-[var(--cream-soft)] opacity-[0.14] select-none pointer-events-none leading-none z-20">
        {stepNumber}
      </span>

      <div className="relative z-10 flex flex-col flex-grow">
        {/* Top row: Coral step badge */}
        <div className="flex items-center mb-4">
          <span className="flex items-center justify-center w-[28px] h-[28px] rounded-full bg-[var(--coral)] text-[var(--cream)] font-mono text-[12px] font-semibold shadow-[0_4px_12px_rgba(217,119,87,0.3)]">
            {parseInt(stepNumber, 10)}
          </span>
        </div>

        {/* Middle row: Step title */}
        <h4 className="text-[15px] font-[600] text-[var(--cream)] mb-4 leading-snug">
          {title}
        </h4>

        {/* Bottom row: Code block (if present) */}
        {codeContent && (
          <div className="relative rounded-lg bg-[rgba(0,0,0,0.36)] border border-[rgba(247,241,232,0.06)] p-3 pr-10 font-mono text-[13px] text-[var(--cream-soft)] overflow-x-auto whitespace-pre-wrap select-all mt-auto z-10">
            <code>{codeContent}</code>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <CopyButton textToCopy={codeContent} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
