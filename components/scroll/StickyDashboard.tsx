"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CodeBlockFloat } from "@/components/system/CodeBlockFloat";
import { GrainOverlay } from "@/components/system/GrainOverlay";
import { MiniStatCard } from "@/components/system/MiniStatCard";
import { CountUp } from "@/components/ui/CountUp";
import { Price } from "@/components/ui/Price";
import { RevealText } from "@/components/typography/RevealText";

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
    <section ref={rootRef} className="relative min-h-[400vh] overflow-hidden bg-[#0a0908] text-cream">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#15120f_0%,#0a0908_32%)]" />
      <div className="pointer-events-none absolute -right-[200px] top-0 h-[800px] w-[800px] rounded-full bg-coral/12 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-36 -left-36 h-[600px] w-[600px] rounded-full bg-[#1a2030]/[.06] blur-[120px]" />
      <GrainOverlay />
      <div className="sticky top-0 grid min-h-screen items-center gap-10 px-5 py-20 lg:grid-cols-[0.42fr_0.58fr] lg:px-12">
        <div className="mx-auto w-full max-w-lg">
          <p className="eyebrow">Dashboard</p>
          <div aria-live="polite" className="mt-8 min-h-[190px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.h2
                key={active}
                className="section-display text-[clamp(48px,6vw,88px)] font-semibold"
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {steps[active]}
              </motion.h2>
            </AnimatePresence>
            <div className="mt-6 font-mono text-sm text-cream/42">{String(active + 1).padStart(2, "0")}/04</div>
          </div>
          <RevealText className="mt-6 text-lg leading-8 text-cream/64">
            충전 잔액, 요청량, 최근 사용 내역, 만료 상태를 한 화면에서 확인합니다.
          </RevealText>
        </div>
        <DashboardPanel active={active} />
      </div>
    </section>
  );
}

function DashboardPanel({ active }: { active: number }) {
  const metricClass = (index: number) =>
    `rounded-[24px] border border-white/10 border-t-white/[.15] bg-white/[0.04] p-5 shadow-[inset_0_1px_rgba(255,255,255,.05)] transition duration-500 ${
      active === index ? "scale-[1.04] border-coral/70 brightness-100 saturate-100 shadow-coral" : "opacity-55 brightness-[.55] saturate-[.65]"
    }`;

  return (
    <div className="relative mx-auto w-full max-w-4xl -rotate-1 rounded-[32px] border border-white/10 bg-[#11100f] p-5 shadow-[0_40px_120px_rgba(0,0,0,.38)] lg:-rotate-4">
      <div className="pointer-events-none absolute -left-16 top-16 hidden lg:block">
        <MiniStatCard label="BALANCE" value="$462.6342" className="animate-subtle-bob" />
      </div>
      <div className="pointer-events-none absolute -right-12 bottom-24 hidden lg:block">
        <MiniStatCard label="REQUESTS" value="321 REQUESTS" className="animate-subtle-bob [animation-delay:1.2s]" />
      </div>
      <div className="pointer-events-none absolute right-6 top-6 hidden w-56 lg:block">
        <CodeBlockFloat
          lines={[
            '$ export ANTHROPIC_API_KEY="sk-clco-..."',
            "$ claude --version",
            "$ curl https://api.clcocloud.kr/v1/usage"
          ]}
        />
      </div>
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[.16em] text-cream/44">API Key Status</p>
          <h3 className="mt-2 text-3xl font-semibold">활성화</h3>
        </div>
        <span className="rounded-full border border-live/30 bg-live/10 px-3 py-1 font-mono text-xs text-live">Live</span>
      </div>
      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <article className={metricClass(0)}>
          <span className="font-mono text-xs uppercase text-cream/48">Balance</span>
          <strong className="mt-5 block text-4xl">
            <Price prefix="$" value={462.6342} className="text-cream" />
          </strong>
          <p className="mt-2 text-sm text-cream/44">$1000 API 잔액 패키지</p>
        </article>
        <article className={metricClass(1)}>
          <span className="font-mono text-xs uppercase text-cream/48">Usage</span>
          <strong className="mt-5 block text-4xl"><CountUp end={321} /> requests</strong>
          <p className="mt-2 text-sm text-cream/44">6.81M tokens</p>
        </article>
        <article className={metricClass(3)}>
          <span className="font-mono text-xs uppercase text-cream/48">Expires</span>
          <strong className={`mt-5 block text-4xl ${active === 3 ? "bg-[linear-gradient(90deg,var(--coral-hi),var(--coral))] bg-clip-text text-transparent" : ""}`}>Never</strong>
          <p className="mt-2 text-sm text-cream/44">잔액 기간 만료 없음</p>
        </article>
      </div>
      <div className={`mt-6 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.035] transition duration-500 ${active === 2 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-55"}`}>
        <div className="grid grid-cols-[1.6fr_1fr_.7fr_.8fr_.5fr] gap-3 border-b border-white/10 p-4 font-mono text-xs uppercase tracking-wider text-cream/44">
          <span>Model</span><span>Time</span><span>Tokens</span><span>Charge</span><span>Status</span>
        </div>
        {[
          ["anthropic/claude-sonnet-4-6", "4월 27일 01:08", "613", "$0.004637", "200"],
          ["anthropic/claude-opus-4-1", "4월 27일 00:44", "1,284", "$0.018520", "200"],
          ["anthropic/claude-haiku-4-5", "4월 26일 23:31", "448", "$0.001920", "200"]
        ].map((row, rowIndex) => (
          <div
            key={row[0]}
            className="grid grid-cols-[1.6fr_1fr_.7fr_.8fr_.5fr] gap-3 border-b border-white/5 p-4 font-mono text-[12px] text-cream/76 transition hover:bg-white/[.04] last:border-0"
            style={{ transitionDelay: active === 2 ? `${rowIndex * 80}ms` : "0ms" }}
          >
            {row.map((cell, cellIndex) => <span key={cell} className={cellIndex === 4 ? "animate-soft-pulse text-live" : ""}>{cell}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}
