"use client";
 
import React from "react";
import { OSChips, OSType } from "./OSChips";
import { UsecaseField } from "./UsecaseField";
import { StartCTA } from "./StartCTA";

interface IntroScreenProps {
  selectedOs: OSType | null;
  onOsChange: (os: OSType) => void;
  usecase: string;
  onUsecaseChange: (val: string) => void;
  onStart: () => void;
  onSelectSession: (sessionId: string) => void;
}

export function IntroScreen({
  selectedOs,
  onOsChange,
  usecase,
  onUsecaseChange,
  onStart,
  onSelectSession
}: IntroScreenProps) {
  const isStartDisabled = !selectedOs || !usecase.trim();

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const focusField = localStorage.getItem("clco_assistant_focus_field");
      if (focusField === "usecase") {
        setTimeout(() => {
          const input = document.getElementById("usecase-input-field") as HTMLInputElement;
          if (input) input.focus();
        }, 120);
      }
      localStorage.removeItem("clco_assistant_focus_field");
    }
  }, []);

  return (
    <div className="w-full flex-1 flex flex-col justify-between animate-fade-up min-h-0 pl-6 pr-6 md:pl-[160px] md:pr-12 pt-16 md:pt-24 pb-6">
      {/* 상단 콘텐츠 그룹 */}
      <div className="flex flex-col gap-0">
        {/* 1. Poetic Headline Group */}
        <div className="flex flex-col gap-2.5">
          <h1 className="t-display text-ink-100 flex flex-col tracking-tight select-none">
            <span>코드 한 줄이면,</span>
            <span className="t-italic font-normal italic pr-2">해결됩니다.</span>
          </h1>
          <p className="t-body text-ink-65 select-none">
            어떤 상황에서 막히고 계신가요?
          </p>
        </div>

        {/* 2. OS Chips Group */}
        <div className="mt-8 flex flex-col gap-3">
          <OSChips selectedOs={selectedOs} onChange={onOsChange} />
        </div>

        {/* 3. Usecase Underline Input Group & CTA Group */}
        <div className="mt-12 flex flex-col w-full max-w-[800px]">
          <div className="w-full max-w-[560px]">
            <UsecaseField value={usecase} onChange={onUsecaseChange} />
          </div>
          <div className="mt-10">
            <StartCTA onStart={onStart} disabled={isStartDisabled} />
          </div>
        </div>
      </div>

      {/* 하단 이메일 (항상 하단에 고정되도록 justify-between으로 자동 배치) */}
      <div className="shrink-0 pt-4">
        <p className="text-[11px] text-ink-65 opacity-55 font-medium leading-relaxed">
          support.clcocloud@gmail.com
        </p>
      </div>
    </div>
  );
}
