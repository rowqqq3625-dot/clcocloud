"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useMotionEnabled } from "./useMotionGuards";

type CCCountUpProps = {
  end: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  flash?: boolean;
  className?: string;
};

export function CCCountUp({ end, prefix = "", suffix = "", decimals = 0, duration = 1.2, flash = false, className = "" }: CCCountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const valueRef = useRef(end);
  const enabled = useMotionEnabled();
  const [value, setValue] = useState(end);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!enabled) {
      setValue(end);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setEntered(true);
        const start = performance.now();
        const from = valueRef.current;
        const tick = (now: number) => {
          const progress = Math.min((now - start) / (duration * 1000), 1);
          const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
          setValue(from + (end - from) * eased);
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [duration, enabled, end]);

  const formatted = value.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  return (
    <motion.span
      ref={ref}
      className={`tabular-nums ${className}`}
      animate={flash && entered ? { color: ["var(--ink)", "var(--coral)", "var(--ink)"] } : undefined}
      transition={{ duration: 0.4 }}
    >
      {prefix}
      {formatted}
      {suffix}
    </motion.span>
  );
}
