"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CodeBlockFloat } from "@/components/system/CodeBlockFloat";
import { CountUp } from "@/components/ui/CountUp";
import { Price } from "@/components/ui/Price";
import { CCAnimatedContent } from "@/components/reactbits-wrapped/CCAnimatedContent";
import { DashboardGateLink } from "@/components/navigation/DashboardGateLink";

const steps = [
  "잔액을 한눈에.",
  "사용량을 실시간으로.",
  "요청 내역을 투명하게.",
  "만료 없이, 끝까지."
];

export function StickyDashboard() {
  const rootRef = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || window.innerWidth < 768) return;

    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (self) => setActive(Math.min(3, Math.floor(self.progress * 4)))
    });

    return () => trigger.kill();
  }, []);

  return (
    <section ref={rootRef} className="cc-section relative min-h-[400vh] bg-[var(--surface-dark)] text-[var(--cream)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(247,241,232,0.04)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:linear-gradient(90deg,transparent_0%,black_30%,black_70%,transparent_100%)]" />
      <div className="sticky top-0 grid min-h-screen items-center gap-12 px-5 py-20 lg:grid-cols-[0.44fr_0.56fr] lg:px-12">
        <div className="relative z-[1] mx-auto w-full max-w-lg">
          <CCAnimatedContent distance={12}>
            <p className="cc-eyebrow cc-eyebrow-dot">Dashboard</p>
          </CCAnimatedContent>
          <div aria-live="polite" className="mt-8 min-h-[190px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.h2
                key={active}
                className="cc-display text-[var(--cream)]"
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {steps[active]}
              </motion.h2>
            </AnimatePresence>
            <CCAnimatedContent distance={8} delay={0.5}>
              <div className="mt-8 flex items-center gap-3 font-mono text-[var(--fs-caption)] tracking-[0.08em] text-[rgba(247,241,232,0.45)]">
                <span className="h-px w-6 bg-[linear-gradient(90deg,var(--coral)_0%,transparent_100%)]" />
                {String(active + 1).padStart(2, "0")}/04
              </div>
            </CCAnimatedContent>
          </div>
          <p className="mt-8 max-w-[360px] text-[var(--fs-body-lg)] leading-[var(--lh-body)] tracking-[var(--tracking-body)] text-[rgba(247,241,232,0.60)]">
            충전 잔액, 요청량, 최근 사용 내역, 만료 상태를 한 화면에서 확인합니다.
          </p>
        </div>
        <CCAnimatedContent distance={40} duration={0.9} threshold={0.2}>
          <DashboardPanel active={active} />
        </CCAnimatedContent>
      </div>
    </section>
  );
}

