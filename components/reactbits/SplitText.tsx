"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

type SplitTextProps = {
  children: string;
  className?: string;
  delay?: number;
  charsOnly?: boolean;
};

export function SplitText({ children, className = "", delay = 0.032, charsOnly = false }: SplitTextProps) {
  const units = charsOnly ? [...children] : children.split(/(\s+)/);
  return (
    <span className={className} aria-label={children}>
      {units.map((unit, index) => (
        <motion.span
          key={`${unit}-${index}`}
          aria-hidden="true"
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, delay: index * delay, ease: [0.22, 1, 0.36, 1] }}
        >
          {unit}
        </motion.span>
      ))}
    </span>
  );
}

export function StaticText({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={className}>{children}</span>;
}
