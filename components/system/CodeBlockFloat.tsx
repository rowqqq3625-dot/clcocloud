"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type CodeBlockFloatProps = {
  lines: string[];
  className?: string;
};

export function CodeBlockFloat({ lines, className = "" }: CodeBlockFloatProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisibleCount(lines.length);
      return;
    }

    let current = 0;
    const id = window.setInterval(() => {
      current += 1;
      setVisibleCount(Math.min(lines.length, current));
      if (current >= lines.length) window.clearInterval(id);
    }, 120);

    return () => window.clearInterval(id);
  }, [lines]);

  return (
    <motion.div
      className={`pointer-events-none rounded-[20px] border border-white/10 bg-white/[0.04] p-4 font-mono text-xs leading-6 text-cream/40 shadow-md ${className}`}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      {lines.map((line, index) => (
        <div key={`${line}-${index}`} className={`text-code transition-opacity duration-300 ${index < visibleCount ? "opacity-100" : "opacity-0"}`}>
          {line}
        </div>
      ))}
    </motion.div>
  );
}
