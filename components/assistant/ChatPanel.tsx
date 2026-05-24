"use client";

import React, { useState, useEffect, useRef } from "react";
import { MessageBubble, AssistantMessage } from "./MessageBubble";
import { ImageUploader } from "./ImageUploader";
import { TypingIndicator } from "./TypingIndicator";
import { QuotaBadge } from "./QuotaBadge";
import { OSType } from "./OSPicker";
import { Edit2, Send, RotateCcw, AlertTriangle, ShieldCheck } from "lucide-react";
import { getClientHash } from "@/lib/assistant/fingerprint";

interface ChatPanelProps {
  os: OSType;
  usecase: string;
  onReset: () => void;
}

interface ImageFile {
  id: string;
  file: File;
  base64: string;
}

const osFriendly: Record<string, string> = {
  macos: "macOS",
  powershell: "Windows PowerShell",
  cmd: "Windows CMD",
  linux: "Linux"
};

export function ChatPanel({ os, usecase, onReset }: ChatPanelProps) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [images, setImages] = useState<ImageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState({ used: 0, limit: 50 });
  const [clientHash, setClientHash] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Initial Load: Fingerprint & Auto-greeting
  useEffect(() => {
    async function init() {
      const hash = await getClientHash();
      setClientHash(hash);
      
      // Fetch initial quota
      try {
        const res = await fetch(`/api/assistant/quota?clientHash=${hash}`);
        if (res.ok) {
          const qData = await res.json();
          setQuota({ used: qData.used, limit: qData.limit });
        }
      } catch (err) {
        console.error("Quota fetch failed:", err);
      }

      // Initial system greeting
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: `**${osFriendly[os] || os} / ${usecase}** 환경 확인했습니다. 어떤 증상이 나타나나요? 가능하면 오류 메시지 또는 스크린샷을 함께 보내주세요.`,
          timestamp: new Date().toISOString()
        }
      ]);
    }
    init();
  }, [os, usecase]);

  // 2. Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // 3. Textarea automatic resizing
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(140, textareaRef.current.scrollHeight)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  // 4. Handle text/image submission
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (loading || (!inputText.trim() && images.length === 0)) return;

    setErrorMessage("");
    const userText = inputText.trim();
    const attachedImages = images.map((img) => img.base64);
    
    // Create new user message block
    const userMessage: AssistantMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: userText || "이 이미지를 분석해 주세요.",
      images: attachedImages.length > 0 ? attachedImages : undefined,
      timestamp: new Date().toISOString()
    };

    // Optimistic UI updates
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setImages([]);
    setLoading(true);

    try {
      const payload = {
        clientHash,
        os,
        usecase,
        messages: [...messages, userMessage].map((m) => ({
          role: m.role,
          content: m.content,
          images: m.images
        })),
        images: attachedImages.length > 0 ? attachedImages : undefined,
        nonce: Math.random().toString(36).substring(7)
      };

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 429) {
        // Quota Limit reached
        setMessages((prev) => [
          ...prev,
          {
            id: `quota-error-${Date.now()}`,
            role: "assistant",
            content: data.reply || "일일 사용 한도에 도달했습니다.",
            timestamp: new Date().toISOString()
          }
        ]);
        if (data.quota) {
          setQuota({ used: data.quota.used, limit: data.quota.limit });
        }
      } else if (response.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.reply,
            timestamp: new Date().toISOString()
          }
        ]);
        if (data.quota) {
          setQuota({ used: data.quota.used, limit: data.quota.limit });
        }
      } else {
        throw new Error(data.error || "Failed to communicate with AI");
      }
    } catch (err: any) {
      console.error("Chat communication error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content: "지금 응답을 받아오지 못했어요. 잠시 후 다시 시도해 주세요.",
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  // 5. Intercept clipboard pasting (Ctrl+V) on textarea
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const pastedFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) pastedFiles.push(file);
      }
    }

    if (pastedFiles.length > 0) {
      e.preventDefault();
      // Pass files to validation logic
      if (images.length + pastedFiles.length > 4) {
        setErrorMessage("최대 4장의 이미지만 첨부할 수 있습니다.");
        return;
      }

      const maxSizeBytes = 8 * 1024 * 1024; // 8MB
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      pastedFiles.forEach((file) => {
        if (!allowedTypes.includes(file.type)) {
          setErrorMessage("JPG, PNG, WebP 형식의 이미지 파일만 업로드할 수 있습니다.");
          return;
        }
        if (file.size > maxSizeBytes) {
          setErrorMessage("파일 한 장당 최대 크기는 8MB입니다.");
          return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
          if (readerEvent.target?.result && typeof readerEvent.target.result === "string") {
            setImages((prev) => [
              ...prev,
              {
                id: Math.random().toString(36).substring(2, 9),
                file,
                base64: readerEvent.target!.result as string
              }
            ]);
            setErrorMessage("");
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // 6. Handle enter key press on textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-[980px] mx-auto flex flex-col rounded-[26px] border border-[var(--border-subtle)] bg-cream/70 backdrop-blur-xl shadow-lg relative overflow-hidden" data-lenis-prevent>
      
      {/* Panel Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4.5 bg-cream/90 border-b border-[var(--border-subtle)] select-none">
        
        {/* Dynamic OS & Usecase Context Indicators */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-2 border border-[var(--border-subtle)] text-[12px] font-bold text-primary">
            <span className="font-mono text-[9px] text-coral/80 uppercase tracking-widest mr-0.5">OS</span>
            <span>{osFriendly[os] || os}</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-2 border border-[var(--border-subtle)] text-[12px] font-bold text-primary">
            <span className="font-mono text-[9px] text-coral/80 uppercase tracking-widest mr-0.5">사용처</span>
            <span className="truncate max-w-[120px]">{usecase}</span>
          </div>

          {/* Edit Context Button */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-coral hover:text-coral-deep transition-colors duration-150 pl-1"
            aria-label="OS 및 사용처 수정"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>수정</span>
          </button>
        </div>

        {/* Real-time Daily Usage Badge */}
        <QuotaBadge used={quota.used} limit={quota.limit} />
      </header>

      {/* Messages Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 [scrollbar-width:thin]"
        style={{ height: "calc(100vh - 440px)", minHeight: "360px" }}
      >
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id || idx}
            message={msg}
            showHeader={idx === 0 || messages[idx - 1].role !== msg.role}
          />
        ))}

        {/* Typing indicator */}
        {loading && <TypingIndicator />}
      </div>

      {/* Error display */}
      {errorMessage && (
        <div className="mx-6 px-4 py-2 text-[11.5px] font-bold text-coral-deep bg-coral/8 border border-coral/15 rounded-xl flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Sticky Bottom Inputs */}
      <footer className="p-4 bg-cream/90 border-t border-[var(--border-subtle)] flex flex-col gap-2.5">
        
        {/* Multi-modal Image uploader preview/dragzone */}
        <ImageUploader images={images} onChange={setImages} />

        {/* Interactive Text Input Block */}
        <form onSubmit={handleSend} className="flex gap-2 items-end">
          <div className="flex-1 relative rounded-xl border border-[var(--border-subtle)] bg-white/70 focus-within:border-coral focus-within:bg-white transition-all duration-200">
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder="클로드 API 키 연동 실패, 401 오류, 도구 비호환 현상 등에 대해 상세히 물어보세요... (Shift+Enter 줄바꿈)"
              disabled={loading}
              className="w-full text-sm font-medium px-4 py-3 rounded-xl bg-transparent text-primary placeholder:text-secondary/45 outline-none resize-none overflow-y-auto leading-normal min-h-[46px] max-h-[140px] pr-10 [scrollbar-width:thin]"
            />
            {inputText.length > 0 && (
              <span className="absolute right-3 bottom-2 text-[9px] font-mono text-secondary/40 select-none">
                {inputText.length}/1500
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (!inputText.trim() && images.length === 0)}
            className={`grid h-11 w-11 place-items-center rounded-xl transition-all duration-200 shrink-0 shadow-sm ${
              loading || (!inputText.trim() && images.length === 0)
                ? "bg-peach/50 text-secondary/35 border border-[var(--border-subtle)] cursor-not-allowed"
                : "bg-coral hover:bg-coral-deep text-cream cursor-pointer"
            }`}
            aria-label="메시지 전송"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>

        {/* Unofficial warning footer */}
        <div className="text-center text-[10px] text-secondary/40 leading-normal border-t border-[var(--border-subtle)]/50 pt-2.5 mt-0.5 select-none">
          클코클라우드 어시스턴트는 클로드(Anthropic) 공식 제휴처가 아니며, 개별 외부 도구와의 연동 문제를 해결해 주는 무료 비공식 에이전트 서비스입니다.
        </div>
      </footer>
    </div>
  );
}
