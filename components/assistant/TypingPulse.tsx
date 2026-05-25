"use client";

import React, { useEffect, useState } from "react";

export function TypingPulse() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (reducedMotion) {
    return (
      <span className="t-meta text-ink-65 select-none pl-6 animate-pulse">
        응답을 정리하는 중...
      </span>
    );
  }

  return (
    <div className="flex items-center pl-6 h-6 select-none" aria-hidden="true">
      <div className="typing-pulse-square" />
    </div>
  );
}
