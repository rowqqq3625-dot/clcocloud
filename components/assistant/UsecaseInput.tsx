"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface UsecaseInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function UsecaseInput({ value, onChange }: UsecaseInputProps) {
  // Frequently used integrations
  const chips = [
    "헤르메스",
    "Cline",
    "Claude Code",
    "Cursor",
    "Aider",
    "Continue",
    "n8n",
    "Python 스크립트"
  ];

  const handleChipClick = (chip: string) => {
    onChange(chip);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    if (text.length <= 60) {
      onChange(text);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-coral/80">Step 2</span>
        <h3 className="text-xl font-bold tracking-tight text-primary mt-1">API 키를 사용 중인 도구/환경 입력</h3>
        <p className="text-xs text-secondary mt-1">사용처의 설정 파일명, 입력 필드 위치, 에러 원인에 맞는 고유 디버깅 팁이 제공됩니다.</p>
      </div>

      <div className="mt-1 flex flex-col gap-3">
        {/* Text Input */}
        <div className="relative w-full">
          <input
            type="text"
            value={value}
            onChange={handleInputChange}
            maxLength={60}
            placeholder="예: 헤르메스, Cline, Claude Code, Cursor, Aider, Continue, n8n, 자체 Python 스크립트…"
            className="w-full h-12 px-4 rounded-xl border border-[var(--border-subtle)] bg-white/60 text-sm font-semibold text-primary placeholder:text-secondary/50 outline-none focus:border-coral focus:bg-white focus:shadow-sm transition-all duration-200"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none text-secondary/40 text-[10px] font-mono select-none">
            <span>{value.length}/60</span>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2 items-center mt-1">
          <span className="flex items-center gap-1 text-[11px] font-bold text-secondary mr-1 shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-coral/70" />
            자주 쓰는 환경:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {chips.map((chip) => {
              const isSelected = value === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all duration-200 ${
                    isSelected
                      ? "bg-coral text-cream border border-coral shadow-sm scale-102"
                      : "bg-cream-2/70 text-secondary border border-[var(--border-subtle)] hover:bg-white hover:border-coral/25 hover:text-coral"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
