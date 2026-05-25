"use client";

import React, { useState, useCallback } from "react";
import { Copy, Check, RotateCw } from "lucide-react";

interface MessageActionsProps {
  messageId: string | number;
  messageText: string;
  onRebuild?: () => void;
}

export function MessageActions({ messageText, onRebuild }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    // Strip markdown formatting if any, or just copy raw messageText
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [messageText]);

  return (
    <div className="flex items-center gap-2 mt-3 select-none w-full">
      <div className="flex items-center gap-0.5 bg-cream-2 border border-[var(--border-subtle)] px-1 py-0.5 rounded-lg shadow-sm transition-all duration-200">
        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center w-[22px] h-[22px] rounded hover:bg-coral/10 text-ink-65 hover:text-coral transition-all duration-150 focus-none"
          title="답변 복사"
        >
          {copied ? <Check className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
        </button>
 
        {/* Rebuild/Retry Button (if handler provided) */}
        {onRebuild && (
          <button
            type="button"
            onClick={onRebuild}
            className="flex items-center justify-center w-[22px] h-[22px] rounded hover:bg-coral/10 text-ink-65 hover:text-coral transition-all duration-150 focus-none"
            title="답변 재진단 (다시 생성)"
          >
            <RotateCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {copied && (
        <span className="text-[10px] font-bold text-success/80 ml-1.5 animate-fade-up select-none">
          클립보드에 복사되었습니다.
        </span>
      )}
    </div>
  );
}
