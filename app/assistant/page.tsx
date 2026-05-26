"use client";

import React, { useState, useEffect } from "react";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { IntroScreen } from "@/components/assistant/IntroScreen";
import { ChatView } from "@/components/assistant/ChatView";
import { OSType } from "@/components/assistant/OSChips";
import { motion } from "framer-motion";
import { LoginRequiredModal } from "@/components/auth/LoginRequiredModal";

interface SessionItem {
  id: string;
  os: OSType;
  usecase: string;
  timestamp: number;
  messages: any[];
}

export default function AssistantPage() {
  const [step, setStep] = useState<"onboarding" | "chat">("onboarding");
  const [os, setOs] = useState<OSType | null>(null);
  const [usecase, setUsecase] = useState("");
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Strict authentication check on mount to restrict access to members only
  useEffect(() => {
    async function checkAuthentication() {
      try {
        const res = await fetch("/api/session");
        if (res.ok) {
          const data = await res.json();
          if (!data.authenticated) {
            setIsAuthenticated(false);
            setShowLoginModal(true);
            return;
          } else {
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
          setShowLoginModal(true);
          return;
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setIsAuthenticated(false);
        setShowLoginModal(true);
      } finally {
        setCheckingAuth(false);
      }
    }
    checkAuthentication();
  }, []);

  // Lock scrolling on html/body and freeze Lenis while inside the Assistant page
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Preserve original styles
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;
    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyHeight = document.body.style.height;

    // Apply strict overflow hidden to prevent body scrolling
    document.documentElement.style.overflow = "hidden";
    document.documentElement.style.height = "100dvh";
    document.body.style.overflow = "hidden";
    document.body.style.height = "100dvh";

    // Freeze Lenis scrolling engine
    const lenis = (window as any).__clcoLenis;
    if (lenis) {
      lenis.stop();
      lenis.scrollTo(0, { immediate: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });

    return () => {
      // Restore original styles
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = originalHtmlHeight;
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.height = originalBodyHeight;

      if (lenis) {
        lenis.start();
      }
    };
  }, []);

  // Force scroll reset when transitioning between onboarding and active chat
  useEffect(() => {
    if (typeof window === "undefined") return;

    const resetScroll = () => {
      const lenis = (window as any).__clcoLenis;
      if (lenis) {
        lenis.scrollTo(0, { immediate: true });
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    };

    // Run immediately and also in a tiny timeout to ensure rendering cycles are complete
    resetScroll();
    const timer = setTimeout(resetScroll, 50);

    return () => clearTimeout(timer);
  }, [step]);

  // 1. Sync session state and history on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const activeId = localStorage.getItem("clco_assistant_active_session_id");
      const sessionsRaw = localStorage.getItem("clco_assistant_sessions");
      
      if (activeId && sessionsRaw) {
        try {
          const sessions = JSON.parse(sessionsRaw) as SessionItem[];
          const currentSession = sessions.find((s) => s.id === activeId);
          if (currentSession) {
            setOs(null); // 사용자가 처음 고르기 이전까지는 선택 미리 안 되어 있게 null로 둡니다.
            setUsecase(""); // 자동채움 없이 빈 칸으로 둡니다.
            setActiveSessionId(currentSession.id);
            // step은 "onboarding" 상태로 기동하여 메인화면을 먼저 보여줍니다.
          }
        } catch (e) {
          console.error("Failed to restore active session state:", e);
        }
      }
      setLoading(false);
    }
  }, []);

  const handleOsChange = (selectedOS: OSType) => {
    setOs(selectedOS);
  };

  const handleUsecaseChange = (val: string) => {
    setUsecase(val);
  };

  // Triggered when starting a new onboarding chat
  const handleStart = () => {
    if (!os || !usecase.trim()) return;
    
    // 이전 세션 ID가 유효하게 남아있다면 기존 세션으로 진입, 없다면 새로 생성
    let sessionToUse = activeSessionId;
    if (!sessionToUse) {
      sessionToUse = `session-${Date.now()}`;
      localStorage.setItem("clco_assistant_active_session_id", sessionToUse);
      setActiveSessionId(sessionToUse);
    } else {
      // 기존 세션을 복구해서 가져갈 때도, 새로 작성한 usecase와 os를 저장해줍니다.
      const sessionsRaw = localStorage.getItem("clco_assistant_sessions");
      if (sessionsRaw) {
        try {
          const sessions = JSON.parse(sessionsRaw) as SessionItem[];
          const idx = sessions.findIndex((s) => s.id === sessionToUse);
          if (idx !== -1) {
            sessions[idx].os = os;
            sessions[idx].usecase = usecase.trim();
            localStorage.setItem("clco_assistant_sessions", JSON.stringify(sessions));
          }
        } catch (e) {}
      }
    }
    
    localStorage.setItem("clco_assistant_os", os);
    localStorage.setItem("clco_assistant_usecase", usecase.trim());
    setStep("chat");
  };

  const handleBack = () => {
    // Return to onboarding to edit, preserving current inputs
    setStep("onboarding");
  };

  // Restore a historical session clicked from RecentChats accordion
  const handleSelectSession = (sessionId: string) => {
    const sessionsRaw = localStorage.getItem("clco_assistant_sessions");
    if (!sessionsRaw) return;

    try {
      const sessions = JSON.parse(sessionsRaw) as SessionItem[];
      const found = sessions.find((s) => s.id === sessionId);
      if (found) {
        setOs(found.os);
        setUsecase(found.usecase);
        setActiveSessionId(found.id);
        localStorage.setItem("clco_assistant_active_session_id", found.id);
        setStep("chat");
      }
    } catch (e) {
      console.error("Failed to select past session:", e);
    }
  };

  // Start a fresh new chat session ("새 채팅")
  const handleNewChat = () => {
    localStorage.removeItem("clco_assistant_active_session_id");
    localStorage.removeItem("clco_assistant_focus_field");
    setOs(null);
    setUsecase("");
    setActiveSessionId(null);
    setStep("onboarding");
  };

  const pageTransition = {
    duration: 0.36,
    ease: [0.22, 1, 0.36, 1] as const,
  };

  return (
    <>
      {/* SEO Title and Meta */}
      <title>클코클라우드 어시스턴트 | Claude API 연동 문제 해결 무인 채널</title>
      <meta name="description" content="클로드 API 키 연동 실패, 401 오류, 프록시, CORS, 결제 의문 등 클로드 API 사용에 관한 모든 CS 문의를 AI 어시스턴트가 3단계 무장벽 인터페이스로 100% 무인 해결해 드립니다." />

      <main data-nosnippet className="assistant-page noise relative overflow-hidden selection:bg-coral selection:text-cream h-[100dvh] flex flex-col">
        {/* Poetic background lighting */}
        <div className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-coral/8 blur-[180px]" />
        <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/60 blur-[200px]" />

        {/* Floating Top Nav Menu (Only shown on onboarding) */}
        {step === "onboarding" && <SiteHeader variant="floating" />}

        {/* Core Layout Shell - flex-1 min-h-0으로 남은 높이를 정확히 점유하고 스크롤 지원 */}
        <section className="container-cinematic relative z-10 flex-1 flex flex-col overflow-hidden min-h-0">
          {loading || checkingAuth || isAuthenticated === null ? (
            <div className="flex items-center justify-center flex-1">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-coral border-t-transparent" />
                <p className="t-mono text-[10px] text-ink-65 uppercase tracking-widest">환경 로드 중...</p>
              </div>
            </div>
          ) : isAuthenticated === false ? (
            /* 비회원이면 배경화면에 아무것도 보여주지 않고 빈 화면 렌더 */
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="font-mono text-[11px] text-[#A8A29C] uppercase tracking-widest">인증 대기 중...</p>
            </div>
          ) : step === "onboarding" ? (
            /* 온보딩: Framer Motion 애니메이션 유지 (height 이슈 없음) */
            <motion.div
              key="onboarding"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={pageTransition}
              className="flex-1 flex flex-col min-h-0 w-full"
            >
              <IntroScreen
                selectedOs={os}
                onOsChange={handleOsChange}
                usecase={usecase}
                onUsecaseChange={handleUsecaseChange}
                onStart={handleStart}
                onSelectSession={handleSelectSession}
              />
            </motion.div>
          ) : os && usecase ? (
            /* 채팅: min-h-0 flex-1로 남은 높이 점유 */
            <div className="flex-1 flex flex-col w-full min-h-0">
              <ChatView
                os={os}
                usecase={usecase}
                onBack={handleBack}
                onNewChat={handleNewChat}
                activeSessionIdExternal={activeSessionId}
              />
            </div>
          ) : null}
        </section>
      </main>

      <LoginRequiredModal
        open={showLoginModal}
        onClose={() => {
          window.location.href = "/";
        }}
        returnTo="/assistant"
      />
    </>
  );
}

