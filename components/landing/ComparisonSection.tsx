"use client";

import { motion } from "framer-motion";
import { COMPARISON_DISCLAIMER } from "@/lib/data/comparison";
import { ComparisonTable } from "./ComparisonTable";
import { ComparisonMobileCards } from "./ComparisonMobileCards";

const EASE = [0.22, 1, 0.36, 1] as const;

function handleCtaClick(event: React.MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  const target = document.getElementById("pricing");
  if (!target) {
    window.location.hash = "#pricing";
    return;
  }
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function ComparisonSection() {
  return (
    <section
      id="comparison"
      aria-labelledby="comparison-heading"
      className="dark-panel py-16 lg:py-[120px]"
    >
      <div className="container-cinematic">
        {/* Section Header */}
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.42, ease: EASE }}
          className="flex flex-col gap-5"
        >
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-coral">
            COMPARISON
          </p>
          <h2
            id="comparison-heading"
            className="max-w-3xl text-[32px] font-[680] leading-[1.2] tracking-[-0.02em] text-cream md:text-[44px] lg:text-[56px]"
          >
            같은 클로드,
            <br />
            <span className="serif-italic relative inline-block text-coral">
              다른 비용 구조.
              <span
                aria-hidden
                className="absolute inset-x-0 -bottom-1 h-[2px] rounded-full bg-coral/70"
              />
            </span>
          </h2>
          <p className="max-w-2xl text-[16px] leading-[1.65] text-cream/70">
            클코클라우드, 타사 공유 구독, 클로드 정식 API를 같은 기준으로 비교했습니다.
          </p>
        </motion.header>

        {/* Comparison body — responsive branching */}
        <div className="mt-12 lg:mt-16">
          {/* Desktop / Tablet (≥1024px) */}
          <div className="hidden lg:block">
            <ComparisonTable />
          </div>
          {/* Mobile / small tablet (<1024px) */}
          <div className="lg:hidden">
            <ComparisonMobileCards />
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.36, delay: 0.2, ease: EASE }}
          className="mt-10 flex justify-center lg:mt-12"
        >
          <a
            href="#pricing"
            onClick={handleCtaClick}
            className="inline-flex h-[52px] w-full max-w-[360px] items-center justify-center gap-2 rounded-pill bg-coral px-7 text-[15px] font-semibold text-cream shadow-coral transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:bg-coral-hi focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-dark md:w-auto"
          >
            이 차이를 1분 만에 확인하기
            <span aria-hidden className="idle-arrow text-[16px]">
              →
            </span>
          </a>
        </motion.div>

        {/* Disclaimer */}
        <p className="mt-8 text-[12px] leading-[1.6] text-cream/50">
          {COMPARISON_DISCLAIMER}
        </p>
      </div>
    </section>
  );
}
