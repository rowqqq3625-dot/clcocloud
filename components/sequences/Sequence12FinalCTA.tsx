"use client";

import { motion } from "framer-motion";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RevealText } from "@/components/typography/RevealText";
import { SplitHeading } from "@/components/typography/SplitHeading";
import { CCClickSpark } from "@/components/reactbits-wrapped/CCClickSpark";

export function Sequence12FinalCTA() {
  return (
    <section id="final" className="cinematic-section grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_0%,rgba(245,239,230,.12),transparent_34%),linear-gradient(180deg,var(--coral-hi),var(--coral),var(--coral-lo))] px-5 text-cream">
      <div className="pointer-events-none absolute inset-0 opacity-[.08] noise" />
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,.05)_0_1px,transparent_1px_9px)] opacity-20" />
      <div className="container-cinematic text-center">
        <p className="text-sm font-semibold uppercase tracking-[.12em] text-cream/72">Ready?</p>
        <SplitHeading
          as="h2"
          aria-label="공식 클로드코드, 오늘부터."
          className="font-display mx-auto mt-8 max-w-5xl text-[clamp(60px,9vw,126px)] font-semibold"
          lines={["공식 클로드코드,", <span key="today-emphasis" className="whitespace-nowrap serif-italic">오늘부터.</span>]}
        />
        <RevealText className="mx-auto mt-8 max-w-2xl text-xl leading-8 text-cream/80">
          ₩98,000부터 시작하고, 잔액이 남아있는 한 계속 사용하세요.
        </RevealText>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
          <CCClickSpark>
            <PrimaryButton href="#pricing" pulse variant="coral-solid">시작하기</PrimaryButton>
          </CCClickSpark>
          <a href="#pricing" className="text-cream/80 hover:text-cream transition-colors duration-200 text-sm font-semibold underline decoration-cream/30 decoration-[0.5px] underline-offset-4">
            요금표 다시 보기
          </a>
        </div>
        <p className="mt-8 text-sm text-cream/70">결제 확인 후 API 키 수동 발급 · 키 사용불가 시 교체 또는 환불</p>
      </div>
      <div className="absolute bottom-0 left-0 h-[8vh] w-full bg-[linear-gradient(180deg,transparent,var(--bg-cream)_18%,var(--bg-cream)_82%,var(--surface-dark))]">
        <span className="absolute left-1/2 top-1/2 h-px w-16 -translate-x-1/2 bg-coral">
          <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 animate-dot-travel rounded-full bg-coral" />
        </span>
      </div>
    </section>
  );
}
