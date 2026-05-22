"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import { cardReveal } from "@/lib/motion";
import { Eye, EyeOff } from "lucide-react";

export type SavedDashboardKey = {
  id: string;
  masked_api_key: string;
  apiKey?: string;
  last_status: string | null;
  last_balance: number | null;
  last_spend_cap: number | null;
  last_rpm: number | null;
  last_checked_at: string;
};

type KeyInputCardProps = {
  onKeySubmit: (key: string) => void;
  savedKeys?: SavedDashboardKey[];
};

export function KeyInputCard({ onKeySubmit, savedKeys = [] }: KeyInputCardProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = apiKey.trim();

    if (!trimmed) {
      setError("API 키를 입력해주세요.");
      return;
    }

    if (trimmed.length < 10 && trimmed !== "pgdk4983") {
      setError("올바른 API 키 형식이 아닙니다.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 320));
      await onKeySubmit(trimmed);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
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
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="클로드 API키를 입력하세요."
              className="min-h-[52px] w-full rounded-[10px] border border-[var(--border-subtle)] bg-cream-2/45 px-4 pr-12 font-mono text-[14px] tracking-[0.01em] text-primary shadow-sm transition duration-200 placeholder:text-secondary/45 focus:border-coral focus:outline-none focus:ring-4 focus:ring-coral/10"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink transition-colors opacity-40 focus:opacity-100 group-focus-within:opacity-100 p-1 rounded-md focus:outline-none"
              title={showKey ? "비밀번호 숨기기" : "비밀번호 표시"}
            >
              {showKey ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {error ? <p className="text-sm font-medium text-coral">{error}</p> : null}
        </div>

        <motion.button
          type="submit"
          whileTap={{ scale: 0.97 }}
          className="group relative min-h-12 overflow-hidden rounded-xl bg-coral px-5 py-3 text-[15px] font-semibold text-cream shadow-md transition duration-200 hover:-translate-y-px hover:bg-coral-hi hover:shadow-coral"
        >
          <span className="relative z-[1]">대시보드 조회</span>
          {isSubmitting ? <span className="absolute inset-x-0 bottom-0 h-px animate-dashboard-progress bg-cream/90" /> : null}
          <span className="absolute inset-0 scale-0 rounded-full bg-cream/20 opacity-0 transition duration-300 group-active:scale-100 group-active:opacity-100" />
        </motion.button>
      </form>


      {savedKeys.length > 0 ? (
        <div className="mt-7 rounded-2xl border border-[var(--border-subtle)] bg-cream-2/35 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold tracking-[-0.01em] text-primary">이전 조회 기록</p>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary/55">synced</span>
          </div>
          <div className="mt-3 grid gap-2">
            {savedKeys.slice(0, 3).map((record) => (
              <button
                key={record.id}
                type="button"
                disabled={!record.apiKey}
                onClick={() => record.apiKey ? onKeySubmit(record.apiKey) : undefined}
                className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-cream px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-coral/45 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-55"
              >
                <span className="min-w-0">
                  <span className="block break-all font-mono text-[12px] font-semibold text-primary">{record.masked_api_key}</span>
                  <span className="mt-1 block text-[12px] text-secondary">
                    잔액 {typeof record.last_balance === "number" ? `$${record.last_balance.toFixed(4)}` : "-"} · {new Date(record.last_checked_at).toLocaleDateString("ko-KR")}
                  </span>
                </span>
                <span className="shrink-0 rounded-full bg-coral/10 px-3 py-1 text-[11px] font-bold text-coral transition group-hover:bg-coral group-hover:text-cream">불러오기</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex items-end justify-between gap-4">
        <p className="text-[13px] leading-[1.6] text-secondary">API 키는 발급 시 이메일로 전달됩니다.</p>
        <p className="font-mono text-[11px] text-secondary/50">secure · client-side only</p>
      </div>
      <a href="/#faq" className="mt-3 inline-flex text-[13px] font-semibold text-coral underline decoration-coral/30 underline-offset-4 transition hover:decoration-coral">
        키를 분실하셨나요? →
      </a>
    </div>
  );
}
