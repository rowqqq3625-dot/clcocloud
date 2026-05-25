"use client";

import React, { useEffect, useState } from "react";

export function TypingPulse() {
  const [stepIndex, setStepIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  const steps = [
    "문의 내용 및 이미지 분석 중... 🔍",
    "OS 환경 및 사용처 식별 중... 🖥️",
    "클로드 API 환경변수 충돌 진단 중... 🛠️",
    "최적의 셸 명령어 조합 구성 중... ⚙️",
    "답변 및 실행 코드 검증 중... 🔬",
    "최종 안내 가이드 작성 중... ✍️"
  ];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(timer);
  }, [steps.length]);

  if (reducedMotion) {
    return (
      <span className="t-meta text-ink-65 select-none pl-6 animate-pulse">
        {steps[stepIndex]}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3 pl-6 select-none animate-fade-up" role="status" aria-live="polite">
      {/* Elegant minimalist spinner */}
      <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
        <div className="absolute w-full h-full border-2 border-coral/20 rounded-full" />
        <div className="absolute w-full h-full border-2 border-coral border-t-transparent rounded-full animate-spin" />
      </div>
      {/* Thinking step text */}
      <span className="text-[12px] text-ink-65 font-medium animate-pulse transition-all duration-300">
        {steps[stepIndex]}
      </span>
    </div>
  );
}
