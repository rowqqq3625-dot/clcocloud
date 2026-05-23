import React from "react";

interface TemplateChipsProps {
  onSelectChip: (text: string) => void;
}

const TEMPLATE_CHIPS = [
  "가격이 궁금해요",
  "결제 방법",
  "API 키 발급은 어떻게",
  "잔액 확인 / 사용량",
  "환불 정책",
  "사용법 안내"
];

export function TemplateChips({ onSelectChip }: TemplateChipsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 md:gap-3 max-md:grid-cols-1 w-full my-4">
      <style dangerouslySetInnerHTML={{ __html: `
        .template-chip-btn {
          border: 1px solid var(--line);
          background-color: transparent;
          color: var(--ink);
          border-radius: 9999px;
          padding: 8px 14px;
          font-family: var(--font-mono), ui-monospace, monospace;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .template-chip-btn:hover {
          border-color: var(--coral);
          outline: 1px solid var(--coral);
          background-color: rgba(217, 119, 87, 0.08); /* 8% coral */
        }
        .template-chip-btn:focus-visible {
          outline: 2px solid var(--coral) !important;
          outline-offset: 2px !important;
        }
      `}} />
      {TEMPLATE_CHIPS.map((chip, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelectChip(chip)}
          className="template-chip-btn"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