function DashboardPanel({ active }: { active: number }) {
  const metricClass = (index: number) =>
    `rounded-[var(--r-md)] border border-[var(--line-dark)] bg-[rgba(247,241,232,0.04)] p-5 shadow-[inset_0_1px_rgba(247,241,232,.05)] transition duration-500 ${
      active === index ? "scale-[1.03] border-[rgba(217,119,87,0.55)] brightness-100 saturate-100" : "opacity-60 brightness-[.72] saturate-[.7]"
    }`;

  return (
    <div className="relative mx-auto w-full max-w-4xl rounded-[var(--r-xl)] border border-[rgba(247,241,232,0.08)] bg-[rgba(26,24,23,0.86)] p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur">
      <div className="pointer-events-none absolute -right-[12%] -top-[16%] z-0 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(217,119,87,0.28)_0%,rgba(217,119,87,0.10)_35%,transparent_70%)] blur-[40px]" />
      {/* Unified Horizontal Floating Metrics Panel */}
      <div className="pointer-events-none absolute -left-12 top-16 z-20 hidden items-center gap-4 rounded-[var(--r-md)] border border-[rgba(247,241,232,0.10)] bg-[rgba(15,14,13,0.85)] px-5 py-3 shadow-[var(--shadow-dark)] backdrop-blur-md lg:flex">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[rgba(247,241,232,0.44)]">BALANCE</p>
          <strong className="mt-1 block font-mono text-[17px] font-bold text-[var(--cream)] tabular-nums">
            <span className="text-[0.88em] text-[rgba(247,241,232,0.6)] font-normal mr-0.5">$</span>462.6342
          </strong>
        </div>
        <div className="h-8 w-[0.5px] bg-coral/18" />
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[rgba(247,241,232,0.44)]">REQUESTS</p>
          <strong className="mt-1 block text-[17px] font-[600] text-[var(--cream)]">
            321<span className="font-mono text-[13px] text-[rgba(247,241,232,0.6)] font-normal ml-1">requests</span>
          </strong>
        </div>
      </div>
      <div className="absolute right-6 top-6 z-10 hidden w-64 lg:block pointer-events-auto">
        <CodeBlockFloat
          lines={[
            '$ export ANTHROPIC_API_KEY="sk-clco-..."',
            "$ claude --version",
            "$ curl https://api.clcocloud.kr/v1/usage"
          ]}
        />
        <div className="mt-2 text-right">
          <DashboardGateLink className="group relative inline-flex items-center text-[11px] font-semibold text-coral-soft hover:text-coral transition-colors duration-200">
            <span className="relative">
              더 많은 명령어 보기 →
              <span className="absolute left-0 bottom-[-2px] w-full h-[0.5px] bg-coral transition-transform duration-300 origin-left scale-x-100 group-hover:scale-x-110" />
            </span>
          </DashboardGateLink>
        </div>
      </div>
      <div className="relative z-[1] flex items-center justify-between border-b border-[var(--line-dark)] pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.16em] text-[rgba(247,241,232,0.44)]">API Key Status</p>
          <h3 className="mt-2 text-3xl font-semibold">활성화</h3>
        </div>
        <span className="rounded-full border border-[rgba(90,138,107,0.30)] bg-[rgba(90,138,107,0.10)] px-3 py-1 font-mono text-xs text-[var(--success)]">Live</span>
      </div>
      <div className="relative z-[1] mt-6 grid gap-6 md:grid-cols-3">
        <article className={metricClass(0)}>
          <span className="font-mono text-xs uppercase text-[rgba(247,241,232,0.48)]">Balance</span>
          <strong className="mt-5 block text-4xl">
            <Price prefix="$" value={462.6342} className="text-[var(--cream)]" />
          </strong>
          <p className="mt-2 text-sm text-[rgba(247,241,232,0.44)]">$1000 API 잔액 패키지</p>
        </article>
        <article className={metricClass(1)}>
          <span className="font-mono text-xs uppercase text-[rgba(247,241,232,0.48)]">Usage</span>
          <strong className="mt-5 block text-4xl"><CountUp end={321} /> requests</strong>
          <p className="mt-2 text-sm text-[rgba(247,241,232,0.44)]">6.81M tokens</p>
        </article>
        <article className={metricClass(3)}>
          <span className="font-mono text-xs uppercase text-[rgba(247,241,232,0.48)]">Expires</span>
          <strong className={`mt-5 block text-4xl ${active === 3 ? "bg-[linear-gradient(90deg,var(--coral-soft),var(--coral))] bg-clip-text text-transparent" : ""}`}>Never</strong>
          <p className="mt-2 text-sm text-[rgba(247,241,232,0.44)]">잔액 기간 만료 없음</p>
        </article>
      </div>
      <div className={`relative z-[1] mt-6 overflow-hidden rounded-[22px] border border-[var(--line-dark)] bg-[rgba(247,241,232,0.035)] transition duration-500 ${active === 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-55"}`}>
        <div className="grid grid-cols-[1.6fr_1fr_.7fr_.8fr_.5fr] gap-3 border-b border-[var(--line-dark)] p-4 font-mono text-xs uppercase tracking-wider text-[rgba(247,241,232,0.44)]">
          <span>Model</span><span>Time</span><span>Tokens</span><span>Charge</span><span>Status</span>
        </div>
        {[
          ["anthropic/claude-sonnet-4-6", "4월 27일 01:08", "613", "$0.004637", "200"],
          ["anthropic/claude-opus-4-1", "4월 27일 00:44", "1,284", "$0.018520", "200"],
          ["anthropic/claude-haiku-4-5", "4월 26일 23:31", "448", "$0.001920", "200"]
        ].map((row, rowIndex) => (
          <div
            key={row[0]}
            className="grid grid-cols-[1.6fr_1fr_.7fr_.8fr_.5fr] gap-3 border-b border-[rgba(247,241,232,0.05)] p-4 font-mono text-[12px] text-[rgba(247,241,232,0.76)] transition hover:bg-[rgba(247,241,232,0.04)] last:border-0"
            style={{ transitionDelay: active === 2 ? `${rowIndex * 80}ms` : "0ms" }}
          >
            {row.map((cell, cellIndex) => <span key={cell} className={cellIndex === 4 ? "animate-soft-pulse text-[var(--success)]" : ""}>{cell}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}
