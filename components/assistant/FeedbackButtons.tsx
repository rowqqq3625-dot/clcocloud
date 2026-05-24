"use client";

import React, { useState } from "react";
import { ThumbsUp, ThumbsDown, Send, Check } from "lucide-react";

interface FeedbackButtonsProps {
  messageId: string | number;
}

export function FeedbackButtons({ messageId }: FeedbackButtonsProps) {
  const [rating, setRating] = useState<1 | -1 | null>(null);
  const [reason, setReason] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFeedback = async (score: 1 | -1) => {
    if (submitted || submitting) return;

    setRating(score);

    if (score === 1) {
      setSubmitting(true);
      try {
        await fetch("/api/assistant/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId, rating: 1 })
        });
        setSubmitted(true);
      } catch (err) {
        console.error("Failed to submit positive feedback:", err);
      } finally {
        setSubmitting(false);
      }
    } else {
      setShowReasonInput(true);
    }
  };

  const handleSubmitReason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || submitting) return;

    setSubmitting(true);
    try {
      await fetch("/api/assistant/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, rating: -1, reason: reason.trim() })
      });
      setSubmitted(true);
      setShowReasonInput(false);
    } catch (err) {
      console.error("Failed to submit negative feedback:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-2 w-full max-w-sm font-sans select-none" data-lenis-prevent>
      {submitted ? (
        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-success/80 mt-1 animate-scale-in">
          <Check className="w-3.5 h-3.5" />
          <span>피드백을 보내주셔서 감사합니다!</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {!showReasonInput ? (
            <div className="flex items-center gap-2 text-secondary/60">
              <span className="text-[10px] font-mono uppercase tracking-wider">이 답변이 유용했나요?</span>
              <button
                type="button"
                onClick={() => handleFeedback(1)}
                disabled={submitting}
                className="flex items-center justify-center p-1 rounded hover:bg-coral/10 hover:text-coral transition-colors duration-150"
                aria-label="유용함"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleFeedback(-1)}
                disabled={submitting}
                className="flex items-center justify-center p-1 rounded hover:bg-coral/10 hover:text-coral transition-colors duration-150"
                aria-label="도움 되지 않음"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReason} className="flex gap-1.5 items-center w-full animate-fade-in">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="어떤 점이 불편하셨나요? (선택)"
                className="flex-1 h-7.5 text-[11px] px-2 rounded-lg border border-[var(--border-subtle)] bg-cream-2 text-primary focus:outline-none focus:border-coral transition-colors"
                maxLength={200}
                data-lenis-prevent
              />
              <button
                type="submit"
                disabled={submitting}
                className="grid h-7.5 w-7.5 place-items-center rounded-lg bg-coral hover:bg-coral-deep text-cream transition-colors duration-150 shrink-0 cursor-pointer shadow-sm disabled:bg-peach"
              >
                <Send className="w-3 h-3" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
