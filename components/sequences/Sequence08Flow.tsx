"use client";

import { motion } from "framer-motion";
import { CCAnimatedContent } from "@/components/reactbits-wrapped/CCAnimatedContent";
import { CCSplitText } from "@/components/reactbits-wrapped/CCSplitText";
import { StepCard } from "@/components/ui/StepCard";

const steps = [
  { number: "01", title: "잔액 플랜 선택", boxText: "원하는 플랜 선택" },
  { number: "02", title: "API 키 발급", boxText: "클로드 API 키 구매" },
  { number: "03", title: "클로드코드 연동", boxText: "공식 클로드코드에 연결" },
  { number: "04", title: "사용량 확인", boxText: "투명한 사용량 추적" }
];

export function Sequence08Flow() {
  return (
    <section id="flow" className="cc-section bg-[var(--surface-dark-2)] py-[var(--section-y)] text-[var(--cream)]">
      <div className="pointer-events-none absolute -right-[6%] bottom-[-12%] z-0 font-mono text-[clamp(200px,26vw,360px)] leading-none text-transparent [-webkit-text-stroke:1px_rgba(217,119,87,0.10)]">04</div>
      <div className="cc-max relative z-[1]">
        {/* Section Header */}
        <div className="mb-16">
          <p className="cc-eyebrow before:hidden">4 Steps</p>
          <h2 aria-label="결제 후, 공식 클로드코드에 연결하면 끝." className="cc-display mt-5 text-[calc(var(--fs-display)*0.95)] text-[var(--cream)]">
            <span className="block"><CCSplitText text="결제 후, 공식" delay={0.02} /></span>
            <span className="block"><CCSplitText text="클로드코드에" delay={0.02} /></span>
            <span className="block cc-serif text-[calc(var(--fs-display)*0.9)] text-[var(--coral)]">연결하면 끝.</span>
          </h2>
        </div>

        {/* 4-Step Grid Layout: 1 column on mobile, 2x2 on tablet, 1x4 on desktop */}
        <CCAnimatedContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative" distance={24} duration={0.7}>
          {steps.map((step, index) => (
            <div key={step.number} className="relative w-full">
              {/* Connector line (desktop only) */}
              {index < steps.length - 1 && (
                <div 
                  className="absolute top-[38px] left-[calc(100%-4px)] right-[-20px] hidden lg:block z-0 h-px border-t border-dashed border-[var(--coral)] opacity-30"
                  style={{
                     animation: "cc-dash-reveal 1.2s var(--ease-out) forwards"
                  }}
                />
              )}
              <StepCard
                stepNumber={step.number}
                title={step.title}
                boxText={step.boxText}
                className="h-full z-10"
              />
            </div>
          ))}
        </CCAnimatedContent>
      </div>
    </section>
  );
}
