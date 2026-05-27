"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { adminCsrfHeaders } from "@/lib/admin-csrf-client";
import type { AdminReview } from "@/lib/reviews/types";

type ReviewerOrder = {
  id: string;
  order_no: string;
  product_code: string;
  status: string;
  amount: number;
  created_at: string;
  paid_at: string | null;
};

type PriorReview = {
  id: string;
  rating: number;
  status: string;
  created_at: string;
};

type DetailResponse = {
  review: AdminReview;
  reviewer_orders: ReviewerOrder[];
  reviewer_prior_reviews: PriorReview[];
};

const REJECT_TEMPLATES = [
  "광고/홍보성 문구",
  "부적절한 표현/욕설",
  "사실관계 오류",
  "타사/타인 정보 노출",
  "동일 사용자 반복 제출",
];

const REVOKE_REASON_DEFAULT = "사후 검토 결과 보상 회수 필요";

function formatKstDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function ReviewReviewModal({
  reviewId,
  open,
  onClose,
  defaultRewardUsd = 50,
}: {
  reviewId: string | null;
  open: boolean;
  onClose: () => void;
  defaultRewardUsd?: number;
}) {
  const router = useRouter();
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rewardOverride, setRewardOverride] = useState<string>("");

  useEffect(() => {
    if (!open || !reviewId) {
      setDetail(null);
      setError(null);
      setRejectReason("");
      setRewardOverride("");
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`/api/admin/reviews/${reviewId}`, {
      credentials: "same-origin",
      headers: adminCsrfHeaders(),
    })
      .then(async (res) => {
        if (!res.ok) {
          setError(res.status === 404 ? "review_not_found" : "load_failed");
          return null;
        }
        return (await res.json()) as DetailResponse;
      })
      .then((data) => {
        if (data) setDetail(data);
      })
      .catch(() => setError("network_error"))
      .finally(() => setLoading(false));
  }, [open, reviewId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, busy, onClose]);

  if (!open || !reviewId) return null;

  const review = detail?.review;
  const rejected = review?.status === "rejected";
  const hidden = review?.status === "hidden";
  const approved = review?.status === "approved";
  const pending = review?.status === "pending";

  const callAction = async (
    label: string,
    path: string,
    body?: Record<string, unknown>
  ) => {
    if (busy) return;
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}${path}`, {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: body ? JSON.stringify(body) : undefined,
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "action_failed");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("network_error");
    } finally {
      setBusy(null);
    }
  };

  const onApprove = () => {
    const usdOverride = rewardOverride ? Number(rewardOverride) : undefined;
    if (usdOverride !== undefined && (!Number.isFinite(usdOverride) || usdOverride <= 0)) {
      setError("reward_amount_invalid");
      return;
    }
    callAction("approve", "/approve", usdOverride !== undefined ? { rewardUsd: usdOverride } : undefined);
  };

  const onReject = () => {
    if (!rejectReason.trim()) {
      setError("reason_required");
      return;
    }
    callAction("reject", "/reject", { reason: rejectReason.trim() });
  };

  const onHide = () => callAction("hide", "/hide");
  const onUnhide = () => callAction("unhide", "/unhide");
  const onFeature = (featured: boolean) =>
    callAction(featured ? "feature" : "unfeature", "/feature", { featured });

  const onRevoke = async () => {
    if (busy) return;
    const reason = window.prompt("보상 회수 사유", REVOKE_REASON_DEFAULT);
    if (!reason?.trim()) return;
    const hideAfter = window.confirm("이 리뷰도 함께 숨김 처리할까요? (취소 = 보상만 회수)");
    setBusy("revoke");
    setError(null);
    try {
      const ledgerLookup = await fetch(
        `/api/admin/reviews/rewards?userProvider=${encodeURIComponent(review!.user_provider)}&userProviderAccountId=${encodeURIComponent(review!.user_provider_account_id)}&includeRevoked=false&limit=100`,
        { credentials: "same-origin", headers: adminCsrfHeaders() }
      );
      const ledgerData = (await ledgerLookup.json().catch(() => null)) as {
        rows?: Array<{ id: string; review_id: string }>;
      } | null;
      const ledgerRow = ledgerData?.rows?.find((r) => r.review_id === reviewId);
      if (!ledgerRow) {
        setError("reward_not_found");
        return;
      }
      const res = await fetch(`/api/admin/reviews/rewards/${ledgerRow.id}/revoke`, {
        method: "POST",
        credentials: "same-origin",
        headers: adminCsrfHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ reason: reason.trim(), hideReview: hideAfter }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error || "action_failed");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("network_error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div className="relative grid w-full max-w-3xl gap-5 rounded-3xl border border-cream/10 bg-[#1A1916] p-7 text-cream shadow-2xl max-h-[92vh] overflow-y-auto">
        <header className="flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
              Review Detail
            </p>
            <h2 className="mt-1 text-xl font-bold">리뷰 검토</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy !== null}
            className="grid h-9 w-9 place-items-center rounded-full text-cream/60 transition hover:bg-cream/10 hover:text-cream disabled:opacity-50"
            aria-label="닫기"
          >
            ×
          </button>
        </header>

        {loading ? (
          <div className="grid place-items-center py-12">
            <p className="font-mono text-xs text-cream/40">로딩 중…</p>
          </div>
        ) : error && !detail ? (
          <p className="rounded-2xl border border-[#D97757]/40 bg-[#D97757]/10 px-4 py-3 text-sm font-bold text-[#F0E2D2]">
            {error === "review_not_found" ? "리뷰를 찾을 수 없습니다." : "불러오지 못했습니다."}
          </p>
        ) : review && detail ? (
          <>
            <section className="rounded-2xl border border-cream/10 bg-[#15140F] p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl text-[#D97757]" aria-label={`${review.rating}점`}>
                    {"★".repeat(review.rating)}
                    <span className="text-cream/20">{"★".repeat(5 - review.rating)}</span>
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${
                      pending
                        ? "bg-amber-500/15 text-amber-300"
                        : approved
                          ? "bg-emerald-500/15 text-emerald-300"
                          : rejected
                            ? "bg-[#D97757]/15 text-[#F0E2D2]"
                            : "bg-cream/10 text-cream/70"
                    }`}
                  >
                    {review.status}
                  </span>
                  {review.featured ? (
                    <span className="rounded-full bg-[#D97757]/15 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-[#F0E2D2]">
                      featured
                    </span>
                  ) : null}
                  {review.reward_granted ? (
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] text-emerald-300">
                      reward ${Number(review.reward_amount_usd).toFixed(2)}
                    </span>
                  ) : null}
                </div>
                <span className="font-mono text-xs text-cream/50">
                  {formatKstDateTime(review.created_at)}
                </span>
              </div>

              {review.title ? (
                <h3 className="mt-4 text-lg font-bold tracking-[-0.02em]">{review.title}</h3>
              ) : null}
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-cream/90">
                {review.body}
              </p>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <Meta label="작성자(표시)" value={review.display_name} />
                <Meta label="마스킹 이름" value={review.masked_name} />
                <Meta label="플랜" value={review.plan_code || "—"} />
                <Meta label="OAuth" value={`${review.user_provider}:${review.user_provider_account_id}`} />
                <Meta label="주문 id" value={review.order_id} />
                <Meta label="도움돼요" value={String(review.helpful_count)} />
                {rejected ? <Meta label="반려 사유" value={review.rejected_reason || "—"} /> : null}
                {approved ? <Meta label="승인자" value={review.approved_by || "—"} /> : null}
              </dl>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-cream/10 bg-[#15140F] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
                  과거 주문 (최근 20)
                </p>
                {detail.reviewer_orders.length === 0 ? (
                  <p className="mt-3 text-xs text-cream/50">없음</p>
                ) : (
                  <ul className="mt-3 grid gap-1.5 max-h-44 overflow-y-auto">
                    {detail.reviewer_orders.map((o) => (
                      <li
                        key={o.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-cream/5 px-2.5 py-1.5 text-[11px]"
                      >
                        <span className="truncate font-mono text-cream/80">{o.order_no}</span>
                        <span className="font-mono text-cream/50">{o.product_code}</span>
                        <span className="font-mono text-cream/40">{o.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-cream/10 bg-[#15140F] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
                  과거 리뷰
                </p>
                {detail.reviewer_prior_reviews.length === 0 ? (
                  <p className="mt-3 text-xs text-cream/50">없음</p>
                ) : (
                  <ul className="mt-3 grid gap-1.5 max-h-44 overflow-y-auto">
                    {detail.reviewer_prior_reviews.map((r) => (
                      <li
                        key={r.id}
                        className="flex items-center justify-between gap-2 rounded-lg bg-cream/5 px-2.5 py-1.5 text-[11px]"
                      >
                        <span className="font-mono text-[#D97757]">{"★".repeat(r.rating)}</span>
                        <span className="font-mono text-cream/50">{r.status}</span>
                        <span className="font-mono text-cream/40">
                          {formatKstDateTime(r.created_at)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {error ? (
              <p className="rounded-2xl border border-[#D97757]/40 bg-[#D97757]/10 px-4 py-3 text-sm font-bold text-[#F0E2D2]">
                {error === "reward_already_granted"
                  ? "이미 보상이 지급되었습니다."
                  : error === "review_not_pending"
                    ? "검토 대기 상태가 아닙니다."
                    : error === "review_not_rejectable"
                      ? "이 상태의 리뷰는 반려할 수 없습니다."
                      : error === "reason_required"
                        ? "사유를 입력해주세요."
                        : error === "reward_amount_invalid"
                          ? "보상 금액이 잘못되었습니다."
                          : error === "only_approved_can_be_featured"
                            ? "추천은 승인된 리뷰만 가능합니다."
                            : error === "reward_not_found"
                              ? "활성 보상 내역이 없습니다."
                              : "작업을 완료하지 못했습니다."}
              </p>
            ) : null}

            <section className="grid gap-4">
              {pending ? (
                <>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">
                      Approve + Grant Reward
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-cream/70">
                        보상 USD
                        <input
                          value={rewardOverride}
                          onChange={(e) => setRewardOverride(e.target.value.replace(/[^\d.]/g, ""))}
                          placeholder={String(defaultRewardUsd)}
                          className="h-8 w-24 rounded-lg border border-cream/15 bg-[#1A1916] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={onApprove}
                        disabled={busy !== null}
                        className="rounded-xl bg-emerald-500/80 px-5 py-2 text-xs font-bold text-[#0a1410] transition hover:bg-emerald-500 disabled:opacity-50"
                      >
                        {busy === "approve" ? "처리중…" : "승인 + 보상 지급"}
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[#D97757]/30 bg-[#D97757]/5 p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#F0E2D2]/80">
                      Reject
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {REJECT_TEMPLATES.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setRejectReason(t)}
                          className="rounded-full bg-cream/10 px-2.5 py-1 text-[10px] text-cream/80 transition hover:bg-cream/15"
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="반려 사유를 입력하거나 위 템플릿을 선택하세요"
                      maxLength={500}
                      className="mt-3 min-h-20 w-full resize-none rounded-xl border border-cream/15 bg-[#1A1916] px-3 py-2 text-xs text-cream outline-none focus:border-[#D97757]"
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={onReject}
                        disabled={busy !== null}
                        className="rounded-xl bg-[#D97757] px-5 py-2 text-xs font-bold text-cream transition hover:brightness-110 disabled:opacity-50"
                      >
                        {busy === "reject" ? "처리중…" : "반려"}
                      </button>
                    </div>
                  </div>
                </>
              ) : null}

              {(approved || hidden) ? (
                <div className="rounded-2xl border border-cream/10 bg-[#15140F] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream/40">
                    Post-approval actions
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hidden ? (
                      <button
                        type="button"
                        onClick={onUnhide}
                        disabled={busy !== null}
                        className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-2 text-xs font-bold text-cream transition hover:bg-cream/10 disabled:opacity-50"
                      >
                        {busy === "unhide" ? "처리중…" : "숨김 해제"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={onHide}
                        disabled={busy !== null}
                        className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-2 text-xs font-bold text-cream transition hover:bg-cream/10 disabled:opacity-50"
                      >
                        {busy === "hide" ? "처리중…" : "숨김"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onFeature(!review.featured)}
                      disabled={busy !== null || !approved}
                      title={!approved ? "승인된 리뷰만 추천 지정 가능" : undefined}
                      className="rounded-xl border border-[#D97757]/40 bg-[#D97757]/10 px-4 py-2 text-xs font-bold text-[#F0E2D2] transition hover:bg-[#D97757]/20 disabled:opacity-50"
                    >
                      {busy === "feature" || busy === "unfeature"
                        ? "처리중…"
                        : review.featured
                          ? "추천 해제"
                          : "추천 지정"}
                    </button>
                    {review.reward_granted ? (
                      <button
                        type="button"
                        onClick={onRevoke}
                        disabled={busy !== null}
                        className="rounded-xl border border-[#D97757]/40 bg-[#D97757]/5 px-4 py-2 text-xs font-bold text-[#F0E2D2] transition hover:bg-[#D97757]/15 disabled:opacity-50"
                      >
                        {busy === "revoke" ? "처리중…" : "보상 회수"}
                      </button>
                    ) : null}
                    <a
                      href={`/admin-panel/case-studies/new?reviewId=${review.id}`}
                      className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-2 text-xs font-bold text-cream transition hover:bg-cream/10"
                    >
                      케이스 스터디로 발전
                    </a>
                  </div>
                </div>
              ) : null}
            </section>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-cream/40">{label}</dt>
      <dd className="mt-1 truncate font-mono text-[11px] text-cream/80">{value}</dd>
    </div>
  );
}
