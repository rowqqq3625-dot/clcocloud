"use client";

import { motion } from "framer-motion";

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--bg-cream)_0%,var(--bg-cream-2)_100%)]" />
      <motion.div
        className="absolute right-[-100px] top-[-200px] h-[1100px] w-[1100px] rounded-full bg-coral/15 blur-[260px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute bottom-[-20rem] left-[-12rem] h-[700px] w-[700px] rounded-full bg-peach/40 blur-[220px]" />
      <div className="hero3d-grid-dots absolute bottom-0 right-0 h-[80%] w-[58%]" />
      <div className="hero3d-grain absolute inset-0" />
    </div>
  );
}
