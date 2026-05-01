"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RevealText } from "@/components/typography/RevealText";

type FaqItem = readonly [string, string];

type AccordionFaqProps = {
  items: readonly FaqItem[];
};

export function AccordionFaq({ items }: AccordionFaqProps) {
  const [open, setOpen] = useState(-1);

  return (
    <div className="mt-12">
      {items.map(([question, answer], index) => {
        const isOpen = open === index;
        return (
          <div key={question} className="group relative py-6">
            <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-[var(--border-subtle)] opacity-70" />
            <button
              type="button"
              className="flex w-full items-center gap-6 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : index)}
            >
              <span className="font-mono text-sm text-tertiary transition-colors duration-200 group-hover:text-coral">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="flex-1 text-xl font-semibold">{question}</span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className={`text-3xl transition duration-300 ${isOpen ? "text-coral" : "text-primary"}`}
              >
                +
              </motion.span>
            </button>
            <motion.div
              initial={false}
              animate={isOpen ? { height: "auto", opacity: 1, y: 0 } : { height: 0, opacity: 0, y: 8 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className={`overflow-hidden ${isOpen ? "shadow-sm" : ""}`}
            >
              <RevealText className="max-w-[720px] pb-2 pl-14 pt-5 leading-8 text-secondary">{answer}</RevealText>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
