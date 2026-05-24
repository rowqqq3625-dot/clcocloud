"use client";

import React, { useEffect, useRef } from "react";
import { Check, Monitor, Terminal, Cpu } from "lucide-react";

export type OSType = "macos" | "powershell" | "cmd" | "linux";

interface OSOption {
  id: OSType;
  name: string;
  subName: string;
  icon: React.ReactNode;
  description: string;
}

interface OSPickerProps {
  selected: OSType | null;
  onChange: (os: OSType) => void;
}

export function OSPicker({ selected, onChange }: OSPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const options: OSOption[] = [
    {
      id: "macos",
      name: "macOS",
      subName: "zsh / bash",
      icon: <Monitor className="w-5 h-5" />,
      description: "Apple Mac 터미널 환경"
    },
    {
      id: "powershell",
      name: "PowerShell",
      subName: "Windows",
      icon: <Terminal className="w-5 h-5 text-sky-400" />,
      description: "윈도우 파워셸 환경 ($env:)"
    },
    {
      id: "cmd",
      name: "Windows CMD",
      subName: "Command Prompt",
      icon: <Terminal className="w-5 h-5 text-neutral-400" />,
      description: "윈도우 명령 프롬프트 (setx)"
    },
    {
      id: "linux",
      name: "Linux",
      subName: "bash",
      icon: <Cpu className="w-5 h-5 text-emerald-400" />,
      description: "우분투/센트OS 등 리눅스 환경"
    }
  ];

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      nextIndex = (index + 1) % options.length;
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      nextIndex = (index - 1 + options.length) % options.length;
    } else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onChange(options[index].id);
      return;
    } else {
      return;
    }

    e.preventDefault();
    onChange(options[nextIndex].id);
    
    // Focus the next element
    const buttons = containerRef.current?.querySelectorAll('[role="radio"]');
    if (buttons && buttons[nextIndex]) {
      (buttons[nextIndex] as HTMLElement).focus();
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-coral/80">Step 1</span>
        <h3 className="text-xl font-bold tracking-tight text-primary mt-1">사용 중인 운영체제(OS) 선택</h3>
        <p className="text-xs text-secondary mt-1">답변 내 경로와 터미널 명령어가 이 환경을 기준으로 최적화됩니다.</p>
      </div>

      <div
        ref={containerRef}
        role="radiogroup"
        aria-label="운영체제 선택"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 mt-2"
      >
        {options.map((opt, idx) => {
          const isSelected = selected === opt.id;
          return (
            <div
              key={opt.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={selected ? (isSelected ? 0 : -1) : (idx === 0 ? 0 : -1)}
              onClick={() => onChange(opt.id)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`relative cursor-pointer select-none rounded-[16px] border p-4.5 transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-coral/50 ${
                isSelected
                  ? "border-coral bg-coral/5 shadow-[0_4px_16px_rgba(217,119,87,0.08)] scale-[1.01]"
                  : "border-[var(--border-subtle)] bg-white/60 hover:bg-white hover:border-coral/30 hover:shadow-sm"
              }`}
            >
              {/* Floating check mark */}
              {isSelected && (
                <div className="absolute top-3 right-3 grid h-5 w-5 place-items-center rounded-full bg-coral text-cream animate-scale-in">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <div className="flex flex-col h-full justify-between">
                <div className="flex items-center gap-3">
                  <div className={`grid h-9 w-9 place-items-center rounded-xl transition-colors duration-200 ${
                    isSelected ? "bg-coral/10 text-coral" : "bg-cream-2/70 text-secondary"
                  }`}>
                    {opt.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary">{opt.name}</h4>
                    <span className="font-mono text-[10px] text-secondary tracking-wide uppercase">{opt.subName}</span>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-[1.5] text-secondary font-medium">{opt.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-scale-in {
          animation: scaleIn 200ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.6);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}} />
    </div>
  );
}
