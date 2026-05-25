import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Minus, Mail, RotateCcw, Copy, Check, Paperclip, X } from "lucide-react";
import Image from "next/image";
import { getClientHash } from "@/lib/bot/fingerprint";
import {
  loadSessionMessages,
  saveSessionMessages,
  clearSessionMessages,
  MessageWithTime
} from "@/lib/bot/sessionStore";
import { MessageBubble } from "./MessageBubble";
import { TemplateChips } from "./TemplateChips";
import { QuotaBadge } from "./QuotaBadge";
import { TypingIndicator } from "./TypingIndicator";

interface BotPanelProps {
  onClose: () => void;
}

export function BotPanel({ onClose }: BotPanelProps) {
  const [messages, setMessages] = useState<MessageWithTime[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usedCount, setUsedCount] = useState(0);
  const [dailyLimit, setDailyLimit] = useState(30);
  const [showChips, setShowChips] = useState(true);
  const [clientHash, setClientHash] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const panelRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드할 수 있습니다.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && typeof event.target.result === "string") {
        setSelectedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleResetConversation = () => {
    if (window.confirm("대화 내용을 초기화하시겠습니까?")) {
      clearSessionMessages();
      const welcome: MessageWithTime = {
        role: "assistant",
        content: `안녕하세요! 클코클라우드 AI입니다. 😊

클코클라우드 상품 요금제, 결제 방법, 발급 절차, 대시보드 사용법에 대해 친절히 안내해 드릴게요. 💡
궁금한 점이 있으시면 편하게 질문해 주세요! 🍀`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcome]);
      setShowChips(true);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("support.clcocloud@gmail.com");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 1. Fetch browser client hash and initial quota with LocalStorage persistent recovery
  useEffect(() => {
    let active = true;
    async function init() {
      const hash = await getClientHash();
      if (!active) return;
      setClientHash(hash);

      // KST date string for local storage quota key
      const todayStr = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }).format(new Date());
      const localKey = `clco_bot_usage_${todayStr}`;
      const localUsed = Number(localStorage.getItem(localKey) || "0");

      // Fetch usage quota
      try {
        const response = await fetch(`/api/bot/quota?clientHash=${hash}`, { cache: "no-store" });
        if (response.ok) {
          const quota = await response.json();
          if (active) {
            // Take the max of server value and client localStorage to guarantee consistency even during HMR restarts
            const finalUsed = Math.max(localUsed, quota.usedCount);
            setUsedCount(finalUsed);
            setDailyLimit(quota.dailyLimit);
            localStorage.setItem(localKey, String(finalUsed));
          }
        } else {
          if (active) {
            setUsedCount(localUsed);
          }
        }
      } catch (err) {
        console.error("Failed to fetch bot quota, relying on local storage backup", err);
        if (active) {
          setUsedCount(localUsed);
        }
      }
    }
    void init();
    return () => {
      active = false;
    };
  }, []);

  // 2. Load messages from sessionStorage
  useEffect(() => {
    const cached = loadSessionMessages();
    if (cached.length > 0) {
      setMessages(cached);
      setShowChips(false); // Hide starting templates if they have history
    } else {
      // Create initial welcome bubble
      const welcome: MessageWithTime = {
        role: "assistant",
        content: `안녕하세요! 클코클라우드 AI입니다. 😊

클코클라우드 상품 요금제, 결제 방법, 발급 절차, 대시보드 사용법에 대해 친절히 안내해 드릴게요. 💡
궁금한 점이 있으시면 편하게 질문해 주세요! 🍀`,
        timestamp: new Date().toISOString()
      };
      setMessages([welcome]);
      setShowChips(true);
    }
  }, []);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      saveSessionMessages(messages);
    }
  }, [messages]);

  // 3. Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom("smooth");
    const t = setTimeout(() => scrollToBottom("smooth"), 100);
    return () => clearTimeout(t);
  }, [messages, isLoading, showChips, scrollToBottom]);

  useEffect(() => {
    const t = setTimeout(() => scrollToBottom("auto"), 200);
    return () => clearTimeout(t);
  }, [scrollToBottom]);

  // Trigger closing transition
  const handleClose = React.useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 180); // match exit transition dur-fast
  }, [onClose]);

  const handleResolve = useCallback(() => {
    clearSessionMessages();
    const welcome: MessageWithTime = {
      role: "assistant",
      content: `안녕하세요! 클코클라우드 AI입니다. 😊

클코클라우드 상품 요금제, 결제 방법, 발급 절차, 대시보드 사용법에 대해 친절히 안내해 드릴게요. 💡
궁금한 점이 있으시면 편하게 질문해 주세요! 🍀`,
      timestamp: new Date().toISOString()
    };
    setMessages([welcome]);
    setShowChips(true);
    handleClose();
  }, [handleClose]);

  // 4. Global Escape key closure listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleClose]);

  // Close chatbot when clicking or interacting outside of the chat panel popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const launcher = document.querySelector(".bot-launcher-btn");
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        (!launcher || !launcher.contains(event.target as Node))
      ) {
        handleClose();
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [handleClose]);

  // Adjust textarea height automatically up to 4 lines
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= 600) {
      setInputText(text);
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  // Send message action
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if ((!text && !selectedImage) || isLoading || usedCount >= dailyLimit) return;

    // Reset inputs
    setInputText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Hide chips immediately with fade transition
    setShowChips(false);

    // Append user message
    const userMsg: MessageWithTime = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
      ...(selectedImage ? { image: selectedImage } : {})
    };
    setMessages((prev) => [...prev, userMsg]);
    
    // Save image to a temporary variable and reset preview state
    setSelectedImage(null);
    setIsLoading(true);

    // Call chat endpoint
    const nonce = Math.random().toString(36).substring(2, 15);
    try {
      const payloadMessages = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
        image: m.image
      }));

      const response = await fetch("/api/bot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientHash,
          messages: payloadMessages,
          nonce
        })
      });

      if (response.ok) {
        const data = await response.json();
        setUsedCount(data.usedCount);
        setDailyLimit(data.dailyLimit);

        // Update localStorage quota backup
        const todayStr = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Seoul",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(new Date());
        localStorage.setItem(`clco_bot_usage_${todayStr}`, String(data.usedCount));

        const botMsg: MessageWithTime = {
          role: "assistant",
          content: data.content,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, botMsg]);
      } else if (response.status === 429) {
        // Quota limit hit
        const data = await response.json();
        setUsedCount(data.usedCount || dailyLimit);
        const limitMsg: MessageWithTime = {
          role: "assistant",
          content: data.content || `오늘의 상담 한도(30회)에 도달했습니다. 내일 자정 이후 다시 도와드릴게요. 급하시면 support.clcocloud@gmail.com 으로 연락 부탁드립니다.`,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, limitMsg]);
      } else {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.content || "Server error");
      }
    } catch (err: any) {
      console.error(err);
      const errMsg: MessageWithTime = {
        role: "assistant",
        content: err.message || "잠시 후 다시 시도해 주세요 (네트워크 연결 오류).",
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const isExceeded = usedCount >= dailyLimit;

  // Determine if timestamp header should be shown (e.g. first message, or 5 minutes elapsed)
  const shouldShowTimestamp = (index: number) => {
    if (index === 0) return true;
    const current = new Date(messages[index].timestamp).getTime();
    const previous = new Date(messages[index - 1].timestamp).getTime();
    return current - previous > 5 * 60 * 1000;
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        /* Responsive sizing */
        .bot-panel-wrapper {
          position: fixed;
          background-color: var(--cream);
          border: 1px solid var(--line);
          border-radius: 20px;
          box-shadow: 0 12px 40px -10px rgba(31, 30, 29, 0.12), 0 8px 24px -12px rgba(217, 119, 87, 0.1);
          display: flex;
          flex-direction: column;
          z-index: 50;
          overflow: hidden;
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 240ms ease;
        }

        /* Desktop Positioning */
        @media (min-width: 768px) {
          .bot-panel-wrapper {
            right: 36px;
            bottom: 98px;
            width: 356px; /* 310px * 1.15 = 356.5px */
            height: 518px; /* 450px * 1.15 = 517.5px */
            max-height: 80vh;
            transform: translateY(0);
            opacity: 1;
            transform-origin: bottom right;
          }
          .bot-panel-wrapper.entrance {
            animation: panel-enter 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .bot-panel-wrapper.exit {
            animation: panel-exit 220ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
        }

        /* Mobile Positioning */
        @media (max-width: 767px) {
          .bot-panel-wrapper {
            left: 0;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 80vh;
            border-bottom-left-radius: 0;
            border-bottom-right-radius: 0;
            border-top-left-radius: 24px;
            border-top-right-radius: 24px;
            box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.12);
            transform: translateY(0);
            transform-origin: bottom center;
          }
          .bot-panel-wrapper.entrance {
            animation: panel-slide-up-mobile 280ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
          .bot-panel-wrapper.exit {
            animation: panel-slide-down-mobile 180ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          }
        }

        /* Desktop animations */
        @keyframes panel-enter {
          0% {
            opacity: 0;
            transform: scale(0.4) translate(30px, 30px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translate(0, 0);
          }
        }
        @keyframes panel-exit {
          0% {
            opacity: 1;
            transform: scale(1) translate(0, 0);
          }
          100% {
            opacity: 0;
            transform: scale(0.4) translate(30px, 30px);
          }
        }

        /* Mobile animations */
        @keyframes panel-slide-up-mobile {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes panel-slide-down-mobile {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(100%);
          }
        }

        /* Message scrollbar container styling */
        .msg-scroll-area::-webkit-scrollbar {
          width: 6px;
        }
        .msg-scroll-area::-webkit-scrollbar-track {
          background: transparent;
        }
        .msg-scroll-area::-webkit-scrollbar-thumb {
          background: rgba(217, 119, 87, 0.25);
          border-radius: 999px;
        }
        .msg-scroll-area::-webkit-scrollbar-thumb:hover {
          background: var(--coral-soft);
        }

        /* Strip all outlines, borders, and rings from the chat input textarea on focus and active states */
        .bot-panel-wrapper textarea,
        .bot-panel-wrapper textarea:focus,
        .bot-panel-wrapper textarea:active,
        .bot-panel-wrapper textarea:focus-visible,
        .bot-panel-wrapper textarea:focus-within {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          background: transparent !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
        }

        @media (prefers-reduced-motion: reduce) {
          .bot-panel-wrapper, .bot-panel-wrapper.entrance, .bot-panel-wrapper.exit {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}} />

      {/* Mobile backdrop shadow layer */}
      <div
        className="fixed inset-0 bg-[#1F1E1D]/42 backdrop-blur-[8px] z-40 md:hidden transition-opacity duration-200"
        onClick={handleClose}
        style={{
          backgroundColor: "rgba(31, 30, 29, 0.42)",
          opacity: isClosing ? 0 : 1
        }}
      />

      <div
        ref={panelRef}
        className={`bot-panel-wrapper ${isClosing ? "exit" : "entrance"}`}
        role="dialog"
        aria-modal="false"
        aria-label="클코클라우드 AI"
      >
        {/* Header Section (48px) */}
        <div className="h-12 flex items-center justify-between px-4 border-b border-[var(--border-subtle)] shrink-0 bg-[var(--cream-2)]">
          <div className="flex flex-col shrink-0">
            <div className="flex items-center gap-2 shrink-0">
              <Image
                src="/ai-icon.png"
                alt="클코클라우드AI 아바타"
                width={24}
                height={24}
                className="rounded-full overflow-hidden shrink-0 object-contain"
              />
              <span className="text-[14.5px] font-semibold text-[var(--ink)] tracking-tight whitespace-nowrap shrink-0">클코클라우드AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <QuotaBadge usedCount={usedCount} dailyLimit={dailyLimit} />
            <button
              type="button"
              onClick={handleResetConversation}
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--border-subtle)] bg-[var(--cream)] hover:border-[var(--coral-soft)] text-[var(--ink-soft)] hover:text-[var(--coral)] transition-colors focus-visible:outline-2"
              aria-label="대화 초기화"
              title="대화 초기화"
            >
              <RotateCcw size={13} />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center justify-center w-7 h-7 rounded-lg border border-[var(--border-subtle)] bg-[var(--cream)] hover:border-[var(--coral-soft)] text-[var(--ink-soft)] hover:text-[var(--coral)] transition-colors focus-visible:outline-2"
              aria-label="최소화"
            >
              <Minus size={14} />
            </button>
          </div>
        </div>

        {/* Message Thread Scroll Area */}
        <div
          data-lenis-prevent
          className="flex-1 overflow-y-auto px-5 py-4 msg-scroll-area flex flex-col gap-3"
        >
          {messages.map((msg, index) => (
            <MessageBubble
              key={index}
              message={msg}
              showTimestampHeader={shouldShowTimestamp(index)}
              onResolve={handleResolve}
            />
          ))}

          {/* Starting template chips zone */}
          {showChips && (
            <div className="transition-opacity duration-240">
              <TemplateChips onSelectChip={handleSendMessage} />
            </div>
          )}

          {/* Backlink to restore chips if hidden */}
          {!showChips && !isLoading && !isExceeded && (
            <div className="flex justify-start my-1 pl-1">
              <button
                type="button"
                onClick={() => setShowChips(true)}
                className="text-[11.5px] font-semibold text-[var(--coral)] hover:text-[var(--coral-soft)] transition-colors border-b border-[var(--coral)]/50 pb-0.5"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
              >
                + 다른 주제로 묻기
              </button>
            </div>
          )}

          {isLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Footer Input Box */}
        <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--cream-2)] shrink-0">
          {isExceeded ? (
            <div className="flex flex-col gap-2 p-1 text-center">
              <a
                href="mailto:support.clcocloud@gmail.com"
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[var(--coral)] hover:bg-[var(--coral-deep)] text-[var(--cream)] font-bold text-sm shadow transition focus-visible:outline-2"
              >
                <Mail size={16} />
                이메일로 문의하기
              </a>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="inline-flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--cream)] hover:bg-[var(--cream-2)] text-[var(--ink)] font-bold text-sm shadow transition focus-visible:outline-2"
              >
                {copied ? <Check size={16} className="text-[var(--success)]" /> : <Copy size={15} />}
                {copied ? "이메일 복사 완료" : "이메일 복사하기"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {/* Premium Image Attachment Preview */}
              {selectedImage && (
                <div className="mb-1 relative inline-block p-1 bg-[var(--cream)] border border-[var(--border-subtle)] rounded-xl shadow-sm animate-fade-in self-start group">
                  <img
                    src={selectedImage}
                    alt="Selected attachment"
                    className="h-12 w-12 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[var(--coral)] text-[var(--cream)] flex items-center justify-center shadow hover:bg-[var(--coral-deep)] transition-colors border-none cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}

              <div className="relative flex items-end gap-2 bg-[var(--cream)] border border-[var(--border-subtle)] rounded-2xl p-1.5 focus-within:border-[var(--ink-soft)] focus-within:ring-2 focus-within:ring-[var(--ink-soft)]/10 transition-all shadow-[0_2px_8px_-2px_rgba(217,119,87,0.06)]">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {/* Attachment Icon Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--ink-soft)] hover:text-[var(--coral)] hover:bg-[var(--cream-2)] border border-[var(--border-subtle)] bg-[var(--cream)] transition-all shrink-0 cursor-pointer"
                  title="이미지 첨부"
                >
                  <Paperclip size={15} />
                </button>

                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="메시지를 입력하세요..."
                  rows={1}
                  data-lenis-prevent
                  className="flex-1 resize-none bg-transparent outline-none border-none py-1.5 px-1.5 text-sm text-[var(--ink)] placeholder-[var(--ink-faint)] leading-relaxed max-h-[100px] min-h-[36px] focus:outline-none focus:ring-0 focus:border-none"
                  style={{ overflowY: "auto", outline: "none", border: "none", boxShadow: "none" }}
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={(!inputText.trim() && !selectedImage) || isLoading}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                    (inputText.trim() || selectedImage) && !isLoading
                      ? "bg-[var(--coral)] hover:bg-[var(--coral-deep)] text-[var(--cream)] cursor-pointer shadow-sm"
                      : "bg-[var(--line)] text-[var(--ink-faint)] cursor-not-allowed"
                  }`}
                  aria-label="보내기"
                >
                  <Send size={15} />
                </button>
              </div>

              <div className="flex justify-end pr-1.5">
                <span className="font-mono text-[9.5px] text-[var(--ink-faint)] select-none">
                  {inputText.length}/600자
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
