"use client";

import React, { useEffect, useState } from "react";

export function TypingIndicator() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const media = window.matchMedia("(prefers-reduced-motion: reduce)");
      setReducedMotion(media.matches);

      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, []);

  if (reducedMotion) {
    return (
      <div className="flex items-center gap-2 text-xs font-bold text-coral bg-cream-2/70 border border-[var(--border-subtle)] px-4 py-2.5 rounded-2xl rounded-tl-md shadow-sm select-none">
        <span className="w-1.5 h-1.5 rounded-full bg-coral animate-pulse" />
        <span>어시스턴트가 답변을 생성하는 중...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 bg-cream-2/70 border border-[var(--border-subtle)] px-4 py-3.5 rounded-2xl rounded-tl-md shadow-sm w-max max-w-full select-none">
      <div className="flex gap-1 items-center justify-center h-2">
        <span className="dot dot-1" />
        <span className="dot dot-2" />
        <span className="dot dot-3" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .dot {
          display: inline-block;
          width: 5.5px;
          height: 5.5px;
          border-radius: 50%;
          background-color: var(--coral);
          opacity: 0.35;
          transform: translateY(0);
        }
        .dot-1 {
          animation: staggered-dot-bounce 1s infinite cubic-bezier(0.22, 1, 0.36, 1);
          animation-delay: 0ms;
        }
        .dot-2 {
          animation: staggered-dot-bounce 1s infinite cubic-bezier(0.22, 1, 0.36, 1);
          animation-delay: 160ms;
        }
        .dot-3 {
          animation: staggered-dot-bounce 1s infinite cubic-bezier(0.22, 1, 0.36, 1);
          animation-delay: 320ms;
        }
        @keyframes staggered-dot-bounce {
          0%, 100% {
            opacity: 0.35;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-4px);
          }
        }
      `}} />
    </div>
  );
}
