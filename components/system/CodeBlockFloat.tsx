"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { CopyButton } from "@/components/ui/CopyButton";

type CodeBlockFloatProps = {
  lines: string[];
  className?: string;
};

export function CodeBlockFloat({ lines, className = "" }: CodeBlockFloatProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVisibleCount(lines.length);
      return;
    }

    let current = 0;
    const id = window.setInterval(() => {
      current += 1;
      setVisibleCount(Math.min(lines.length, current));
      if (current >= lines.length) window.clearInterval(id);
    }, 120);

    return () => window.clearInterval(id);
  }, [lines]);

  const fullText = lines.map(l => l.replace(/^\$\s*/, "")).join("\n");

  const highlightLine = (line: string) => {
    const parts = line.split(/(\s+)/);
    return parts.map((part, idx) => {
      if (part === "export" || part === "curl" || part === "claude") {
        return (
          <span key={idx} className="text-coral-soft bg-coral/18 px-1 py-0.5 rounded font-semibold">
            {part}
          </span>
        );
      }
      if (part.startsWith('"') && part.endsWith('"')) {
        return (
          <span key={idx} className="text-cream/70">
            {part}
          </span>
        );
      }
      if (part.startsWith("https://")) {
        return (
          <span key={idx} className="text-cream/70 underline decoration-cream/30 decoration-[0.5px]">
            {part}
          </span>
        );
      }
      return <span key={idx} className="text-cream/40">{part}</span>;
    });
  };

  return (
    <motion.div
      className={`relative group pointer-events-auto rounded-[20px] border border-white/10 bg-white/[0.04] p-4 pr-12 font-mono text-xs leading-6 shadow-md ${className}`}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
        <CopyButton textToCopy={fullText} />
      </div>

      {lines.map((line, index) => (
        <div key={`${line}-${index}`} className={`text-code transition-opacity duration-300 ${index < visibleCount ? "opacity-100" : "opacity-0"}`}>
          {highlightLine(line)}
        </div>
      ))}
    </motion.div>
  );
}
