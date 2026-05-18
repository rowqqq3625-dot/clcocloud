"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionEnabled } from "./useMotionGuards";

type CCSplitTextProps = {
  text?: string;
  children?: ReactNode;
  className?: string;
  delay?: number;
  charsOnly?: boolean;
};

export function CCSplitText({ text, children, className = "", delay = 0.032, charsOnly = false }: CCSplitTextProps) {
  const enabled = useMotionEnabled();
  const content = text ?? (typeof children === "string" ? children : "");

  if (!enabled || !content) {
    return <span className={className}>{children ?? text}</span>;
  }

  const units = charsOnly ? [...content] : content.split(/(\s+)/);

  return (
    <span className={className} aria-label={content}>
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
