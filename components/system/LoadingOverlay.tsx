"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { easeOut } from "@/lib/motion";
import { BrandLogo } from "@/components/ui/BrandLogo";

const STORAGE_KEY = "clkocloud-loading-overlay";

export function LoadingOverlay() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    if (window.sessionStorage.getItem(STORAGE_KEY)) return;

    setVisible(true);
    window.sessionStorage.setItem(STORAGE_KEY, "shown");

    const closeId = window.setTimeout(() => setClosing(true), 800);
    const hideId = window.setTimeout(() => setVisible(false), 1500);

    return () => {
      window.clearTimeout(closeId);
      window.clearTimeout(hideId);
    };
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-[100] grid place-items-center bg-cream"
      animate={closing ? { y: "-100%" } : { y: 0 }}
      transition={{ duration: 0.7, ease: easeOut }}
    >
      <div className="w-[min(80vw,360px)]">
          <BrandLogo size={32} type="full" />
        <motion.div
          className="mt-3 h-px origin-left bg-coral"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: easeOut }}
        />
        <motion.div
          className="mt-8 h-px w-full origin-left bg-coral"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, ease: easeOut }}
        />
      </div>
    </motion.div>
  );
}
