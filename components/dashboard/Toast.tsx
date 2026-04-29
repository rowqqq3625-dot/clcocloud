"use client";

import { AnimatePresence, motion } from "framer-motion";

type ToastProps = {
  message: string | null;
};

export function Toast({ message }: ToastProps) {
  return (
    <AnimatePresence>
      {message ? (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.98 }}
          transition={{ duration: 0.2 }}
          className="fixed right-5 top-24 z-50 rounded-xl border border-coral/70 bg-cream px-4 py-3 text-sm font-semibold text-primary shadow-lg"
        >
          {message}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
