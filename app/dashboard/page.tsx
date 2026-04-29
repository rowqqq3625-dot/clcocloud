"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { SplitHeading } from "@/components/typography/SplitHeading";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { KeyInputCard } from "@/components/dashboard/KeyInputCard";
import { wipeReveal } from "@/lib/motion";

export default function DashboardPage() {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  return (
    <main className="dashboard-page-shell noise relative overflow-hidden py-16 sm:py-24">
      <div className="pointer-events-none absolute -right-40 top-24 h-[520px] w-[520px] rounded-full bg-coral/10 blur-[200px]" />
      <div className="pointer-events-none absolute -bottom-44 left-[-12rem] h-[520px] w-[520px] rounded-full bg-coral/10 blur-[240px]" />

      <div className="container-cinematic relative z-[1]">
        <section className="mb-10 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[760px] border-l border-coral pl-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">· DASHBOARD</p>
            <SplitHeading
              as="h1"
              className="mt-4 max-w-[720px] text-[clamp(38px,6vw,76px)] font-[680] leading-[1.15] tracking-[-0.025em] text-primary"
              lines={["API 키 상태 조회"]}
            />
            <p className="mt-5 max-w-[620px] text-[clamp(16px,1.4vw,18px)] leading-[1.65] tracking-[-0.01em] text-secondary">
              발급받으신 API 키를 입력하여 잔액과 사용량을 실시간으로 확인하세요.
            </p>
            <motion.span
              className="mt-6 block h-[1.5px] w-10 bg-coral"
              initial="hidden"
              animate="visible"
              variants={wipeReveal}
            />
          </div>

          {activeKey ? (
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => setActiveKey(null)} className="font-mono text-[13px] font-semibold text-coral underline decoration-coral/30 underline-offset-4 transition hover:decoration-coral">
                ← 다른 키 조회하기
              </button>
              <a href="/" className="inline-flex min-h-11 items-center rounded-xl border border-[var(--border-subtle)] px-4 text-sm font-semibold text-primary transition hover:border-coral/50 hover:text-coral">
                홈으로 돌아가기
              </a>
            </div>
          ) : null}
        </section>

        <AnimatePresence mode="wait">
          {!activeKey ? (
            <motion.section
              key="input"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.3 }}
            >
              <KeyInputCard onKeySubmit={setActiveKey} />
            </motion.section>
          ) : (
            <motion.section
              key="result"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <DashboardView apiKey={activeKey} />
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
