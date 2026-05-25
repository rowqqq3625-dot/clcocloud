"use client";

import React, { useMemo, useState } from "react";
import { AnswerSection, SectionLabelType } from "./AnswerSection";
import { CodeCard } from "./CodeCard";
import { MessageActions } from "./MessageActions";

interface MessageData {
  id: string | number;
  role: string;
  content: string;
  timestamp?: string | number;
}

interface AssistantMessageProps {
  message: MessageData;
  onRebuild?: () => void;
}

/* ── Section label mapping ─────────────────────────────── */

const SECTION_PATTERNS: { pattern: RegExp; label: SectionLabelType }[] = [
  { pattern: /^\*{0,2}(?:##?\s*)?진단\*{0,2}:?\s*$/i, label: "진단" },
  { pattern: /^\*{0,2}(?:##?\s*)?DIAGNOSIS\*{0,2}:?\s*$/i, label: "진단" },
  { pattern: /^\*{0,2}(?:##?\s*)?해결\*{0,2}:?\s*$/i, label: "해결" },
  { pattern: /^\*{0,2}(?:##?\s*)?FIX\*{0,2}:?\s*$/i, label: "해결" },
  { pattern: /^\*{0,2}(?:##?\s*)?검증\*{0,2}:?\s*$/i, label: "검증" },
  { pattern: /^\*{0,2}(?:##?\s*)?VERIFY\*{0,2}:?\s*$/i, label: "검증" },
  { pattern: /^\*{0,2}(?:##?\s*)?참고\*{0,2}:?\s*$/i, label: "참고" },
  { pattern: /^\*{0,2}(?:##?\s*)?NOTE\*{0,2}:?\s*$/i, label: "참고" },
  { pattern: /^①\s*/i, label: "진단" },
  { pattern: /^②\s*/i, label: "해결" },
  { pattern: /^③\s*/i, label: "검증" },
  { pattern: /^④\s*/i, label: "참고" },
];

function matchSectionLabel(line: string): SectionLabelType | null {
  const trimmed = line.trim();
  for (const { pattern, label } of SECTION_PATTERNS) {
    if (pattern.test(trimmed)) return label;
  }
  return null;
}

/* ── Inline text rendering (bold, inline code) ─────────── */

function renderInlineText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    if (match[2]) {
      // Bold
      parts.push(
        <strong key={match.index} className="font-bold text-ink-100">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      // Inline code
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-peach font-mono text-[0.88em] text-[#B85A3E] select-text"
        >
          {match[3]}
        </code>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/* ── Content block types ───────────────────────────────── */

type ContentBlock =
  | { type: "section-label"; label: SectionLabelType }
  | { type: "code"; language: string; code: string }
  | { type: "paragraph"; text: string }
  | { type: "bullet"; items: string[] }
  | { type: "numbered"; items: string[] };

function parseContent(content: string): ContentBlock[] {
  const lines = content.split("\n");
  const blocks: ContentBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code fences
    if (line.trim().startsWith("```")) {
      const language = line.trim().replace(/^```/, "").trim() || "bash";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ type: "code", language, code: codeLines.join("\n") });
      continue;
    }

    // Section labels
    const sectionLabel = matchSectionLabel(line);
    if (sectionLabel) {
      blocks.push({ type: "section-label", label: sectionLabel });
      i++;
      continue;
    }

    // Bullet lists (- or •)
    if (/^\s*[-•]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-•]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-•]\s+/, "").trim());
        i++;
      }
      blocks.push({ type: "bullet", items });
      continue;
    }

    // Numbered lists
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, "").trim());
        i++;
      }
      blocks.push({ type: "numbered", items });
      continue;
    }

    // Empty lines — skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Regular paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !matchSectionLabel(lines[i]) &&
      !/^\s*[-•]\s+/.test(lines[i]) &&
      !/^\s*\d+[.)]\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") });
  }

  return blocks;
}

export function AssistantMessage({ message, onRebuild }: AssistantMessageProps) {
  const [hovered, setHovered] = useState(false);

  const blocks = useMemo(() => parseContent(message.content), [message.content]);

  let hasFoundFirstSection = false;

  const renderedBlocks = blocks.map((block, idx) => {
    switch (block.type) {
      case "section-label": {
        const isFirst = !hasFoundFirstSection;
        hasFoundFirstSection = true;
        return (
          <AnswerSection 
            key={idx} 
            label={block.label} 
            isFirst={isFirst} 
          />
        );
      }
      case "code":
        return (
          <CodeCard
            key={idx}
            code={block.code}
            language={block.language}
          />
        );
      case "paragraph":
        return (
          <p key={idx} className="t-body text-ink-100 mb-4 select-text font-normal leading-relaxed break-all break-anywhere">
            {renderInlineText(block.text)}
          </p>
        );
      case "bullet":
        return (
          <ul key={idx} className="list-disc pl-6 mb-4 space-y-1.5 text-ink-100 select-text">
            {block.items.map((item, bulletIdx) => (
              <li key={bulletIdx} className="t-body">
                {renderInlineText(item)}
              </li>
            ))}
          </ul>
        );
      case "numbered":
        return (
          <ol key={idx} className="list-decimal pl-6 mb-4 space-y-1.5 text-ink-100 select-text">
            {block.items.map((item, numIdx) => (
              <li key={numIdx} className="t-body">
                {renderInlineText(item)}
              </li>
            ))}
          </ol>
        );
      default:
        return null;
    }
  });

  return (
    <div
      className="relative pl-[24px] py-1 flex flex-col group animate-fade-up"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 6px Coral starting point dot */}
      <span 
        className="absolute left-0 top-[12px] w-1.5 h-1.5 rounded-full bg-coral shrink-0 select-none" 
        aria-hidden="true" 
      />

      <div className="w-full flex-1">
        {renderedBlocks}
      </div>

      {/* Message Actions bar (visible only on hover near the message block) */}
      <div 
        className={`transition-opacity duration-200 shrink-0 ${hovered ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden={!hovered}
      >
        <MessageActions 
          messageId={message.id} 
          messageText={message.content} 
          onRebuild={onRebuild} 
        />
      </div>
    </div>
  );
}
