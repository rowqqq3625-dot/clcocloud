"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AbstractChart } from "@/components/system/AbstractChart";
import { CountUp } from "@/components/ui/CountUp";

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
    <div className="grid content-center gap-7">
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
        className="rounded-[28px] bg-white p-5 shadow-[0_1px_2px_rgba(31,30,29,.04),0_8px_24px_rgba(31,30,29,.06),0_32px_80px_rgba(31,30,29,.10)]"
      >
        <div
          className="relative h-4 cursor-pointer rounded-full bg-[var(--border-subtle)]"
          onMouseEnter={() => setHint(false)}
        >
          <motion.div
            className="h-4 rounded-full bg-coral"
            animate={{ width: `${active * 50 + 1}%` }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          />
          {[0, 1, 2].map((index) => (
            <button
              key={index}
              type="button"
              aria-label={plans[index]?.label}
              onClick={() => choose(index)}
              className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-coral/80 transition hover:scale-125 hover:bg-coral"
              style={{ left: `${index * 50}%` }}
            />
          ))}
          <motion.span
            key={pulse}
            className="absolute top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full border-[1.5px] border-coral-hi bg-coral text-[9px] font-bold text-cream shadow-coral"
            animate={{ left: `calc(${active * 50}% - 14px)`, scaleX: [1, 1.3, 1], scaleY: [1, 0.85, 1], boxShadow: ["0 0 0px var(--coral-glow)", "0 0 24px var(--coral-glow)", "0 0 0px var(--coral-glow)"] }}
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
              className={`min-h-12 rounded-xl border text-sm font-semibold transition duration-200 active:scale-95 ${
                active === index ? "border-coral bg-coral/10 text-coral" : "border-[var(--border-subtle)] hover:border-coral/50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <div className="pointer-events-none flex justify-end">
        <AbstractChart className="h-20 w-[min(100%,280px)]" />
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
      <a href="#pricing" className="idle-arrow justify-self-end font-semibold text-primary underline decoration-coral underline-offset-8">
        이 금액으로 시작하기 →
      </a>
    </div>
  );
}

function Result({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-[var(--border-subtle)] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:shadow-md">
      <span className="absolute inset-0 bg-coral/0 transition duration-500 group-hover:bg-coral/5" />
      <span className="text-sm font-semibold text-tertiary">{label}</span>
      <strong className="mt-3 block text-4xl tracking-tight">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${label}-${value}-${suffix}`}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-block"
          >
            ~<CountUp end={value} suffix={suffix} mode="slot" />
          </motion.span>
        </AnimatePresence>
      </strong>
    </article>
  );
}
