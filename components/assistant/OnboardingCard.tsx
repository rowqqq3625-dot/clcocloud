"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { OSPicker, OSType } from "./OSPicker";
import { UsecaseInput } from "./UsecaseInput";
import { ArrowRight, HelpCircle } from "lucide-react";
import { squashTap } from "@/lib/motion";

interface OnboardingCardProps {
  onComplete: (os: OSType, usecase: string) => void;
}

export function OnboardingCard({ onComplete }: OnboardingCardProps) {
  const [os, setOs] = useState<OSType | null>(null);
  const [usecase, setUsecase] = useState("");

  const isValid = os !== null && usecase.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      onComplete(os, usecase.trim());
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[1040px] rounded-[30px] border border-[var(--border-subtle)] bg-cream/84 p-6 shadow-lg backdrop-blur-xl sm:p-9 md:p-12 relative overflow-hidden"
    >
      {/* Background radial glow */}
      <div className="pointer-events-none absolute -right-32 -top-32 h-[320px] w-[320px] rounded-full bg-coral/10 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[320px] w-[320px] rounded-full bg-peach/50 blur-[80px]" />

      <form onSubmit={handleSubmit} className="relative z-[1] flex flex-col gap-8 md:gap-10">
        {/* Step 1: OS Selection */}
        <OSPicker selected={os} onChange={setOs} />

        {/* Divider line */}
        <div className="h-[0.5px] w-full bg-[var(--border-subtle)] opacity-40" />

        {/* Step 2: Usecase Input */}
        <UsecaseInput value={usecase} onChange={setUsecase} />

        {/* Submit Action Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
          <div className="flex items-start gap-2.5 max-w-lg text-secondary select-none">
            <HelpCircle className="w-4 h-4 shrink-0 text-coral mt-0.5" />
            <p className="text-xs leading-normal">
              이 2단계 설정은 대화창 상단에서 언제든 클릭 한 번으로 수정할 수 있습니다. 
              클코클라우드 어시스턴트는 100% 익명으로 운영되며 개인 키 정보나 민감 데이터를 수집하지 않습니다.
            </p>
          </div>

          <motion.div whileTap={squashTap} className="shrink-0">
            <button
              type="submit"
              disabled={!isValid}
              className={`w-full sm:w-auto h-13 px-7 rounded-full text-[14px] font-bold transition-all duration-250 flex items-center justify-center gap-2.5 shadow-sm ${
                isValid
                  ? "bg-coral text-cream cursor-pointer hover:bg-coral-deep hover:shadow-md hover:-translate-y-0.5"
                  : "bg-peach/50 text-secondary/45 border border-[var(--border-subtle)] cursor-not-allowed"
              }`}
            >
              <span>어시스턴트 시작하기</span>
              <ArrowRight className={`w-4.5 h-4.5 transition-transform duration-200 ${isValid ? "translate-x-0.5" : ""}`} />
            </button>
          </motion.div>
        </div>
      </form>
    </motion.div>
  );
}
