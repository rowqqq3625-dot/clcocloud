"use client";

import Image, { type ImageProps } from "next/image";
import { motion } from "framer-motion";
import { easeOut } from "@/lib/motion";

type ImageRevealProps = Omit<ImageProps, "alt" | "fill"> & {
  alt: string;
  fill?: boolean;
  className?: string;
  imageClassName?: string;
};

export function ImageReveal({
  className = "",
  imageClassName = "",
  alt,
  ...props
}: ImageRevealProps) {
  return (
    <motion.div
      className={`absolute inset-0 overflow-hidden ${className}`}
      initial={{ clipPath: "inset(0 100% 0 0)" }}
      whileInView={{ clipPath: "inset(0 0% 0 0)" }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{ duration: 0.7, ease: easeOut }}
    >
      <motion.div
        className="absolute inset-0"
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Image alt={alt} {...props} className={imageClassName} />
      </motion.div>
    </motion.div>
  );
}
