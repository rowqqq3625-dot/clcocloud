"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type AnimatedContentProps = {
  children: ReactNode;
  className?: string;
  distance?: number;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
};

export function AnimatedContent({
  children,
  className = "",
  distance = 24,
  delay = 0.05,
  duration = 0.7,
  threshold = 0.15,
  once = true
}: AnimatedContentProps) {
  const variants: Variants = {
    hidden: { opacity: 0, y: distance },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: threshold }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
