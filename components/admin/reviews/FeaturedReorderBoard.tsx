"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";
import type { PublicReview } from "@/lib/reviews/types";

/**
 * Operator-curated ordering for the landing-page featured slider.
 * Up/down arrows reorder rows client-side; "저장" persists the order
 * via POST /api/admin/reviews/featured/order. Drag-and-drop would be
 * nicer but adds a dependency for marginal UX gain.
 */
export function FeaturedReorderBoard({ initialItems }: { initialItems: PublicReview[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const move = (index: number, dir: -1 | 1) => {
    const next = [...items];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
  };

  const remove = async (reviewId: string) => {
    if (busy) return;
    if (!window.confirm("이 리뷰의 추천 지정을 해제할까요?")) return;
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}/feature`, {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ featured: false }),
      });
      if (!res.ok) {
        setFeedback("해제 실패");
        return;
      }
      setItems(items.filter((i) => i.id !== reviewId));
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (busy) return;
    setBusy(true);
    setFeedback(null);
    try {
      const pairs = items.map((item, idx) => ({ reviewId: item.id, order: idx }));
      const res = await fetch("/api/admin/reviews/featured/order", {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ pairs }),
      });
      if (!res.ok) {
        setFeedback("저장 실패");
        return;
      }
      setFeedback("저장됨");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-cream/15 bg-cream/5 px-4 py-10 text-center text-sm text-cream/50">
        추천 리뷰가 없습니다. 목록 페이지에서 승인된 리뷰를 추천으로 지정하세요.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-cream/70">
          현재 노출 순서 (위에서 아래 = 슬라이더 좌→우)
        </p>
        <div className="flex items-center gap-2">
          {feedback ? (
            <span className="font-mono text-[11px] text-cream/60">{feedback}</span>
          ) : null}
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? "처리중…" : "순서 저장"}
          </button>
        </div>
      </div>

      <ul className="grid gap-2">
        {items.map((item, idx) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-2xl border border-cream/10 bg-[#15140F] p-3"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#D97757]/20 font-mono text-xs font-bold text-[#F0E2D2]">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2">
                <span className="font-mono text-[#D97757]">
                  {"★".repeat(item.rating)}
                  <span className="text-cream/20">{"★".repeat(5 - item.rating)}</span>
                </span>
                {item.plan_code ? (
                  <span className="rounded-full bg-cream/10 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-cream/60">
                    {item.plan_code}
                  </span>
                ) : null}
              </p>
              {item.title ? (
                <p className="mt-1 truncate text-sm font-bold text-cream">{item.title}</p>
              ) : null}
              <p className="line-clamp-1 text-xs text-cream/60">{item.body}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={busy || idx === 0}
                className="grid h-8 w-8 place-items-center rounded-lg bg-cream/5 text-cream/70 transition hover:bg-cream/10 disabled:opacity-30"
                aria-label="위로"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={busy || idx === items.length - 1}
                className="grid h-8 w-8 place-items-center rounded-lg bg-cream/5 text-cream/70 transition hover:bg-cream/10 disabled:opacity-30"
                aria-label="아래로"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(item.id)}
                disabled={busy}
                className="ml-2 rounded-lg border border-[#D97757]/40 bg-[#D97757]/10 px-3 py-1.5 text-[11px] font-bold text-[#F0E2D2] transition hover:bg-[#D97757]/20 disabled:opacity-50"
              >
                추천 해제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
