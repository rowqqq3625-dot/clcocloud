import React from "react";

export function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1.5 px-4 py-3 rounded-2xl border bg-[var(--cream-2)]"
      style={{
        alignSelf: "flex-start",
        borderTopLeftRadius: "6px",
        borderColor: "var(--border-subtle)",
        maxWidth: "fit-content"
      }}
      aria-label="답변을 작성하고 있습니다"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .bot-dot {
          width: 6px;
          height: 6px;
          background-color: var(--coral);
          border-radius: 50%;
          opacity: 0.3;
          animation: bot-typing-fade 0.6s infinite ease-in-out;
        }
        .bot-dot:nth-child(1) { animation-delay: 0s; }
        .bot-dot:nth-child(2) { animation-delay: 0.15s; }
        .bot-dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bot-typing-fade {
          0%, 100% { opacity: 0.3; transform: scale(0.9); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .bot-dot {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}} />
      <div className="flex gap-1.5 items-center h-2">
        <span className="bot-dot" />
        <span className="bot-dot" />
        <span className="bot-dot" />
      </div>
    </div>
  );
}
