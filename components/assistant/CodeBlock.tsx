"use client";

import React from "react";
import { CopyButton } from "@/components/ui/CopyButton";
import { Terminal } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeBlock({ code, language = "bash", className = "" }: CodeBlockProps) {
  const cleanCode = code.trim();

  return (
    <div
      className={`relative group my-3 overflow-hidden rounded-2xl border border-white/10 bg-[#0F0E0D] shadow-xl text-[13px] ${className}`}
      data-lenis-prevent
    >
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#171615] border-b border-white/5 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-coral/80 shrink-0" />
          <span className="font-mono text-[10px] font-bold text-cream/45 uppercase tracking-widest">
            {language}
          </span>
        </div>
        <div className="flex items-center">
          <CopyButton textToCopy={cleanCode} />
        </div>
      </div>

      {/* Code Display Area */}
      <div className="overflow-x-auto p-4 max-w-full font-mono text-cream/90 [scrollbar-width:thin]">
        <pre className="m-0 leading-relaxed font-mono whitespace-pre text-left break-normal">
          <code className="font-mono block select-text text-code" style={{ fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace" }}>
            {cleanCode}
          </code>
        </pre>
      </div>
    </div>
  );
}
