"use client";

import { motion } from "framer-motion";

type MiniStatCardProps = {
  label: string;
  value: string;
  className?: string;
};

export function MiniStatCard({ label, value, className = "" }: MiniStatCardProps) {
  return (
    <motion.article
      className={`pointer-events-none rounded-[18px] border border-coral/30 bg-dark/70 px-4 py-3 font-mono text-cream shadow-md backdrop-blur-sm ${className}`}
      animate={{ y: [0, -8, 0], x: [0, 6, 0] }}
      transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
    >
      <p className="text-[11px] uppercase tracking-[.16em] text-cream/42">{label}</p>
      <strong className="mt-2 block text-sm tabular-nums">{value}</strong>
    </motion.article>
  );
}
