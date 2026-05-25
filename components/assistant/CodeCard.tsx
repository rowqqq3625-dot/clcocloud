"use client";

import React, { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";

interface CodeCardProps {
  code: string;
  language?: string;
  filename?: string;
}

export function CodeCard({ code, language = "bash", filename }: CodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Very simple client-side keyword syntax highlighting for terminal commands and config files
  const highlightCode = (rawCode: string) => {
    const lines = rawCode.split("\n");
    return lines.map((line, idx) => {
      // 1. Comment line
      if (line.trim().startsWith("#") || line.trim().startsWith("//")) {
        return (
          <span key={idx} className="block select-text" style={{ color: "rgba(255,255,255,0.35)" }}>
            {line}
          </span>
        );
      }

      // 2. Simple regex highlighting for common keywords
      const tokens: React.ReactNode[] = [];
      // Split by spaces to find keywords, environment variables, values, etc.
      const words = line.split(/(\s+|=|"|'|:|;)/);
      
      let inString = false;
      let stringChar = "";

      words.forEach((word, wIdx) => {
        if (!word) return;

        // String tracking
        if ((word === '"' || word === "'") && !inString) {
          inString = true;
          stringChar = word;
          tokens.push(<span key={wIdx} className="text-[#5A8A6B]">{word}</span>);
          return;
        }
        if (inString && word === stringChar) {
          inString = false;
          tokens.push(<span key={wIdx} className="text-[#5A8A6B]">{word}</span>);
          return;
        }
        if (inString) {
          tokens.push(<span key={wIdx} className="text-[#5A8A6B]">{word}</span>);
          return;
        }

        // Keywords
        const isKeyword = /^(export|source|npm|npx|git|node|cd|mkdir|rm|cp|mv|echo|cat|sudo|install|run|dev|build|api-anthropic\.com)$/.test(word);
        // Special URLs or Hostnames
        const isProxy = word.includes("api-anthropic.com") || word.includes("https://api-anthropic.com");

        if (isKeyword) {
          tokens.push(<span key={wIdx} className="text-[#E59478] font-semibold">{word}</span>);
        } else if (isProxy) {
          tokens.push(<span key={wIdx} className="text-[#5A8A6B] underline decoration-[#5A8A6B]/40 decoration-wavy">{word}</span>);
        } else if (/^[A-Z0-9_]+$/.test(word) && word.length > 2) {
          // Environment Variables in capital letters
          tokens.push(<span key={wIdx} className="text-[#E59478]">{word}</span>);
        } else {
          tokens.push(<span key={wIdx} className="text-[#F7F1E8]">{word}</span>);
        }
      });

      return (
        <span key={idx} className="block min-h-[1.5rem] select-text">
          {tokens}
        </span>
      );
    });
  };

  const defaultFilename = filename || (language === "bash" || language === "sh" ? "terminal" : `code.${language}`);

  return (
    <div 
      className="w-full bg-[#1F1E1D] border border-white/[0.04] rounded-xl overflow-hidden my-4 shadow-md font-mono"
      role="region"
      aria-label={`${language} 코드 블록`}
    >
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/[0.04] select-none">
        <div className="flex items-center gap-2">
          {/* Traffic light dots */}
          <div className="flex items-center gap-1.5 mr-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] inline-block" />
          </div>
          <span className="text-white/50 text-[11px] font-medium tracking-wide">
            {defaultFilename}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/30 text-[10px] uppercase tracking-wider">
            {language}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-white/40 hover:text-coral transition-colors duration-150 py-0.5"
            aria-label="코드 복사"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-success shrink-0" />
                <span className="text-success text-[10px] font-bold">복사됨</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 shrink-0" />
                <span className="text-[10px]">복사</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <pre className="p-4 overflow-x-auto text-[14.5px] leading-relaxed [scrollbar-width:thin] text-[#F7F1E8]">
        <code>{highlightCode(code)}</code>
      </pre>
    </div>
  );
}
