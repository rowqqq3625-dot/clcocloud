"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type CopyButtonProps = {
  textToCopy: string;
  className?: string;
};

export function CopyButton({ textToCopy, className = "" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 1600);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Toast Tooltip */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded bg-surface-dark-2 border border-border-dark text-cream text-[11px] font-medium whitespace-nowrap shadow-lg z-10"
          >
            복사되었습니다
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleCopy}
        className="flex items-center justify-center p-1.5 rounded-md border border-border-dark bg-surface-dark-2 text-cream-soft hover:text-cream transition-colors duration-150 relative overflow-hidden"
        aria-label="코드 복사"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.div
              key="check"
              initial={{ scale: 0.6, opacity: 0, rotate: -45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0, rotate: 45 }}
              transition={{ duration: 0.2 }}
            >
              <Check className="w-3.5 h-3.5 text-success" />
            </motion.div>
          ) : (
            <motion.div
              key="copy"
              initial={{ scale: 0.6, opacity: 0, rotate: 45 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0.6, opacity: 0, rotate: -45 }}
              transition={{ duration: 0.2 }}
            >
              <Copy className="w-3.5 h-3.5" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
