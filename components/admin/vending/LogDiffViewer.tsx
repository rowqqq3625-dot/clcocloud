"use client";

import { useState } from "react";

type Props = {
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  action: string;
  meta?: { actor?: string | null; created_at?: string; plan_code?: string | null; order_no?: string | null };
};

// before/after jsonb 좌우 비교 뷰어.
// raw key_value 평문은 DB 차원에서 저장되지 않지만, 안전상 마스킹 정규식도 한 번 더 적용.
export function LogDiffViewer({ before, after, action, meta }: Props) {
  const [open, setOpen] = useState(false);

  const mask = (input: unknown): unknown => {
    if (typeof input === "string") return input.replace(/sk-[A-Za-z0-9_-]{8,}/g, (m) => `${m.slice(0, 8)}***`);
    if (Array.isArray(input)) return input.map(mask);
    if (input && typeof input === "object") {
      const obj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(input as Record<string, unknown>)) obj[k] = mask(v);
      return obj;
    }
    return input;
  };

  return (
    <div className="grid gap-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-cream/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-cream/70 hover:border-cream/40"
      >
        {open ? "diff 닫기" : "diff 보기"}
      </button>
      {open ? (
        <div className="grid gap-2 rounded-2xl border border-cream/10 bg-black/30 p-3">
          {meta ? (
            <div className="flex flex-wrap gap-3 text-[10px] font-mono uppercase tracking-[0.16em] text-cream/40">
              <span>action: <span className="text-[#F0E2D2]">{action}</span></span>
              {meta.created_at ? <span>{meta.created_at}</span> : null}
              {meta.actor ? <span>by {meta.actor.slice(0, 8)}</span> : null}
              {meta.plan_code ? <span>plan: {meta.plan_code}</span> : null}
              {meta.order_no ? <span>order: {meta.order_no}</span> : null}
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">before</p>
              <pre className="mt-1 max-h-64 overflow-auto rounded-xl bg-black/40 p-2 font-mono text-[10px] text-cream/70">
                {JSON.stringify(mask(before), null, 2)}
              </pre>
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">after</p>
              <pre className="mt-1 max-h-64 overflow-auto rounded-xl bg-black/40 p-2 font-mono text-[10px] text-cream/70">
                {JSON.stringify(mask(after), null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
