import React from "react";

type StepCardProps = {
  stepNumber: string; // e.g. "01", "02"
  title: string;
  className?: string;
};

export function StepCard({ stepNumber, title, className = "" }: StepCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[24px] border border-[rgba(247,241,232,0.08)] bg-[rgba(247,241,232,0.03)] p-7 flex flex-col justify-between min-h-[190px] group transition-all duration-300 hover:-translate-y-1 hover:border-[var(--coral)] hover:bg-[rgba(247,241,232,0.06)] hover:shadow-[0_24px_60px_-24px_rgba(217,119,87,0.20)] ${className}`}
    >
      {/* Background Watermark - positioned elegantly behind text */}
      <span className="absolute bottom-[2px] right-[8px] font-mono text-[92px] font-black text-[var(--cream-soft)] opacity-[0.08] select-none pointer-events-none leading-none z-0">
        {stepNumber}
      </span>

      <div className="relative z-10 flex flex-col justify-between h-full flex-grow">
        {/* Step Badge */}
        <div className="flex items-center mb-6">
          <span className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-[var(--coral)] text-white font-mono text-[13px] font-bold shadow-[0_4px_12px_rgba(217,119,87,0.3)]">
            {parseInt(stepNumber, 10)}
          </span>
        </div>

        {/* Large, high-contrast, premium title */}
        <h4 className="text-[20px] font-bold text-[var(--cream)] leading-snug tracking-tight mb-2 select-text">
          {title}
        </h4>
      </div>
    </div>
  );
}
