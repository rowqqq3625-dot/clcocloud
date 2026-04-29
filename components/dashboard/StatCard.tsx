"use client";

import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Price } from "@/components/ui/Price";

type StatCardProps = {
  eyebrow: string;
  value: number | string;
  suffix?: string;
  helper: string;
  currency?: boolean;
  italic?: boolean;
  delay?: number;
};

export function StatCard({ eyebrow, value, suffix, helper, currency = false, italic = false, delay = 0 }: StatCardProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const numericValue = typeof value === "number" ? value : null;
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 90, damping: 20, mass: 0.8 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || numericValue == null) return;
    motionValue.set(numericValue);
    return spring.on("change", (latest) => setDisplay(latest));
  }, [inView, motionValue, numericValue, spring]);

  const formattedNumber = numericValue == null ? value : Number(display.toFixed(currency ? 4 : 0));

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="group relative min-h-[176px] overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-cream p-7 shadow-md transition duration-200 hover:-translate-y-0.5 hover:border-coral/50 hover:shadow-lg"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-coral/75">· {eyebrow}</span>
      <div className="mt-5 flex items-baseline text-[clamp(34px,4vw,46px)] font-bold leading-none tracking-[-0.025em] text-primary">
        {currency ? <Price prefix="$" value={formattedNumber} /> : null}
        {!currency && italic ? <span className="font-serif italic font-medium text-coral">{value}</span> : null}
        {!currency && !italic ? <span className="tabular-nums">{formattedNumber}</span> : null}
        {suffix ? <span className="ml-2 font-mono text-[13px] font-semibold uppercase tracking-[0.1em] text-secondary">{suffix}</span> : null}
      </div>
      <p className="mt-4 text-[13px] leading-[1.6] text-secondary">{helper}</p>
      <span className="absolute right-5 top-5 h-px w-12 bg-coral/20 transition group-hover:bg-coral/50" />
      <span className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-coral/10" />
    </motion.article>
  );
}
