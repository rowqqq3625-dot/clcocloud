"use client";

import { motion } from "framer-motion";
import type { HTMLAttributes, ReactNode } from "react";

type SplitHeadingProps = {
  as?: "h1" | "h2" | "h3";
  className?: string;
  lines: ReactNode[];
  amount?: number;
} & HTMLAttributes<HTMLHeadingElement>;

const lineVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
      delay: i * 0.06,
    }
  })
};

export function SplitHeading({
  as = "h2",
  className,
  lines,
  amount = 0.45,
  ...rest
}: SplitHeadingProps) {
  const content = (
    <span className="block">
      {lines.map((line, index) => (
        <motion.span
          key={index}
          custom={index}
          variants={lineVariants}
          initial="hidden"
          animate="visible"
          className="block"
        >
          {line}
        </motion.span>
      ))}
    </span>
  );

  if (as === "h1") return <h1 className={className} {...rest}>{content}</h1>;
  if (as === "h3") return <h3 className={className} {...rest}>{content}</h3>;
  return <h2 className={className} {...rest}>{content}</h2>;
}
