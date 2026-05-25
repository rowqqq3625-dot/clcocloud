"use client";

import React, { useState, useEffect, useRef } from "react";
import { OSType } from "./OSChips";
import { Settings, RefreshCw, LogOut } from "lucide-react";

interface ContextBarProps {
  os: OSType;
  usecase: string;
  quota: { used: number; limit: number };
  onBackToField: (field: "os" | "usecase") => void;
  onNewChat: () => void;
}

const osFriendly: Record<string, string> = {
  macos: "macOS",
  powershell: "PowerShell",
  cmd: "Windows CMD",
  linux: "Linux"
};

export function ContextBar({ os, usecase, quota, onBackToField, onNewChat }: ContextBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [menuOpen]);

  const isQuotaCritical = quota.used >= 40;

  return (
    <div className="w-full flex items-center justify-between py-4 border-b border-[var(--border-subtle)] select-none shrink-0">
      {/* Left Pill Buttons Context (Minimal: Arrow Only) */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => onBackToField("os")}
          className="text-ink-100 hover:text-coral transition-colors duration-150 text-xl font-bold flex items-center justify-center w-8 h-8 rounded-full hover:bg-cream-2 border border-transparent hover:border-[var(--border-subtle)] focus-none"
          aria-label="이전 화면으로 가기"
        >
          ←
        </button>
      </div>

      {/* Right Dot Fill + Quota + Dropdown Menu */}
      <div className="flex items-center gap-4 relative" ref={menuRef}>
        {/* 점선 ······ 삭제됨 */}
        
        {/* Usage Quota Display */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-cream-2 t-mono text-xs shadow-sm">
          <span className="opacity-50">이번 주</span>
          <span className={`${isQuotaCritical ? "text-[#E27D60] font-bold" : "text-ink-65"}`}>
            {quota.used}
          </span>
          <span className="opacity-30">/</span>
          <span className="text-ink-45">{quota.limit}</span>
        </div>

        {/* Triple Dot Menu Button */}
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          className="text-ink-100 hover:text-coral text-lg font-bold flex items-center justify-center w-8 h-8 rounded-full hover:bg-cream-2 border border-transparent hover:border-[var(--border-subtle)] transition-colors focus-none"
          aria-expanded={menuOpen}
          aria-label="더보기 메뉴"
        >
          ⋯
        </button>

        {/* Menu Dropdown Popup */}
        {menuOpen && (
          <div className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[#F7F1E8] p-2 text-ink-100 shadow-[0_16px_48px_rgba(31,30,29,.1)] animate-fade-up">
            <div className="grid gap-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onNewChat();
                }}
                className="w-full text-left rounded-xl px-3 py-2 text-ink-65 hover:bg-coral/10 hover:text-coral transition-colors flex items-center gap-2 focus-none"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>새 채팅</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onBackToField("os");
                }}
                className="w-full text-left rounded-xl px-3 py-2 text-ink-65 hover:bg-coral/10 hover:text-coral transition-colors flex items-center gap-2 focus-none"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>재설정</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
