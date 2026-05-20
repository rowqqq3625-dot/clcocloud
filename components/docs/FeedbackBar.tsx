"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useState } from "react";

export function FeedbackBar() {
  const [choice, setChoice] = useState<"up" | "down" | null>(null);
  return (
    <section className="docs-feedback">
      <div>
        <span>이 문서가 도움이 되었나요?</span>
        <button type="button" className={choice === "up" ? "is-selected" : ""} onClick={() => setChoice("up")} aria-label="도움됨">
          <ThumbsUp size={16} />
        </button>
        <button
          type="button"
          className={choice === "down" ? "is-selected" : ""}
          onClick={() => setChoice("down")}
          aria-label="도움 안 됨"
        >
          <ThumbsDown size={16} />
        </button>
      </div>
      <time>마지막 업데이트: 2026.05.19</time>
    </section>
  );
}
