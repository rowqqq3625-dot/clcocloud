"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, Terminal, Laptop, Clipboard, ShieldAlert, Mail, RotateCcw } from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAction: (actionKey: string) => void;
}

interface CommandItem {
  id: string;
  name: string;
  category: string;
  icon: React.ReactNode;
  hint?: string;
}

const commands: CommandItem[] = [
  { id: "reset", name: "새 채팅", category: "시스템", icon: <RotateCcw className="w-4 h-4" />, hint: "현재 대화를 저장하고 새 대화 시작" },
  { id: "change-os", name: "운영체제(OS) 변경", category: "설정", icon: <Laptop className="w-4 h-4" />, hint: "macOS / Windows / Linux 변경" },
  { id: "change-usecase", name: "사용 도구 변경", category: "설정", icon: <Terminal className="w-4 h-4" />, hint: "헤르메스, Cursor 등 사용처 입력" },
  { id: "code-only", name: "코드 조각만 보기", category: "필터", icon: <Clipboard className="w-4 h-4" />, hint: "대화 속 코드 블록만 추출해 보기" },
  { id: "screenshot", name: "스크린샷 오류 분석", category: "도구", icon: <ShieldAlert className="w-4 h-4" />, hint: "화면 캡처 이미지를 첨부하여 진단" },
  { id: "contact-support", name: "운영자에게 직접 문의", category: "고객 지원", icon: <Mail className="w-4 h-4" />, hint: "이메일 복사 및 문의 안내" }
];

export function CommandPalette({ isOpen, onClose, onAction }: CommandPaletteProps) {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const paletteRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(search.toLowerCase()) ||
    cmd.category.toLowerCase().includes(search.toLowerCase()) ||
    (cmd.hint && cmd.hint.toLowerCase().includes(search.toLowerCase()))
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const handleExecute = useCallback((id: string) => {
    onAction(id);
    onClose();
    setSearch("");
  }, [onAction, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredCommands.length > 0 ? (prev + 1) % filteredCommands.length : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (filteredCommands.length > 0 ? (prev - 1 + filteredCommands.length) % filteredCommands.length : 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleExecute(filteredCommands[selectedIndex].id);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose, handleExecute]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-ink/30 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="명령 팔레트"
      onClick={onClose}
    >
      <div
        ref={paletteRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[560px] bg-[#F7F1E8] border border-[var(--border-subtle)] rounded-2xl shadow-[0_32px_64px_rgba(31,30,29,0.18)] overflow-hidden scale-95 opacity-0 animate-fade-up flex flex-col max-h-[440px]"
        style={{ animationDuration: "200ms" }}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 border-b border-[var(--border-subtle)] py-3.5 shrink-0">
          <Search className="w-5 h-5 text-ink-45" />
          <input
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-base text-ink-100 placeholder-ink-45 font-sans"
            placeholder="동작이나 메뉴를 검색하세요... (⌘K / Ctrl+K)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* Command List Area */}
        <div className="flex-1 overflow-y-auto p-2">
          {filteredCommands.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {filteredCommands.map((cmd, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={cmd.id}
                    type="button"
                    onClick={() => handleExecute(cmd.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors
                      ${isSelected ? "bg-coral text-cream" : "hover:bg-coral/5 text-ink-100"}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`${isSelected ? "text-cream" : "text-coral"} shrink-0`}>
                        {cmd.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold truncate leading-none mb-0.5">{cmd.name}</p>
                        <p className={`text-[11px] truncate leading-none ${isSelected ? "text-cream/80" : "text-ink-65"}`}>
                          {cmd.hint}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`t-mono text-[9px] px-1.5 py-0.5 rounded uppercase select-none tracking-widest shrink-0
                      ${isSelected ? "bg-cream-2/20 text-cream" : "bg-cream-2 border border-[var(--border-subtle)] text-ink-45"}`}>
                      {cmd.category}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="t-body text-ink-65 text-sm">일치하는 동작이 없습니다.</p>
            </div>
          )}
        </div>

        {/* Keyboard Helper Footer */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-cream-2/50 flex justify-between items-center select-none shrink-0">
          <div className="flex items-center gap-4 t-mono text-[9px] text-ink-45">
            <span>↑↓ 이동</span>
            <span>↵ 실행</span>
            <span>ESC 닫기</span>
          </div>
          <span className="t-mono text-[9px] text-ink-45 opacity-50">CLCO PALETTE</span>
        </div>
      </div>
    </div>
  );
}
