"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type FaqItem = readonly [string, string];

type AccordionFaqProps = {
  items: readonly FaqItem[];
};

export function AccordionFaq({ items }: AccordionFaqProps) {
  const [open, setOpen] = useState(-1);

  function formatFaqAnswer(text: string) {
    const paragraphs = text.split("\n\n");
    return paragraphs.map((para, pIdx) => {
      const keywords = ["환불 불가", "7일 전 공지", "Anthropic 비공식", "수동 발급", "기간 만료 없이", "1회성 충전 방식", "API 키가 사용 불가", "공식 클로드코드와 호환"];
      let content: React.ReactNode[] = [para];

      keywords.forEach((keyword) => {
        const nextContent: React.ReactNode[] = [];
        content.forEach((item) => {
          if (typeof item === "string") {
            const parts = item.split(keyword);
            parts.forEach((part, index) => {
              nextContent.push(part);
              if (index < parts.length - 1) {
                nextContent.push(
                  <strong key={`${keyword}-${index}`} className="font-[560] text-[var(--ink)]">
                    {keyword}
                  </strong>
                );
              }
            });
          } else {
            nextContent.push(item);
          }
        });
        content = nextContent;
      });

      return (
        <p key={pIdx} className="mb-4 last:mb-0 text-[15px] leading-8 text-[var(--ink-soft)] font-normal">
          {content}
        </p>
      );
    });
  }

  return (
    <div className="mt-12">
      {items.map(([question, answer], index) => {
        const isOpen = open === index;
        return (
          <div key={question} className="group relative py-6 pl-6 transition-all duration-300">
            {/* Hover left vertical coral line */}
            <span className="absolute left-0 top-[26px] h-6 w-[1px] bg-[var(--coral)] opacity-0 transition-opacity duration-300 group-hover:opacity-60" />
            
            <span className="pointer-events-none absolute bottom-0 left-0 h-px w-full bg-[var(--border-subtle)] opacity-70" />
            <button
              type="button"
              className="flex w-full items-center gap-6 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? -1 : index)}
            >
              {/* Downsized, light ink, mono, wide tracking number */}
              <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-[var(--ink-soft)] opacity-50 transition-colors duration-200 group-hover:text-[var(--coral)] group-hover:opacity-100">
                {String(index + 1).padStart(2, "0")}
              </span>
              
              {/* Question title font weight 560 */}
              <span className="flex-1 text-xl font-[560] text-[var(--ink)]">{question}</span>
              
              {/* 1.5px stroke coral Chevron with 240ms duration */}
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center justify-center w-6 h-6"
              >
                <svg className="w-5 h-5 text-[var(--coral)] stroke-[1.5px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </motion.span>
            </button>
            
            <motion.div
              initial={false}
              animate={isOpen ? { height: "auto", opacity: 1, y: 0 } : { height: 0, opacity: 0, y: 8 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="max-w-[720px] pb-2 pl-14 pt-5">
                {formatFaqAnswer(answer)}
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
