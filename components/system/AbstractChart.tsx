"use client";

import { motion } from "framer-motion";
import { easeOut } from "@/lib/motion";

type AbstractChartProps = {
  className?: string;
};

export function AbstractChart({ className = "" }: AbstractChartProps) {
  return (
    <motion.svg
      viewBox="0 0 320 120"
      fill="none"
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
    >
      <motion.path
        d="M8 94C52 94 58 44 102 44C146 44 156 104 204 104C252 104 258 24 312 24"
        stroke="var(--coral)"
        strokeWidth="1"
        strokeOpacity="0.4"
        variants={{
          hidden: { pathLength: 0, opacity: 0 },
          visible: { pathLength: 1, opacity: 1, transition: { duration: 1.2, ease: easeOut } }
        }}
      />
      {[{ cx: 8, cy: 94 }, { cx: 102, cy: 44 }, { cx: 204, cy: 104 }, { cx: 312, cy: 24 }].map((point) => (
        <circle key={`${point.cx}-${point.cy}`} cx={point.cx} cy={point.cy} r="1" fill="var(--coral)" fillOpacity="0.7" />
      ))}
    </motion.svg>
  );
}
