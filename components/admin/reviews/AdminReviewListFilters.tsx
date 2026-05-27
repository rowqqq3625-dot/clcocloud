"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const STATUS_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "pending", label: "검토중" },
  { value: "approved", label: "승인" },
  { value: "rejected", label: "반려" },
  { value: "hidden", label: "숨김" },
];

const SORT_OPTIONS = [
  { value: "created_at_desc", label: "최신순" },
  { value: "created_at_asc", label: "오래된순" },
  { value: "rating_desc", label: "별점 높은순" },
  { value: "rating_asc", label: "별점 낮은순" },
  { value: "reward_granted_at_desc", label: "보상 지급일순" },
];

const REWARD_OPTIONS = [
  { value: "", label: "보상 전체" },
  { value: "true", label: "지급" },
  { value: "false", label: "미지급" },
];

const PLAN_OPTIONS = [
  { value: "", label: "플랜 전체" },
  { value: "STANDARD", label: "STANDARD" },
  { value: "PRO", label: "PRO" },
  { value: "ULTRA", label: "ULTRA" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function AdminReviewListFilters({
  status,
  rating,
  plan,
  rewardGranted,
  search,
  sort,
  limit,
}: {
  status: string;
  rating: number | null;
  plan: string | null;
  rewardGranted: "true" | "false" | null;
  search: string;
  sort: string;
  limit: number;
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
    next.delete("offset"); // any filter change resets pagination
    startTransition(() => {
      router.push(
        `/admin-panel/reviews/list${next.toString() ? `?${next.toString()}` : ""}`,
        { scroll: false }
      );
    });
  };

  return (
    <div
      className={`grid gap-3 rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-4 ${pending ? "pointer-events-none opacity-60" : ""}`}
    >
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value || (status === "" && opt.value === "all");
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => update({ status: opt.value === "all" ? null : opt.value })}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                active
                  ? "bg-[#D97757] text-cream"
                  : "bg-cream/5 text-cream/70 hover:bg-cream/10"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={rating ? String(rating) : ""}
          onChange={(e) => update({ rating: e.target.value || null })}
          className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-3 text-xs text-cream outline-none focus:border-[#D97757]"
        >
          <option value="">별점 전체</option>
          {[5, 4, 3, 2, 1].map((s) => (
            <option key={s} value={s}>
              {s}점
            </option>
          ))}
        </select>

        <select
          value={plan ?? ""}
          onChange={(e) => update({ plan: e.target.value || null })}
          className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-3 text-xs text-cream outline-none focus:border-[#D97757]"
        >
          {PLAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={rewardGranted ?? ""}
          onChange={(e) => update({ rewardGranted: e.target.value || null })}
          className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-3 text-xs text-cream outline-none focus:border-[#D97757]"
        >
          {REWARD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => update({ sort: e.target.value === "created_at_desc" ? null : e.target.value })}
          className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-3 text-xs text-cream outline-none focus:border-[#D97757]"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <select
          value={String(limit)}
          onChange={(e) => update({ limit: e.target.value === "25" ? null : e.target.value })}
          className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-3 text-xs text-cream outline-none focus:border-[#D97757]"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}건/page
            </option>
          ))}
        </select>

        <form
          className="ml-auto flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            update({ search: String(formData.get("search") || "") || null });
          }}
        >
          <input
            name="search"
            defaultValue={search}
            placeholder="제목·본문·작성자명 검색"
            className="h-9 w-64 rounded-lg border border-cream/15 bg-[#15140F] px-3 text-xs text-cream outline-none focus:border-[#D97757]"
          />
          <button
            type="submit"
            className="h-9 rounded-lg bg-cream/10 px-3 text-xs font-bold text-cream transition hover:bg-cream/15"
          >
            검색
          </button>
        </form>
      </div>
    </div>
  );
}
