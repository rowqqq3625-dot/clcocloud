"use client";

import { motion } from "framer-motion";
import type { HTMLAttributes, ReactNode } from "react";
import { easeOut } from "@/lib/motion";

type SplitHeadingProps = {
  as?: "h1" | "h2" | "h3";
  className?: string;
  lines: ReactNode[];
  amount?: number;
} & HTMLAttributes<HTMLHeadingElement>;

export function SplitHeading({
  as = "h2",
  className,
  lines,
  amount = 0.45,
  ...rest
}: SplitHeadingProps) {
  const content = (
    <motion.span
      className="block"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.06
          }
        }
      }}
    >
      {lines.map((line, index) => (
        <motion.span
          key={index}
          className="block"
          variants={{
            hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.7, ease: easeOut }
            }
          }}
        >
          {line}
        </motion.span>
      ))}
    </motion.span>
  );

  if (as === "h1") return <h1 className={className} {...rest}>{content}</h1>;
  if (as === "h3") return <h3 className={className} {...rest}>{content}</h3>;
  return <h2 className={className} {...rest}>{content}</h2>;
}
