"use client";

import React, { useEffect, useState } from "react";

export function TypingPulse({ hasImages = false }: { hasImages?: boolean }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fade, setFade] = useState(true);

  const steps = [
    hasImages ? "문의 내용 및 이미지 분석 중... 🔍" : "문의 내용 및 환경 매핑 중... 🔍",
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
    let isMounted = true;
    // 묵직한 지연 시간을 두어 실제 인공지능이 정밀하게 심사숙고하는 듯한 추론을 연출합니다.
    const stepDelays = [4000, 4800, 5800, 5200, 4500, 4500];

    const runNextStep = (currentIndex: number) => {
      if (currentIndex >= steps.length - 1 || !isMounted) return;
      setTimeout(() => {
        if (isMounted) {
          setFade(false); // 서서히 사라짐
          setTimeout(() => {
            if (isMounted) {
              setStepIndex(currentIndex + 1);
              setFade(true); // 서서히 나타남
              runNextStep(currentIndex + 1);
            }
          }, 300); // fade out 애니메이션 딜레이
        }
      }, stepDelays[currentIndex] - 300);
    };

    runNextStep(0);

    return () => {
      isMounted = false;
    };
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
      <span className={`text-[12px] text-ink-65 font-medium transition-all duration-500 ease-out select-none ${fade ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'}`}>
        {steps[stepIndex]}
      </span>
    </div>
  );
}
