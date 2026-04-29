"use client";

import { Check, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

type CopyButtonProps = {
  value: string;
  onCopied: (message: string) => void;
};

export function CopyButton({ value, onCopied }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    onCopied("API 키 복사됨");
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.button
      type="button"
      onClick={copy}
      whileTap={{ scale: 0.94 }}
      className="grid h-10 w-10 place-items-center rounded-xl border border-[var(--border-subtle)] bg-cream text-secondary shadow-sm transition duration-200 hover:-translate-y-px hover:border-coral/60 hover:text-coral hover:shadow-md"
      aria-label="API 키 복사"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </motion.button>
  );
}
