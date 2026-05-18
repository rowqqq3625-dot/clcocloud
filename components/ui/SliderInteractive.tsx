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
  const [hint, setHint] = useState(true);
  const [pulse, setPulse] = useState(0);
  const plan = plans[active];

  useEffect(() => {
    const id = window.setTimeout(() => setHint(false), 3000);
    return () => window.clearTimeout(id);
  }, []);

  const choose = (index: number) => {
    setActive(index);
    setHint(false);
    setPulse((value) => value + 1);
  };

  return (
    <div className="relative z-[1] grid content-center gap-7">
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
        className="rounded-[var(--r-lg)] bg-[rgba(251,246,236,0.78)] p-5"
      >
        <div
          className="relative h-4 cursor-pointer rounded-full"
          onMouseEnter={() => setHint(false)}
        >
          <span className="absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-[var(--line)]" />
          <motion.div
            className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,var(--coral)_0%,var(--coral-soft)_100%)] shadow-[0_0_20px_rgba(217,119,87,0.30)]"
            animate={{ width: `${active * 50 + 1}%` }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />
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
          <motion.span
            key={pulse}
            className="pointer-events-none absolute top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[9px] font-bold text-[var(--coral)]"
            animate={{ left: `calc(${active * 50}% - 14px)`, scaleX: [1, 1.16, 1], scaleY: [1, 0.9, 1] }}
            transition={{ duration: 0.2 }}
          >
            <span className={`transition-opacity duration-300 ${hint ? "opacity-100" : "opacity-0"}`}>drag</span>
          </motion.span>
        </div>
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
      <a href="/checkout?plan=pro" data-cta="true" className="group inline-flex items-center gap-1.5 justify-self-end border-b border-transparent py-2 text-[var(--fs-body)] font-semibold text-[var(--coral)] transition duration-200 ease-[var(--ease-out)] hover:border-[var(--coral)]">
        이 금액으로 시작하기 <ArrowRight className="h-4 w-4 transition duration-200 group-hover:translate-x-1" aria-hidden="true" />
      </a>
    </div>
  );
}

function Result({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <article className="group relative overflow-hidden rounded-[var(--r-md)] border border-[var(--line)] bg-[rgba(251,246,236,1)] p-5 transition duration-200 ease-[var(--ease-out)] hover:-translate-y-0.5 hover:border-[rgba(217,119,87,0.30)] hover:shadow-[var(--shadow-sm)]">
      <span className="text-[var(--fs-caption)] font-medium tracking-[var(--tracking-body)] text-[var(--ink-soft)]">{label}</span>
      <strong className="mt-3 block text-[var(--fs-h2)] font-semibold tracking-[var(--tracking-h)] text-[var(--ink)]">
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
    </article>
  );
}
