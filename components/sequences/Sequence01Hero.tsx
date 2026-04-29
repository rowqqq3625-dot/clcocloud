"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { RevealText } from "@/components/typography/RevealText";
import { SplitHeading } from "@/components/typography/SplitHeading";
import { wipeReveal } from "@/lib/motion";

const FloatingApiCard = dynamic(() => import("@/components/three/FloatingApiCard"), {
  ssr: false,
  loading: () => (
    <div className="relative h-[320px] rounded-[32px] bg-[radial-gradient(circle_at_50%_35%,rgba(217,119,87,.34),transparent_44%),linear-gradient(145deg,#141413,#D97757)] shadow-coral" />
  )
});

export function Sequence01Hero() {
  const { scrollYProgress } = useScroll();
  const titleSpacing = useTransform(scrollYProgress, [0, 0.15], ["-0.028em", "-0.045em"]);
  const titleX = useTransform(scrollYProgress, [0, 0.2], [0, -8]);

  return (
    <section id="top" className="cinematic-section noise overflow-hidden bg-cream pt-8">
      <div className="pointer-events-none absolute -right-28 top-24 h-[460px] w-[460px] rounded-full bg-coral/25 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-[linear-gradient(90deg,rgba(217,119,87,.22),transparent_52%)]" />
      <nav className="container-cinematic sticky top-4 z-30 flex items-center justify-between rounded-full border border-[var(--border-subtle)] bg-glass px-4 py-3 backdrop-blur-xl">
        <a href="/" className="flex items-center gap-3 font-semibold">
          <BrandLogo size={28} />
          클코클라우드
        </a>
        <div className="hidden items-center gap-8 text-sm text-secondary md:flex">
          <a href="#pricing">가격</a>
          <a href="#flow">사용법</a>
          <a href="/dashboard">대시보드</a>
          <a href="#faq">FAQ</a>
        </div>
        <PrimaryButton href="/start">시작하기</PrimaryButton>
      </nav>
      <motion.div
        className="pointer-events-none absolute right-[7vw] top-[26vh] hidden font-mono text-[clamp(42px,5vw,84px)] font-semibold tracking-[-.08em] text-primary/[.06] xl:block"
        animate={{ x: [0, 4, -4, 0], y: [0, -3, 3, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        sk-clco-•••• ••••
      </motion.div>
      <div className="container-cinematic relative grid min-h-[calc(100vh-88px)] items-center gap-10 py-16 2xl:grid-cols-[minmax(0,760px)_minmax(420px,1fr)]">
        <div className="relative z-10">
          <motion.div
            className="mb-8 inline-flex items-center gap-2 font-mono text-sm font-semibold text-coral"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="h-3.5 w-1 bg-coral" />
            OFFICIAL PRICE / 1:6
          </motion.div>
          <motion.div style={{ letterSpacing: titleSpacing, x: titleX }}>
            <SplitHeading
              as="h1"
              aria-label="언제 끊길지 모르는 불안한 구독계정, 클코클라우드로 시작하세요."
              className="balanced-headline fluid-hero-text max-w-[920px] font-semibold leading-[1.04] text-primary 2xl:max-w-[760px] 2xl:text-[clamp(40px,4.85vw,68px)]"
              amount={0.55}
              lines={[
                "언제 끊길지 모르는",
                "불안한 구독계정,",
                <>
                  <span className="whitespace-nowrap">
                    <span className="relative inline-block bg-[linear-gradient(90deg,var(--coral-hi),var(--coral))] bg-clip-text text-transparent">
                      클코클라우드
                      <motion.span
                        className="absolute -bottom-1 left-0 h-[1.5px] w-full origin-left bg-coral"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.8 }}
                        variants={wipeReveal}
                      />
                    </span>
                    <wbr />
                    로 시작하세요.
                  </span>
                </>
              ]}
            />
          </motion.div>
          <RevealText className="mt-8 max-w-2xl text-[clamp(18px,1.4vw,22px)] leading-[1.55] text-secondary">
            클코클라우드는 공식 클로드코드CLI를 위한 최고의 API키 잔액충전 플랫폼입니다.
          </RevealText>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <PrimaryButton href="/start">시작하기</PrimaryButton>
            <a href="/dashboard" className="secondary-underline font-semibold underline decoration-coral underline-offset-8">
              대시보드 보기
            </a>
          </div>
        </div>
        <motion.div
          className="relative z-0 hidden justify-self-end 2xl:block"
          initial={{ opacity: 0, scale: 0.85, rotateY: -25 }}
          animate={{ opacity: 1, scale: 1, rotateY: -15 }}
          transition={{ delay: 0.2, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <FloatingApiCard />
        </motion.div>
      </div>
      <div className="absolute bottom-8 left-1/2 h-12 w-1 -translate-x-1/2 rounded-full bg-coral/30">
        <span className="block h-12 w-1 origin-top animate-scroll-dot rounded-full bg-coral" />
      </div>
    </section>
  );
}
