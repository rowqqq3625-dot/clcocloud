"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewReviewModal } from "@/components/admin/reviews/ReviewReviewModal";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";
import type { AdminReview, ReviewStatus } from "@/lib/reviews/types";

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: "검토중",
  approved: "승인",
  rejected: "반려",
  hidden: "숨김",
};
const STATUS_CLASS: Record<ReviewStatus, string> = {
  pending: "bg-amber-500/15 text-amber-300",
  approved: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-[#D97757]/15 text-[#F0E2D2]",
  hidden: "bg-cream/10 text-cream/70",
};

function fmt(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

export function AdminReviewListTable({
  rows,
  defaultRewardUsd,
}: {
  rows: AdminReview[];
  defaultRewardUsd: number;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modalId, setModalId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [bulkReason, setBulkReason] = useState("");
  const [bulkRewardOverride, setBulkRewardOverride] = useState("");
  const [showBulkRejectInput, setShowBulkRejectInput] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const allChecked = useMemo(
    () => rows.length > 0 && rows.every((r) => selected.has(r.id)),
    [rows, selected]
  );

  const toggleAll = () => {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(rows.map((r) => r.id)));
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const callBulk = useCallback(
    async (label: string, path: string, body: Record<string, unknown>) => {
      if (busy) return;
      setBusy(label);
      setFeedback(null);
      try {
        const res = await fetch(`/api/admin/reviews/${path}`, {
          method: "POST",
          credentials: "same-origin",
          headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(body),
        });
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; succeeded?: number; failed?: number; error?: string }
          | null;
        if (!res.ok || !data?.ok) {
          setFeedback(`${label} 실패: ${data?.error || res.status}`);
          return;
        }
        setFeedback(
          `${label}: 성공 ${data.succeeded ?? 0}건 / 실패 ${data.failed ?? 0}건`
        );
        setSelected(new Set());
        setBulkReason("");
        setBulkRewardOverride("");
        setShowBulkRejectInput(false);
        router.refresh();
      } finally {
        setBusy(null);
      }
    },
    [busy, router]
  );

  const onBulkApprove = () => {
    const override = bulkRewardOverride ? Number(bulkRewardOverride) : undefined;
    if (override !== undefined && (!Number.isFinite(override) || override <= 0)) {
      setFeedback("보상 금액이 잘못되었습니다.");
      return;
    }
    callBulk("일괄 승인", "bulk-approve", {
      reviewIds: [...selected],
      ...(override !== undefined ? { rewardUsd: override } : {}),
    });
  };

  const onBulkReject = () => {
    if (!bulkReason.trim()) {
      setFeedback("반려 사유를 입력해주세요.");
      return;
    }
    callBulk("일괄 반려", "bulk-reject", {
      reviewIds: [...selected],
      reason: bulkReason.trim(),
    });
  };

  return (
    <>
      {selected.size > 0 ? (
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#D97757]/40 bg-[#1F1E1D] p-3 shadow-lg">
          <span className="text-sm font-bold text-cream">
            {selected.size}건 선택됨
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 text-[11px] text-cream/70">
              승인 보상 USD
              <input
                value={bulkRewardOverride}
                onChange={(e) =>
                  setBulkRewardOverride(e.target.value.replace(/[^\d.]/g, ""))
                }
                placeholder={String(defaultRewardUsd)}
                className="h-8 w-20 rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
              />
            </label>
            <button
              type="button"
              onClick={onBulkApprove}
              disabled={busy !== null}
              className="rounded-xl bg-emerald-500/80 px-4 py-2 text-xs font-bold text-[#0a1410] transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {busy === "일괄 승인" ? "처리중…" : "일괄 승인 + 보상"}
            </button>
            <button
              type="button"
              onClick={() => setShowBulkRejectInput((v) => !v)}
              className="rounded-xl border border-[#D97757]/40 bg-[#D97757]/10 px-4 py-2 text-xs font-bold text-[#F0E2D2] transition hover:bg-[#D97757]/20"
            >
              {showBulkRejectInput ? "취소" : "일괄 반려"}
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-2 text-xs font-bold text-cream transition hover:bg-cream/10"
            >
              선택 해제
            </button>
          </div>
        </div>
      ) : null}

      {showBulkRejectInput ? (
        <div className="rounded-2xl border border-[#D97757]/40 bg-[#D97757]/5 p-3">
          <textarea
            value={bulkReason}
            onChange={(e) => setBulkReason(e.target.value)}
            maxLength={500}
            placeholder="공통 반려 사유 (선택된 모든 행에 동일하게 적용됩니다)"
            className="min-h-16 w-full resize-none rounded-xl border border-cream/15 bg-[#15140F] px-3 py-2 text-xs text-cream outline-none focus:border-[#D97757]"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowBulkRejectInput(false)}
              className="rounded-xl px-3 py-1.5 text-xs text-cream/70 transition hover:text-cream"
            >
              취소
            </button>
            <button
              type="button"
              onClick={onBulkReject}
              disabled={busy !== null}
              className="rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:brightness-110 disabled:opacity-50"
            >
              {busy === "일괄 반려" ? "처리중…" : `${selected.size}건 반려`}
            </button>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <p className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-2 text-xs font-mono text-cream/80">
          {feedback}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left text-xs">
            <thead className="border-b border-cream/10 bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="전체 선택"
                    checked={allChecked}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-3 py-2.5">별점</th>
                <th className="px-3 py-2.5">제목·본문</th>
                <th className="px-3 py-2.5">작성자</th>
                <th className="px-3 py-2.5">플랜</th>
                <th className="px-3 py-2.5">상태</th>
                <th className="px-3 py-2.5">보상</th>
                <th className="px-3 py-2.5">작성일</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-12 text-center text-cream/50">
                    조건에 맞는 리뷰가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((review) => {
                  const isSelected = selected.has(review.id);
                  return (
                    <tr
                      key={review.id}
                      className={`border-b border-cream/5 transition ${
                        isSelected ? "bg-[#D97757]/8" : "hover:bg-cream/5"
                      }`}
                    >
                      <td className="px-3 py-3 align-top">
                        <input
                          type="checkbox"
                          aria-label="선택"
                          checked={isSelected}
                          onChange={() => toggleOne(review.id)}
                        />
                      </td>
                      <td className="px-3 py-3 align-top font-mono text-[#D97757]">
                        {"★".repeat(review.rating)}
                        <span className="text-cream/20">{"★".repeat(5 - review.rating)}</span>
                      </td>
                      <td className="max-w-[360px] px-3 py-3 align-top">
                        {review.title ? (
                          <p className="truncate font-bold text-cream">{review.title}</p>
                        ) : null}
                        <p
                          className={`text-cream/70 ${review.title ? "line-clamp-1" : "line-clamp-2"}`}
                        >
                          {review.body}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top font-mono text-cream/80">
                        {review.display_name}
                      </td>
                      <td className="px-3 py-3 align-top font-mono text-cream/60">
                        {review.plan_code || "—"}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${STATUS_CLASS[review.status]}`}
                        >
                          {STATUS_LABEL[review.status]}
                        </span>
                        {review.featured ? (
                          <span className="ml-1 rounded-full bg-[#D97757]/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-[#F0E2D2]">
                            추천
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-3 align-top font-mono">
                        {review.reward_granted ? (
                          <span className="text-emerald-300">
                            ${Number(review.reward_amount_usd).toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-cream/40">—</span>
                        )}
                      </td>
                      <td className="px-3 py-3 align-top font-mono text-cream/60">
                        {fmt(review.created_at)}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => setModalId(review.id)}
                          className="rounded-lg bg-[#D97757] px-3 py-1.5 text-[11px] font-bold text-cream transition hover:brightness-110"
                        >
                          검토
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReviewReviewModal
        reviewId={modalId}
        open={modalId !== null}
        onClose={() => setModalId(null)}
        defaultRewardUsd={defaultRewardUsd}
      />
    </>
  );
}
