"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";
import { renderMarkdownLite } from "@/lib/case-studies/markdown";
import type { CaseStudyRow } from "@/lib/reviews/types";

type Mode = "create" | "edit";

type Props = {
  mode: Mode;
  initial?: CaseStudyRow | null;
  prefillReviewId?: string | null;
};

/**
 * Markdown editor + preview for case studies. Plain textarea + a
 * minimal Markdown-ish renderer keeps the bundle small; the operator
 * already writes Markdown in CRM-style tools and doesn't need WYSIWYG.
 *
 * Metrics are stored as jsonb and edited as a key/value table; new
 * rows are added on demand. Empty keys are dropped on save.
 */
export function CaseStudyEditor({ mode, initial, prefillReviewId }: Props) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [bodyMd, setBodyMd] = useState(initial?.body_md ?? "");
  const [heroImageUrl, setHeroImageUrl] = useState(initial?.hero_image_url ?? "");
  const [customerLabel, setCustomerLabel] = useState(initial?.customer_label ?? "");
  const [planCode, setPlanCode] = useState(initial?.plan_code ?? "");
  const [reviewId, setReviewId] = useState(initial?.review_id ?? prefillReviewId ?? "");
  const [metricEntries, setMetricEntries] = useState<Array<[string, string]>>(() => {
    const m = (initial?.metrics ?? {}) as Record<string, string | number>;
    const entries = Object.entries(m).map(([k, v]) => [k, String(v)] as [string, string]);
    return entries.length > 0 ? entries : [["cost_saving", "82%"]];
  });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const canSave =
    !busy &&
    /^[a-z0-9][a-z0-9-]{0,80}$/.test(slug) &&
    title.length >= 1 &&
    title.length <= 120 &&
    summary.length >= 1 &&
    summary.length <= 200 &&
    bodyMd.length >= 1;

  const setMetric = (idx: number, key: string, value: string) => {
    const next = metricEntries.map((e, i) => (i === idx ? ([key, value] as [string, string]) : e));
    setMetricEntries(next);
  };

  const addMetric = () => setMetricEntries([...metricEntries, ["", ""]]);
  const removeMetric = (idx: number) =>
    setMetricEntries(metricEntries.filter((_, i) => i !== idx));

  const buildMetricsObject = (): Record<string, string | number> => {
    const out: Record<string, string | number> = {};
    for (const [k, v] of metricEntries) {
      const key = k.trim();
      if (!key) continue;
      const num = Number(v);
      out[key] = Number.isFinite(num) && v.trim() !== "" && !v.includes("%") ? num : v;
    }
    return out;
  };

  const save = async () => {
    if (!canSave) return;
    setBusy("save");
    setError(null);
    try {
      const body = {
        slug,
        title,
        summary,
        bodyMd,
        reviewId: reviewId || null,
        heroImageUrl: heroImageUrl || null,
        customerLabel: customerLabel || null,
        planCode: planCode || null,
        metrics: buildMetricsObject(),
      };
      const url =
        mode === "create"
          ? "/api/admin/case-studies"
          : `/api/admin/case-studies/${initial?.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; caseStudy?: CaseStudyRow; error?: string }
        | null;
      if (!res.ok || !data?.ok) {
        setError(data?.error || "save_failed");
        return;
      }
      if (mode === "create" && data.caseStudy?.id) {
        router.push(`/admin-panel/case-studies/${data.caseStudy.id}`);
      } else {
        router.refresh();
      }
    } finally {
      setBusy(null);
    }
  };

  const togglePublish = async () => {
    if (mode !== "edit" || !initial) return;
    setBusy("publish");
    setError(null);
    try {
      const res = await fetch(`/api/admin/case-studies/${initial.id}/publish`, {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ published: !initial.published }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error || "action_failed");
        return;
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  };

  const rendered = useMemo(() => renderMarkdownLite(bodyMd), [bodyMd]);

  return (
    <div className="grid gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/40">
            Case study {mode === "create" ? "(신규)" : "(편집)"}
          </p>
          <h1 className="mt-1 text-2xl font-bold">
            {mode === "create" ? "새 케이스 스터디" : initial?.title || "—"}
          </h1>
          {mode === "edit" && initial ? (
            <p className="mt-2 text-xs text-cream/50">
              상태: {initial.published ? "게시됨" : "비공개"} ·{" "}
              생성 {initial.created_by} · 수정 {initial.updated_by ?? "—"}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === "edit" && initial ? (
            <button
              type="button"
              onClick={togglePublish}
              disabled={busy !== null}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition disabled:opacity-50 ${
                initial.published
                  ? "border border-cream/15 bg-cream/5 text-cream hover:bg-cream/10"
                  : "bg-emerald-500/80 text-[#0a1410] hover:bg-emerald-500"
              }`}
            >
              {busy === "publish"
                ? "처리중…"
                : initial.published
                  ? "비공개로 전환"
                  : "지금 게시"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-2 text-xs font-bold text-cream transition hover:bg-cream/10"
          >
            {previewOpen ? "에디터" : "미리보기"}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "save" ? "저장중…" : mode === "create" ? "초안 저장" : "변경 저장"}
          </button>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-[#D97757]/40 bg-[#D97757]/10 px-4 py-2 text-xs font-bold text-[#F0E2D2]">
          {error === "slug_taken"
            ? "이미 사용 중인 슬러그입니다."
            : error === "validation_failed"
              ? "입력값을 확인하세요."
              : "저장에 실패했습니다."}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3">
        <Field label="slug *">
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="hello-world"
            className="h-9 w-full rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </Field>
        <Field label="customer label">
          <input
            value={customerLabel}
            onChange={(e) => setCustomerLabel(e.target.value)}
            placeholder="프리랜서 / 백엔드"
            className="h-9 w-full rounded-lg border border-cream/15 bg-[#15140F] px-2 text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </Field>
        <Field label="plan code">
          <input
            value={planCode}
            onChange={(e) => setPlanCode(e.target.value)}
            placeholder="STANDARD / PRO / ULTRA"
            className="h-9 w-full rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </Field>
        <Field label="title *">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="h-9 w-full rounded-lg border border-cream/15 bg-[#15140F] px-2 text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </Field>
        <Field label="summary * (≤200자)">
          <input
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={200}
            className="h-9 w-full rounded-lg border border-cream/15 bg-[#15140F] px-2 text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </Field>
        <Field label="hero image URL">
          <input
            value={heroImageUrl}
            onChange={(e) => setHeroImageUrl(e.target.value)}
            placeholder="https://…"
            className="h-9 w-full rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </Field>
        <Field label="원본 review id (선택)">
          <input
            value={reviewId}
            onChange={(e) => setReviewId(e.target.value)}
            placeholder="uuid"
            className="h-9 w-full rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
          />
        </Field>
      </section>

      <section className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
          metrics (key / value)
        </p>
        <div className="mt-3 grid gap-2">
          {metricEntries.map(([k, v], idx) => (
            <div key={idx} className="grid grid-cols-[1fr_1fr_auto] items-center gap-2">
              <input
                value={k}
                onChange={(e) => setMetric(idx, e.target.value, v)}
                placeholder="cost_saving"
                className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
              />
              <input
                value={v}
                onChange={(e) => setMetric(idx, k, e.target.value)}
                placeholder="82%"
                className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
              />
              <button
                type="button"
                onClick={() => removeMetric(idx)}
                className="grid h-9 w-9 place-items-center rounded-lg bg-cream/5 text-cream/70 transition hover:bg-cream/10"
                aria-label="삭제"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addMetric}
            className="rounded-lg border border-dashed border-cream/15 bg-cream/5 py-1.5 text-[11px] font-bold text-cream/70 transition hover:bg-cream/10"
          >
            + metric 추가
          </button>
        </div>
      </section>

      {previewOpen ? (
        <section className="rounded-2xl border border-cream/10 bg-[#15140F] p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
            미리보기
          </p>
          <div
            className="prose-clco mt-4 max-w-none text-sm leading-7 text-cream/90"
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        </section>
      ) : (
        <section className="rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
            본문 markdown
          </p>
          <textarea
            value={bodyMd}
            onChange={(e) => setBodyMd(e.target.value)}
            className="mt-3 min-h-[440px] w-full resize-y rounded-xl border border-cream/15 bg-[#15140F] px-3 py-3 font-mono text-xs leading-7 text-cream outline-none focus:border-[#D97757]"
          />
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-cream/40">
        {label}
      </span>
      {children}
    </label>
  );
}

// Preview rendering is delegated to lib/case-studies/markdown.ts so the
// public detail page and the editor preview never drift apart.
