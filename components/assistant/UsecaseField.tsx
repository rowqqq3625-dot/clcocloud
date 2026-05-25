"use client";
 
import React, { useRef } from "react";
 
interface UsecaseFieldProps {
  value: string;
  onChange: (val: string) => void;
}
 
export function UsecaseField({ value, onChange }: UsecaseFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col w-full max-w-[560px]">
      {/* Label/Eyebrow to balance the empty space beautifully */}
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-coral/80 mb-2.5 pl-1.5 select-none">
        연동할 도구 및 서비스
      </span>
      
      {/* 1. Input Box */}
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          id="usecase-input-field"
          type="text"
          className="w-full px-5 py-3.5 bg-cream-2/70 border border-[var(--border-subtle)] rounded-full text-ink-100 placeholder-ink-45/60 focus:outline-none focus:border-ink-soft focus:ring-1 focus:ring-ink-soft/20 text-base transition-all apple-input-focus"
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 60))}
          placeholder="연동이 필요한 도구를 입력해주세요."
          maxLength={60}
          autoComplete="off"
        />
        
        {value.length > 0 && (
          <span className="absolute right-5 t-mono text-xs text-ink-65 tabular-nums select-none">
            {value.length}/60
          </span>
        )}
      </div>
    </div>
  );
}
