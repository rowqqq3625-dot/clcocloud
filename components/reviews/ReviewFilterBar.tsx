"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const PLAN_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "전체 플랜" },
  { value: "STANDARD", label: "STANDARD" },
  { value: "PRO", label: "PRO" },
  { value: "ULTRA", label: "ULTRA" },
];

const SORT_OPTIONS: Array<{ value: "recent" | "helpful"; label: string }> = [
  { value: "recent", label: "최신순" },
  { value: "helpful", label: "도움순" },
];

/**
 * URL-driven filter bar for /reviews. Writes to the URL so deep
 * links and back/forward work naturally. Uses useTransition so the
 * page can show a pending state while the server re-renders.
 */
export function ReviewFilterBar({
  currentRating,
  currentPlan,
  currentSort,
}: {
  currentRating: number | null;
  currentPlan: string | null;
  currentSort: "recent" | "helpful";
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params?.toString() ?? "");
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
    }
    // Reset to page 1 when any filter changes.
    next.delete("offset");
    startTransition(() => {
      router.push(`/reviews${next.toString() ? `?${next.toString()}` : ""}`, { scroll: false });
    });
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${pending ? "pointer-events-none opacity-60" : ""}`}
    >
      <div className="flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-cream/70 p-1">
        {[null, 5, 4, 3, 2, 1].map((star) => {
          const active = currentRating === star;
          return (
            <button
              key={`star-${star ?? "all"}`}
              type="button"
              onClick={() => update({ rating: star === null ? null : String(star) })}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                active ? "bg-coral text-cream shadow-coral" : "text-secondary hover:text-coral"
              }`}
            >
              {star === null ? "전체" : `${star}★`}
            </button>
          );
        })}
      </div>

      <select
        value={currentPlan ?? ""}
        onChange={(e) => update({ plan: e.target.value || null })}
        className="h-10 rounded-full border border-[var(--border-subtle)] bg-cream/70 px-4 text-xs font-bold text-secondary outline-none transition focus:border-coral"
      >
        {PLAN_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      <div className="ml-auto flex items-center gap-1 rounded-full border border-[var(--border-subtle)] bg-cream/70 p-1">
        {SORT_OPTIONS.map((opt) => {
          const active = currentSort === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ sort: opt.value === "recent" ? null : opt.value })}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                active ? "bg-primary text-cream" : "text-secondary hover:text-primary"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
