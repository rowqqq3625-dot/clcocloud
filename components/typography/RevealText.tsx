"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { easeOut } from "@/lib/motion";

type RevealTextProps = {
  as?: "p" | "div" | "span";
  className?: string;
  children: ReactNode;
  delay?: number;
  amount?: number;
};

export function RevealText({
  as = "p",
  className,
  children,
  delay = 0,
  amount = 0.4
}: RevealTextProps) {
  const props = {
    className,
    initial: { opacity: 0, clipPath: "inset(0 0 100% 0)" },
    whileInView: { opacity: 1, clipPath: "inset(0 0 0% 0)" },
    viewport: { once: true, amount },
    transition: { duration: 0.6, delay, ease: easeOut }
  } as const;

  if (as === "div") return <motion.div {...props}>{children}</motion.div>;
  if (as === "span") return <motion.span {...props}>{children}</motion.span>;
  return <motion.p {...props}>{children}</motion.p>;
}
