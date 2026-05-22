"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AbstractChart } from "@/components/system/AbstractChart";
import { CCCountUp } from "@/components/reactbits-wrapped/CCCountUp";

type Plan = {
  label: string;
  tokens: number;
  hours: number;
  discount: number;
};

type SliderInteractiveProps = {
  plans: Plan[];
};

export function SliderInteractive({ plans }: SliderInteractiveProps) {
  const [active, setActive] = useState(1);
  const [pulse, setPulse] = useState(0);
  const plan = plans[active];

  const choose = (index: number) => {
    setActive(index);
    setPulse((value) => value + 1);
  };

  return (
    <div className="relative z-[1] grid content-center gap-7">
      {/* Slider Container */}
      <div
        role="slider"
        aria-label="충전 금액"
        aria-valuemin={0}
        aria-valuemax={2}
        aria-valuenow={active}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") choose(Math.min(2, active + 1));
          if (event.key === "ArrowLeft") choose(Math.max(0, active - 1));
        }}
        className="rounded-[var(--r-lg)] bg-[rgba(251,246,236,0.78)] p-5 relative"
      >
        {/* Track Limit Labels: MIN $100 / MAX $5,000 */}
        <div className="flex justify-between items-center mb-6 px-1">
          <span className="font-mono text-[11px] font-semibold text-ink-65 uppercase tracking-[0.12em]">MIN $100</span>
          <span className="font-mono text-[11px] font-semibold text-ink-65 uppercase tracking-[0.12em]">MAX $5,000</span>
        </div>

        {/* Track Area */}
        <div className="relative h-4 cursor-pointer rounded-full mb-2">
          {/* Background Track Line */}
          <span className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-[var(--line)]" />

          {/* 4 Step Tick Marks (0.5px coral 18% border) */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full flex justify-between pointer-events-none px-1">
            {[0, 1, 2, 3].map((step) => (
              <span
                key={step}
                className="h-1.5 w-1.5 rounded-full border border-coral/18 bg-[var(--cream)]"
              />
            ))}
          </div>

          {/* Active Highlight Line */}
          <motion.div
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,var(--coral)_0%,var(--coral-soft)_100%)] shadow-[0_0_20px_rgba(217,119,87,0.30)]"
            animate={{ width: `${active * 50 + 1}%` }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Permanent Active Value Tooltip above the active Thumb */}
          <div
            className="absolute bottom-full mb-3 px-3 py-1.5 rounded-lg bg-surface-dark-2 border border-border-dark text-cream text-[11px] font-medium shadow-md flex flex-col items-center gap-0.5 pointer-events-none z-10 transition-all duration-200 -translate-x-1/2"
            style={{ left: `${active * 50}%` }}
          >
            <span className="font-bold text-coral-soft font-mono text-[12px]">{plans[active]?.label}</span>
            <span className="text-[10px] text-cream-soft font-mono opacity-80 whitespace-nowrap">
              약 {plans[active]?.tokens}M 토큰 / {plans[active]?.hours}시간
            </span>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-surface-dark-2" />
          </div>

          {/* Knobs / Thumbs */}
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              aria-label={plans[index]?.label}
              onClick={() => choose(index)}
              className="absolute top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-[var(--coral)] bg-[var(--cream-2)] shadow-[0_0_0_8px_rgba(217,119,87,0.15),0_8px_16px_rgba(217,119,87,0.25)] transition duration-200 ease-[var(--ease-out)] hover:scale-[1.08] active:cursor-grabbing"
              style={{ left: `${index * 50}%` }}
            >
              <span className={`mx-auto block h-1 w-1 rounded-full bg-[var(--coral)] transition duration-200 ${active === index ? "scale-[1.4]" : ""}`} />
            </button>
          ))}
        </div>

        {/* Buttons selection */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {plans.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => choose(index)}
              className={`min-h-12 rounded-[var(--r-md)] border px-3 text-[var(--fs-body)] font-semibold tabular-nums transition duration-200 ease-[var(--ease-out)] active:scale-95 ${
                active === index
                  ? "border-[1.5px] border-[var(--coral)] bg-[rgba(251,246,236,1)] text-[var(--coral)] shadow-[0_4px_12px_rgba(217,119,87,0.15)]"
                  : "border-[var(--line)] bg-transparent text-[var(--ink-soft)] hover:border-[var(--coral-soft)] hover:bg-[rgba(251,246,236,1)] hover:text-[var(--ink)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none flex justify-end">
        <AbstractChart className="h-20 w-[min(100%,280px)] text-[var(--coral-soft)]" />
      </div>

      {/* Results grid */}
      <motion.div
        key={pulse}
        className="grid gap-4 md:grid-cols-3"
        animate={{ x: [0, -2, 2, 0] }}
        transition={{ duration: 0.08 }}
      >
        <Result label="예상 토큰" value={plan.tokens} suffix="M" />
        <Result label="예상 사용 시간" value={plan.hours} suffix="시간" />
        <Result label="공식 대비 절감" value={plan.discount} suffix="%" />
      </motion.div>

      {/* Footer Navigation Link */}
      <div className="flex flex-col items-end gap-2 mt-2">
        <a
          href="/checkout?plan=pro"
          data-cta="true"
          className="group inline-flex items-center gap-1.5 border-b border-transparent py-1 text-[var(--fs-body)] font-semibold text-[var(--coral)] transition duration-200 ease-[var(--ease-out)] hover:border-[var(--coral)]"
        >
          이 금액으로 시작하기 <ArrowRight className="h-4 w-4 transition duration-200 group-hover:translate-x-1" aria-hidden="true" />
        </a>

        {/* Pricing smooth scroll link */}
        <a
          href="#pricing"
          className="group relative inline-flex items-center text-[12px] font-semibold text-coral-solid transition-colors duration-200"
        >
          <span className="relative">
            이 사용량에 맞는 플랜 보기 →
            <span className="absolute left-0 bottom-[-2px] w-full h-[0.5px] bg-coral transition-transform duration-300 origin-left scale-x-100 group-hover:scale-x-110" />
          </span>
        </a>
      </div>
    </div>
  );
}

function Result({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const isDiscount = label === "공식 대비 절감";

  return (
    <article className="group relative overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-[rgba(251,246,236,1)] p-5 transition duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-[rgba(217,119,87,0.30)] hover:shadow-[var(--shadow-sm)]">
      {/* 1px x 12px coral accent line on top-right */}
      <span className="absolute top-4 right-4 w-[1px] h-[12px] bg-coral" />

      <span className="text-[var(--fs-caption)] font-medium tracking-[var(--tracking-body)] text-[var(--ink-soft)]">{label}</span>
      
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <strong className={`block text-[var(--fs-h2)] font-semibold tracking-[var(--tracking-h)] ${isDiscount ? "text-[#D97757]" : "text-[var(--ink)]"}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={`${label}-${value}-${suffix}`}
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "-100%", opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="inline-block"
            >
              <span className="mr-0.5 text-[var(--fs-body)] opacity-55">~</span>
              <CCCountUp end={value} suffix={suffix} flash className="[&>span]:align-baseline" />
            </motion.span>
          </AnimatePresence>
        </strong>

        {/* 18px bar micro-chart for discount */}
        {isDiscount && (
          <div className="relative w-[18px] h-1 bg-[var(--line)] rounded-full flex items-center mb-2 shrink-0">
            <span
              className="absolute w-1.5 h-1.5 rounded-full bg-coral"
              style={{ left: `${Math.min(12, Math.max(0, (value / 100) * 12))}px` }}
            />
          </div>
        )}
      </div>
    </article>
  );
}
