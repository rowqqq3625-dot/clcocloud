"use client";

import React, { useState, useEffect } from "react";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { OnboardingCard } from "@/components/assistant/OnboardingCard";
import { ChatPanel } from "@/components/assistant/ChatPanel";
import { OSType } from "@/components/assistant/OSPicker";
import { motion, AnimatePresence } from "framer-motion";
import { SplitHeading } from "@/components/typography/SplitHeading";
import { wipeReveal } from "@/lib/motion";
import Head from "next/head";

export default function AssistantPage() {
  const [step, setStep] = useState<"onboarding" | "chat">("onboarding");
  const [os, setOs] = useState<OSType | null>(null);
  const [usecase, setUsecase] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Restore context session from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedOS = localStorage.getItem("clco_assistant_os");
      const savedUsecase = localStorage.getItem("clco_assistant_usecase");
      
      if (savedOS && savedUsecase) {
        setOs(savedOS as OSType);
        setUsecase(savedUsecase);
        setStep("chat");
      }
      setLoading(false);
    }
  }, []);

  const handleComplete = (selectedOS: OSType, enteredUsecase: string) => {
    localStorage.setItem("clco_assistant_os", selectedOS);
    localStorage.setItem("clco_assistant_usecase", enteredUsecase);
    setOs(selectedOS);
    setUsecase(enteredUsecase);
    setStep("chat");
  };

  const handleReset = () => {
    localStorage.removeItem("clco_assistant_os");
    localStorage.removeItem("clco_assistant_usecase");
    setOs(null);
    setUsecase("");
    setStep("onboarding");
  };

  return (
    <>
      {/* SEO Best Practices Title and Tags */}
      <title>클코클라우드 어시스턴트 | Claude API 연동 문제 해결 무인 채널</title>
      <meta name="description" content="클로드 API 키 연동 실패, 401 오류, 프록시, CORS, 결제 의문 등 클로드 API 사용에 관한 모든 CS 문의를 AI 어시스턴트가 3단계 무장벽 인터페이스로 100% 무인 해결해 드립니다." />
      
      <main className="dashboard-page-shell noise relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-10">
        {/* Cinematic ambient lighting */}
        <div className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-coral/8 blur-[180px]" />
        <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/60 blur-[200px]" />

        {/* Global floating nav header */}
        <SiteHeader variant="floating" />

        <section className="container-cinematic relative z-[1] mt-8 sm:mt-12">
          {/* Main Title Section */}
          <header className="mb-10 max-w-[760px] border-l border-coral pl-5">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-coral">AI CS Engineer</span>
            <SplitHeading
              as="h1"
              id="assistant-main-title"
              className="mt-3 max-w-[720px] text-[clamp(34px,5.4vw,70px)] font-[680] leading-[1.12] tracking-[-0.03em] text-primary"
              lines={["어시스턴트 상담"]}
            />
            <p className="mt-4 max-w-[620px] text-sm leading-[1.65] text-secondary font-medium">
              클로드(Anthropic) API 키 사용과 관련된 연동 실패, 오류 해결, 코드 작성 및 환경 세팅 등 
              모든 CS 의문을 단 한 번에 해결하는 전문 디버깅 창구입니다.
            </p>
            <motion.span
              className="mt-5 block h-[1.5px] w-10 bg-coral"
              initial="hidden"
              animate="visible"
              variants={wipeReveal}
            />
          </header>

          {/* Loader Overlay until local storage context is evaluated */}
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-coral border-t-transparent" />
                <p className="font-mono text-xs text-secondary">어시스턴트 환경 불러오는 중...</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {step === "onboarding" ? (
                <motion.div
                  key="onboarding"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.3 }}
                  className="flex justify-center"
                >
                  <OnboardingCard onComplete={handleComplete} />
                </motion.div>
              ) : (
                os && usecase && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChatPanel os={os} usecase={usecase} onReset={handleReset} />
                  </motion.div>
                )
              )}
            </AnimatePresence>
          )}
        </section>
      </main>
    </>
  );
}
