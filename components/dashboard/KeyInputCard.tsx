"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cardReveal } from "@/lib/motion";

type KeyInputCardProps = {
  onKeySubmit: (key: string) => void;
};

export function KeyInputCard({ onKeySubmit }: KeyInputCardProps) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = apiKey.trim();

    if (!trimmed) {
      setError("API 키를 입력해주세요.");
      return;
    }

    if (trimmed.length < 10) {
      setError("올바른 API 키 형식이 아닙니다.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    window.setTimeout(() => onKeySubmit(trimmed), 320);
  };

  return (
    <motion.div
      variants={cardReveal}
      className="mx-auto w-full max-w-[560px] rounded-2xl border border-[var(--border-subtle)] bg-cream p-6 shadow-md sm:p-10"
    >
      <div className="mb-7">
        <h3 className="text-[24px] font-[560] tracking-[-0.018em] text-primary">대시보드 접속</h3>
        <p className="mt-3 text-[15px] leading-[1.65] tracking-[-0.01em] text-secondary">
          API 키를 입력하여 잔액과 사용량을 실시간으로 확인하세요.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-5">
        <div className="grid gap-2">
          <label htmlFor="apiKey" className="font-mono text-[11px] uppercase tracking-[0.16em] text-secondary">
            API KEY
          </label>
          <div className="group relative">
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="sk-••••••••••••"
              className="min-h-[52px] w-full rounded-[10px] border border-[var(--border-subtle)] bg-cream-2/45 px-4 pr-10 font-mono text-[14px] tracking-[0.01em] text-primary shadow-sm transition duration-200 placeholder:text-secondary/45 focus:border-coral focus:outline-none focus:ring-4 focus:ring-coral/10"
              autoComplete="off"
              spellCheck="false"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 hidden h-5 w-px -translate-y-1/2 animate-soft-pulse bg-coral group-focus-within:block" />
          </div>
          {error ? <p className="text-sm font-medium text-coral">{error}</p> : null}
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          disabled={isSubmitting}
          className="group relative min-h-12 overflow-hidden rounded-xl bg-coral px-5 py-3 text-[15px] font-semibold text-cream shadow-md transition duration-200 hover:-translate-y-px hover:bg-coral-hi hover:shadow-coral disabled:pointer-events-none disabled:opacity-80"
        >
          <span className="relative z-[1]">대시보드 조회</span>
          {isSubmitting ? <span className="absolute inset-x-0 bottom-0 h-px animate-dashboard-progress bg-cream/90" /> : null}
          <span className="absolute inset-0 scale-0 rounded-full bg-cream/20 opacity-0 transition duration-300 group-active:scale-100 group-active:opacity-100" />
        </motion.button>
      </form>

      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="text-[13px] leading-[1.6] text-secondary">API 키는 발급 시 이메일로 전달됩니다.</p>
        <p className="font-mono text-[11px] text-secondary/50">secure · client-side only</p>
      </div>
      <a href="/#faq" className="mt-3 inline-flex text-[13px] font-semibold text-coral underline decoration-coral/30 underline-offset-4 transition hover:decoration-coral">
        키를 분실하셨나요? →
      </a>
    </motion.div>
  );
}
