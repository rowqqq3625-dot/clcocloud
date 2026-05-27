"use client";

import { useState } from "react";

type Props = {
  before: unknown;
  after: unknown;
};

/**
 * Compact before/after JSON diff for the activity log. Both sides are
 * rendered as pretty-printed JSON in a side-by-side block when opened.
 * For brevity in the list, we collapse by default behind a "diff" button.
 */
export function LogDiffViewer({ before, after }: Props) {
  const [open, setOpen] = useState(false);
  const hasBefore = before !== null && before !== undefined;
  const hasAfter = after !== null && after !== undefined;
  if (!hasBefore && !hasAfter) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-cream/15 bg-cream/5 px-2.5 py-1 text-[10px] font-bold text-cream/70 transition hover:bg-cream/10 hover:text-cream"
      >
        diff
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="grid w-full max-w-4xl gap-3 rounded-2xl border border-cream/10 bg-[#1A1916] p-5 text-cream">
            <header className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
                before / after
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-cream/60 transition hover:bg-cream/10 hover:text-cream"
              >
                ×
              </button>
            </header>
            <div className="grid gap-3 sm:grid-cols-2">
              <Pane title="before" data={before} />
              <Pane title="after" data={after} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Pane({ title, data }: { title: string; data: unknown }) {
  return (
    <div className="rounded-xl border border-cream/10 bg-[#15140F]">
      <p className="border-b border-cream/10 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cream/40">
        {title}
      </p>
      <pre className="max-h-80 overflow-auto px-3 py-2 font-mono text-[10px] leading-5 text-cream/80">
        {data == null ? "(null)" : JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}
