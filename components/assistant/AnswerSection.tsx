"use client";

import React from "react";

export type SectionLabelType = "진단" | "해결" | "검증" | "참고";

interface AnswerSectionProps {
  label: SectionLabelType;
  isFirst?: boolean;
}

export function AnswerSection({ label, isFirst = false }: AnswerSectionProps) {
  return (
    <div 
      className={`flex items-center gap-2 select-none ${isFirst ? "mt-0" : "mt-8"} mb-3`}
      aria-label={`${label} 단계`}
    >
      {/* 3x16px Coral vertical bar */}
      <span className="section-coral-bar rounded" aria-hidden="true" />
      <h3 className="t-section text-ink-65 uppercase tracking-wider leading-none">
        {label}
      </h3>
    </div>
  );
}
