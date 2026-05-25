"use client";

import React from "react";

interface StartCTAProps {
  onStart: () => void;
  disabled: boolean;
}

export function StartCTA({ onStart, disabled }: StartCTAProps) {
  return (
    <div className="flex justify-start w-full">
      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className="start-cta-btn flex items-center justify-center gap-2"
        aria-label="어시스턴트 채널 시작하기"
      >
        <span>어시스턴트 시작하기</span>
        <span className="arrow text-lg font-bold" aria-hidden="true">→</span>
      </button>
    </div>
  );
}
