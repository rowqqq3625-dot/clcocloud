"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { springSoft } from "@/lib/motion";

type CountUpProps = {
  end: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  delay?: number;
  className?: string;
  mode?: "count" | "slot";
  grouped?: boolean;
};

export function CountUp({
  end,
  suffix = "",
  prefix = "",
  decimals = 0,
  duration = 1200,
  delay = 0,
  className,
  mode = "count",
  grouped = false
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [value, setValue] = useState(end);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(end);
      setEntered(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setEntered(true);
        setValue(0);
        const run = () => {
          const start = performance.now();
          const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            setValue(end * eased);
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        };
        if (delay > 0) {
          window.setTimeout(run, delay);
        } else {
          run();
        }
        observer.disconnect();
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay, duration, end]);

  const numeric = grouped
    ? value.toLocaleString("ko-KR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })
    : value.toFixed(decimals);
  const formatted = `${prefix}${numeric}${suffix}`;

  return (
    <span ref={ref} className={`${mode === "slot" ? "inline-flex tabular-nums overflow-hidden align-middle" : "tabular-nums"} ${className ?? ""}`}>
      {mode === "slot" ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={formatted}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1, scale: entered ? [1, 1.04, 1] : 1 }}
            exit={{ y: "-100%", opacity: 0 }}
            transition={{
              y: { duration: 0.4 },
              opacity: { duration: 0.25 },
              scale: { duration: 0.2 }
            }}
            className="inline-block"
          >
            {formatted}
          </motion.span>
        </AnimatePresence>
      ) : (
        <motion.span
          animate={entered ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={springSoft}
          className="inline-block"
        >
          {formatted}
        </motion.span>
      )}
    </span>
  );
}
