"use client";

import React from "react";
import { CodeBlock } from "./CodeBlock";
import { FeedbackButtons } from "./FeedbackButtons";
import { Terminal, User, Sparkles } from "lucide-react";

export interface AssistantMessage {
  id?: string | number;
  role: "user" | "assistant" | "system";
  content: string;
  images?: string[];
  timestamp?: string;
}

interface MessageBubbleProps {
  message: AssistantMessage;
  showHeader?: boolean;
}

// Custom Markdown Parser to parse bold, lists, and code blocks
function parseMessageContent(text: string, os: string = "macos") {
  if (!text) return null;

  // Split content by code blocks: ```lang ... ```
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const textBefore = text.slice(lastIndex, match.index);
    if (textBefore.trim()) {
      parts.push(renderTextContent(textBefore));
    }

    const language = match[1] || "bash";
    const code = match[2];

    parts.push(
      <CodeBlock
        key={`code-${match.index}`}
        code={code}
        language={language}
      />
    );

    lastIndex = codeBlockRegex.lastIndex;
  }

  const textAfter = text.slice(lastIndex);
  if (textAfter.trim() || parts.length === 0) {
    parts.push(renderTextContent(textAfter));
  }

  return parts;
}

// Helper to render standard paragraphs, bolding, and bulleted lists
function renderTextContent(text: string) {
  const paragraphs = text.split(/\n\n+/);
  const elements: React.ReactNode[] = [];
  let listKey = 0;

  paragraphs.forEach((para, pIdx) => {
    const lines = para.split("\n");
    
    // Check if this paragraph is a bulleted list
    const isBulletList = lines.some(line => {
      const trimmed = line.trim();
      return trimmed.startsWith("- ") || trimmed.startsWith("· ");
    });

    if (isBulletList) {
      const listItems: React.ReactNode[] = [];
      lines.forEach((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const isBullet = trimmed.startsWith("- ") || trimmed.startsWith("· ");
        const rawContent = isBullet ? trimmed.substring(2) : trimmed;

        // Parse **bold** markers
        const parts = rawContent.split(/\*\*([^*]+)\*\*/g);
        const contentSpans = parts.map((part, idx) => {
          if (idx % 2 === 1) {
            return <strong key={idx} className="font-semibold text-coral">{part}</strong>;
          }
          return part;
        });

        listItems.push(
          <li key={`li-${pIdx}-${lIdx}`} className="text-[13.5px] leading-relaxed text-inherit">
            {contentSpans}
          </li>
        );
      });

      elements.push(
        <ul key={`list-${listKey++}`} className="list-disc pl-5 my-2 space-y-1.5" data-lenis-prevent>
          {listItems}
        </ul>
      );
    } else {
      // General paragraph
      const contentNodes: React.ReactNode[] = [];
      lines.forEach((line, lIdx) => {
        // Parse **bold** markers
        const parts = line.split(/\*\*([^*]+)\*\*/g);
        const contentSpans = parts.map((part, idx) => {
          if (idx % 2 === 1) {
            return <strong key={idx} className="font-semibold text-coral">{part}</strong>;
          }
          return part;
        });

        contentSpans.forEach(span => contentNodes.push(span));
        
        if (lIdx < lines.length - 1) {
          contentNodes.push(<br key={`br-${pIdx}-${lIdx}`} />);
        }
      });

      elements.push(
        <p key={`p-${pIdx}`} className="text-[13.5px] leading-[1.65] mb-2.5 last:mb-0">
          {contentNodes}
        </p>
      );
    }
  });

  return elements;
}

export function MessageBubble({ message, showHeader }: MessageBubbleProps) {
  const isBot = message.role === "assistant";

  return (
    <div className={`flex flex-col w-full gap-2 ${isBot ? "items-start" : "items-end"} animate-fade-up`}>
      {/* Header Info Block */}
      {showHeader && (
        <div className="flex items-center gap-1.5 px-1 select-none">
          {isBot ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-coral shrink-0" />
              <span className="text-[11px] font-bold text-coral uppercase tracking-wider">어시스턴트</span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5 text-secondary shrink-0" />
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">나 (고객)</span>
            </>
          )}
        </div>
      )}

      {/* Main Message Bubble body */}
      <div
        className={`max-w-[90%] md:max-w-[84%] px-5 py-4 rounded-[22px] shadow-sm transition-all duration-200 ${
          isBot
            ? "bg-[var(--cream-2)] text-[var(--ink)] border border-[var(--border-subtle)] border-l-4 border-l-coral rounded-tl-md"
            : "bg-[var(--peach)] text-[var(--ink)] border border-coral/10 rounded-tr-md"
        }`}
        style={{
          wordBreak: "keep-all",
          overflowWrap: "break-word"
        }}
      >
        {/* Multimodal Preview Images inside bubble */}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {message.images.map((img, idx) => (
              <div
                key={idx}
                className="max-w-[140px] max-h-[140px] rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-[var(--cream)]"
              >
                <img
                  src={img}
                  alt={`첨부 이미지 ${idx + 1}`}
                  className="h-full w-full object-contain cursor-zoom-in"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      const w = window.open();
                      w?.document.write(`<img src="${img}" style="max-width:100%; max-height:100%; display:block; margin:auto;" />`);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Text Parsing and Render */}
        <div className="font-sans antialiased">
          {parseMessageContent(message.content)}
        </div>

        {/* Feedback buttons (Only at the end of assistant message) */}
        {isBot && message.id && (
          <FeedbackButtons messageId={message.id} />
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-fade-up {
          animation: fadeUp 280ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
          opacity: 0;
          transform: translateY(12px);
        }
        @keyframes fadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
  );
}
