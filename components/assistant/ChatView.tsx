"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ContextBar } from "./ContextBar";
import { AssistantMessage } from "./AssistantMessage";
import { UserMessage } from "./UserMessage";
import { Composer } from "./Composer";
import { TypingPulse } from "./TypingPulse";
import { CommandPalette } from "./CommandPalette";
import { OSType } from "./OSChips";
import { getClientHash } from "@/lib/assistant/fingerprint";

export interface MessageType {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  images?: string[];
  timestamp?: string | number;
}

interface ChatViewProps {
  os: OSType;
  usecase: string;
  onBack: () => void;
  onNewChat: () => void;
  activeSessionIdExternal?: string | null;
}

const osFriendly: Record<string, string> = {
  macos: "macOS",
  powershell: "PowerShell",
  cmd: "Windows CMD",
  linux: "Linux"
};

export function ChatView({ os, usecase, onBack, onNewChat, activeSessionIdExternal }: ChatViewProps) {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const [quota, setQuota] = useState({ used: 0, limit: 15 });
  const [clientHash, setClientHash] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [codeOnlyMode, setCodeOnlyMode] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 1. Save session state helper
  const saveSessionToStorage = useCallback((sessId: string, updatedMsgs: MessageType[]) => {
    if (!sessId) return;
    const sessionsRaw = localStorage.getItem("clco_assistant_sessions");
    let sessionsList: any[] = [];
    if (sessionsRaw) {
      try {
        sessionsList = JSON.parse(sessionsRaw);
      } catch (e) {}
    }

    const sessionObj = {
      id: sessId,
      os,
      usecase,
      messages: updatedMsgs,
      timestamp: Date.now()
    };

    const existingIdx = sessionsList.findIndex((s) => s.id === sessId);
    if (existingIdx !== -1) {
      sessionsList[existingIdx] = sessionObj;
    } else {
      sessionsList.push(sessionObj);
    }

    // Limit sessions to 10 overall in storage to prevent memory overflow, sort by timestamp
    const sorted = sessionsList
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10);

    localStorage.setItem("clco_assistant_sessions", JSON.stringify(sorted));
  }, [os, usecase]);

  // 2. Initial Session Mount & Greeting Recovery
  useEffect(() => {
    async function init() {
      // 1-1. Fingerprint
      const hash = await getClientHash();
      setClientHash(hash);

      // 1-2. Fetch Quota
      try {
        const res = await fetch(`/api/assistant/quota?clientHash=${hash}`);
        if (res.ok) {
          const qData = await res.json();
          setQuota({ used: qData.used, limit: qData.limit });
        }
      } catch (err) {
        console.error("Quota fetch failed:", err);
      }

      // 1-3. Find or Create active session ID
      let sessionId = activeSessionIdExternal || localStorage.getItem("clco_assistant_active_session_id") || "";
      
      if (!sessionId) {
        sessionId = `session-${Date.now()}`;
        localStorage.setItem("clco_assistant_active_session_id", sessionId);
      }
      setActiveSessionId(sessionId);

      // 1-4. Restore history from localStorage if exists
      const sessionsRaw = localStorage.getItem("clco_assistant_sessions");
      let restoredMessages: MessageType[] | null = null;
      
      if (sessionsRaw) {
        try {
          const parsed = JSON.parse(sessionsRaw);
          const found = parsed.find((s: any) => s.id === sessionId);
          if (found && found.messages && found.messages.length > 0) {
            restoredMessages = found.messages;
          }
        } catch (err) {
          console.error("Failed to restore past session:", err);
        }
      }

      if (restoredMessages) {
        setMessages(restoredMessages);
      } else {
        // Create fresh concise greeting
        const initialGreeting: MessageType = {
          id: "greeting",
          role: "assistant",
          content: `문제 상황을 이미지와 함께 설명해 주시면 바로 진단해 드릴게요! 🛠️`,
          timestamp: new Date().toISOString()
        };
        setMessages([initialGreeting]);
        
        // Save initial greeting
        saveSessionToStorage(sessionId, [initialGreeting]);
      }
    };
    init();
  }, [os, usecase, activeSessionIdExternal, saveSessionToStorage]);

  // Force window scroll to top on mount to recover from any lingering scroll offsets (e.g. from hot reloads or previous scrollIntoView bugs)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // Scroll to bottom safely using scrollTop to prevent viewport layout shift
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [messages.length, loading]);

  // 3. Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 4. Send Message Action
  const handleSend = useCallback(async (content: string, images?: string[], customHistory?: MessageType[]) => {
    if (loading) return;

    const userMessage: MessageType = {
      id: `user-${Date.now()}`,
      role: "user",
      content: content || "이 이미지를 분석해 주세요.",
      images: images && images.length > 0 ? images : undefined,
      timestamp: new Date().toISOString()
    };

    const historyToUse = customHistory || messages;
    const optimisticHistory = [...historyToUse, userMessage];

    // Optimistic UI update
    setMessages(optimisticHistory);
    saveSessionToStorage(activeSessionId, optimisticHistory);
    setLoading(true);

    try {
      const payload = {
        clientHash,
        os,
        usecase,
        messages: optimisticHistory.map((m) => ({
          role: m.role,
          content: m.content,
          images: m.images
        })),
        images: images && images.length > 0 ? images : undefined,
        nonce: Math.random().toString(36).substring(7)
      };

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.status === 429) {
        const quotaErrorMsg: MessageType = {
          id: `quota-error-${Date.now()}`,
          role: "assistant",
          content: data.reply || "일일 사용 한도에 도달했습니다.",
          timestamp: new Date().toISOString()
        };
        const finalHistory = [...optimisticHistory, quotaErrorMsg];
        setMessages(finalHistory);
        saveSessionToStorage(activeSessionId, finalHistory);
        if (data.quota) {
          setQuota({ used: data.quota.used, limit: data.quota.limit });
        }
      } else if (response.ok) {
        const assistantReply: MessageType = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply,
          timestamp: new Date().toISOString()
        };
        const finalHistory = [...optimisticHistory, assistantReply];
        setMessages(finalHistory);
        saveSessionToStorage(activeSessionId, finalHistory);
        if (data.quota) {
          setQuota({ used: data.quota.used, limit: data.quota.limit });
        }
      } else {
        throw new Error(data.error || "Failed to communicate with AI");
      }
    } catch (err: any) {
      console.error("Chat communication error:", err);
      const networkErrorMsg: MessageType = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "지금 응답을 받아오지 못했어요. 잠시 후 다시 시도해 주세요.",
        timestamp: new Date().toISOString()
      };
      const finalHistory = [...optimisticHistory, networkErrorMsg];
      setMessages(finalHistory);
      saveSessionToStorage(activeSessionId, finalHistory);
    } finally {
      setLoading(false);
    }
  }, [clientHash, os, usecase, messages, loading, activeSessionId, saveSessionToStorage]);

  // 5. Rebuild last response action (↻ retry)
  const handleRebuild = useCallback((targetIndex: number) => {
    if (loading) return;

    // Find the closest preceding user message to trigger retry
    let lastUserMsgIndex = -1;
    for (let i = targetIndex - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMsgIndex = i;
        break;
      }
    }

    if (lastUserMsgIndex === -1) return;

    const lastUserMsg = messages[lastUserMsgIndex];
    const slicedHistory = messages.slice(0, lastUserMsgIndex);

    handleSend(lastUserMsg.content, lastUserMsg.images, slicedHistory);
  }, [messages, loading, handleSend]);

  // 6. Pill Button changes / back focus trigger
  const handleBackToField = (field: "os" | "usecase") => {
    localStorage.setItem("clco_assistant_focus_field", field);
    onBack();
  };

  // 7. Command Palette Action executor
  const handlePaletteAction = (actionKey: string) => {
    switch (actionKey) {
      case "reset":
        onNewChat();
        break;
      case "change-os":
        handleBackToField("os");
        break;
      case "change-usecase":
        handleBackToField("usecase");
        break;
      case "code-only":
        setCodeOnlyMode((prev) => !prev);
        break;
      case "screenshot": {
        const clipBtn = document.querySelector('button[aria-label="이미지 파일 첨부"]') as HTMLButtonElement;
        if (clipBtn) clipBtn.click();
        break;
      }
      case "contact-support":
        navigator.clipboard.writeText("support.clcocloud@gmail.com");
        alert("운영자 이메일 주소(support.clcocloud@gmail.com)가 클립보드에 복사되었습니다.");
        break;
      default:
        break;
    }
  };

  // Filter messages if Code-Only Mode is active
  const displayedMessages = codeOnlyMode
    ? messages.filter((m) => m.role === "user" || m.content.includes("```") || m.content.includes("`"))
    : messages;

  return (
    <div className="w-full flex-1 flex flex-col overflow-hidden max-w-[800px] mx-auto relative min-h-0">
      <ContextBar
        os={os}
        usecase={usecase}
        quota={quota}
        onBackToField={handleBackToField}
        onNewChat={onNewChat}
      />

      {/* Code-only Mode active banner */}
      {codeOnlyMode && (
        <div className="w-full bg-peach/40 border border-[var(--border-subtle)] text-ink-65 text-xs py-2 px-4 rounded-xl mt-3 flex items-center justify-between animate-fade-up select-none shrink-0 z-10 relative">
          <span>현재 **코드 조각만 추출해 보기** 필터가 작동 중입니다.</span>
          <button 
            type="button" 
            onClick={() => setCodeOnlyMode(false)}
            className="text-coral font-bold hover:underline"
          >
            해제
          </button>
        </div>
      )}

      {/* Messages Container - 스크롤 가능한 메시지 영역 */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain w-full pr-1.5 flex flex-col gap-8 z-10 relative pt-5 pb-4 min-h-0"
      >
        {/* 웰컴 안내 카드 섹션 (Greeting Card - Replaces standard chat bubble format!) */}
        <div className="w-full bg-cream-2 border border-coral/20 rounded-2xl p-5 shadow-[0_4px_24px_rgba(217,119,87,0.03)] select-none shrink-0 mb-2 mt-6">
          <div className="flex items-start gap-3.5">
            <span className="text-xl shrink-0 mt-0.5" aria-hidden="true">💡</span>
            <div className="flex-1">
              <h3 className="text-[13px] font-bold text-ink-100 mb-1">도움말</h3>
              <p className="text-[13px] text-ink-65 leading-relaxed font-medium">
                문제상황을 이미지와 함께 설명해주시면 제가 진단해드릴게요!
              </p>
            </div>
          </div>
        </div>

        {/* Message Bubble Mapping */}
        {displayedMessages.map((msg, idx) => {
          // greeting 메시지는 위의 고정 가이드 카드로 대체했으므로 렌더링을 건너뜁니다.
          if (msg.id === "greeting") return null;

          if (msg.role === "user") {
            return (
              <UserMessage 
                key={msg.id || idx} 
                content={msg.content} 
                images={msg.images} 
              />
            );
          } else {
            return (
              <AssistantMessage
                key={msg.id || idx}
                message={msg}
                onRebuild={msg.id === "greeting" ? undefined : () => handleRebuild(idx)}
              />
            );
          }
        })}

        {/* Loading Indicator */}
        {loading && <TypingPulse />}
        
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Bottom STICKY Composer (절대 줄어들지 않고 하단에 고정) */}
      <div className="w-full pt-3 pb-5 z-30" style={{ flexShrink: 0, background: 'var(--bg-cream)' }}>
        <Composer onSend={(txt, img) => handleSend(txt, img)} disabled={loading} />
      </div>

      {/* Spotlight Command Palette (⌥K / Ctrl+K) */}
      <CommandPalette
        isOpen={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onAction={handlePaletteAction}
      />
    </div>
  );
}
