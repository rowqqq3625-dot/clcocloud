"use client";

import { Html } from "@react-three/drei";
import { AnimatePresence, motion } from "framer-motion";

export function MascotToast({ message }: { message: string | null }) {
  return (
    <Html position={[-0.92, 0.78, 0]} transform={false} center={false} zIndexRange={[60, 50]}>
      <div aria-live="polite" className="pointer-events-none hidden -translate-x-full lg:block">
        <AnimatePresence>
          {message ? (
            <motion.div
              key={message}
              className="whitespace-nowrap rounded-2xl border border-[var(--border-subtle)] bg-cream px-4 py-3 text-sm font-bold text-primary shadow-[0_18px_48px_rgba(31,30,29,.16)]"
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {message}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </Html>
  );
}
