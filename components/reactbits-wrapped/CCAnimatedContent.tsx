"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useMotionEnabled } from "./useMotionGuards";

type CCAnimatedContentProps = {
  children: ReactNode;
  className?: string;
  distance?: number;
  delay?: number;
  duration?: number;
  threshold?: number;
  scale?: number;
  opacityOnly?: boolean;
};

export function CCAnimatedContent({
  children,
  className = "",
  distance = 24,
  delay = 0.05,
  duration = 0.7,
  threshold = 0.15,
  scale = 1,
  opacityOnly = false
}: CCAnimatedContentProps) {
  const enabled = useMotionEnabled();

  if (!enabled) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: opacityOnly ? 0 : distance, scale }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: threshold }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
