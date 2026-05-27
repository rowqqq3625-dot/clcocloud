import Link from "next/link";
import { LogDiffViewer } from "@/components/admin/reviews/LogDiffViewer";
import { ReviewsSubNav } from "@/components/admin/reviews/ReviewsSubNav";
import { formatKstDateTime } from "@/lib/admin/format";
import { getReviewActionLogs } from "@/lib/reviews/logs";
import type { ReviewActionLogAction } from "@/lib/reviews/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_ACTIONS: readonly ReviewActionLogAction[] = [
  "REVIEW_SUBMIT",
  "REVIEW_RESUBMIT",
  "REVIEW_APPROVE",
  "REVIEW_REJECT",
  "REVIEW_HIDE",
  "REVIEW_UNHIDE",
  "REVIEW_FEATURE",
  "REVIEW_UNFEATURE",
  "REVIEW_HELPFUL_ADD",
  "REVIEW_HELPFUL_REMOVE",
  "REWARD_GRANT",
  "REWARD_REVOKE",
  "CASE_STUDY_CREATE",
  "CASE_STUDY_UPDATE",
  "CASE_STUDY_PUBLISH",
  "CASE_STUDY_UNPUBLISH",
];

const ACTION_LABEL: Record<ReviewActionLogAction, string> = {
  REVIEW_SUBMIT: "리뷰 제출",
  REVIEW_RESUBMIT: "리뷰 재제출",
  REVIEW_APPROVE: "리뷰 승인",
  REVIEW_REJECT: "리뷰 반려",
  REVIEW_HIDE: "리뷰 숨김",
  REVIEW_UNHIDE: "리뷰 숨김 해제",
  REVIEW_FEATURE: "추천 지정",
  REVIEW_UNFEATURE: "추천 해제",
  REVIEW_HELPFUL_ADD: "도움돼요 추가",
  REVIEW_HELPFUL_REMOVE: "도움돼요 취소",
  REWARD_GRANT: "보상 지급",
  REWARD_REVOKE: "보상 회수",
  CASE_STUDY_CREATE: "케이스 스터디 생성",
  CASE_STUDY_UPDATE: "케이스 스터디 수정",
  CASE_STUDY_PUBLISH: "케이스 스터디 게시",
  CASE_STUDY_UNPUBLISH: "케이스 스터디 비공개",
};

const ACTION_TONE: Partial<Record<ReviewActionLogAction, string>> = {
  REVIEW_APPROVE: "bg-emerald-500/15 text-emerald-300",
  REWARD_GRANT: "bg-emerald-500/15 text-emerald-300",
  REVIEW_REJECT: "bg-[#D97757]/15 text-[#F0E2D2]",
  REWARD_REVOKE: "bg-[#D97757]/15 text-[#F0E2D2]",
  REVIEW_HIDE: "bg-[#D97757]/15 text-[#F0E2D2]",
  REVIEW_FEATURE: "bg-amber-500/15 text-amber-300",
  CASE_STUDY_PUBLISH: "bg-emerald-500/15 text-emerald-300",
};

type SearchParams = {
  action?: string;
  targetReviewId?: string;
  actorAdminEmail?: string;
  fromDate?: string;
  toDate?: string;
  limit?: string;
  offset?: string;
};

export default async function AdminReviewLogsPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const actionRaw = searchParams?.action;
  const action =
    actionRaw && (ALLOWED_ACTIONS as readonly string[]).includes(actionRaw)
      ? (actionRaw as ReviewActionLogAction)
      : undefined;
  const targetReviewId = searchParams?.targetReviewId?.trim() || undefined;
  const actorAdminEmail = searchParams?.actorAdminEmail?.trim() || undefined;
  const fromDate = searchParams?.fromDate || undefined;
  const toDate = searchParams?.toDate || undefined;
  const limitRaw = Number(searchParams?.limit ?? 100);
  const limit = [50, 100, 200].includes(limitRaw) ? limitRaw : 100;
  const offsetRaw = Number(searchParams?.offset ?? 0);
  const offset = Number.isFinite(offsetRaw) ? Math.max(0, offsetRaw) : 0;

  const { rows, total } = await getReviewActionLogs({
    limit,
    offset,
    action,
    targetReviewId,
    actorAdminEmail,
    fromDate,
    toDate,
  });

  const baseQuery = new URLSearchParams();
  if (action) baseQuery.set("action", action);
  if (targetReviewId) baseQuery.set("targetReviewId", targetReviewId);
  if (actorAdminEmail) baseQuery.set("actorAdminEmail", actorAdminEmail);
  if (fromDate) baseQuery.set("fromDate", fromDate);
  if (toDate) baseQuery.set("toDate", toDate);
  if (limit !== 100) baseQuery.set("limit", String(limit));
  const hrefFor = (o: number | null) => {
    if (o === null) return null;
    const q = new URLSearchParams(baseQuery);
    if (o > 0) q.set("offset", String(o));
    return `/admin-panel/reviews/logs${q.toString() ? `?${q.toString()}` : ""}`;
  };

  return (
    <div className="grid gap-5">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/40">
          Reviews
        </p>
        <h1 className="mt-1 text-2xl font-bold">활동 로그</h1>
        <p className="mt-2 text-sm text-cream/60">
          리뷰·케이스 스터디·보상 관련 모든 액션이 review_action_logs에 기록됩니다.
        </p>
      </header>

      <ReviewsSubNav />

      <form className="grid gap-3 rounded-2xl border border-cream/10 bg-[#1F1E1D]/80 p-4 sm:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
        <select
          name="action"
          defaultValue={action ?? ""}
          className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 text-xs text-cream outline-none focus:border-[#D97757]"
        >
          <option value="">action 전체</option>
          {ALLOWED_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {ACTION_LABEL[a]}
            </option>
          ))}
        </select>
        <input
          name="actorAdminEmail"
          defaultValue={actorAdminEmail}
          placeholder="admin email"
          className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
        />
        <input
          name="targetReviewId"
          defaultValue={targetReviewId}
          placeholder="review id"
          className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 font-mono text-xs text-cream outline-none focus:border-[#D97757]"
        />
        <input
          type="date"
          name="fromDate"
          defaultValue={fromDate?.slice(0, 10)}
          className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 text-xs text-cream outline-none focus:border-[#D97757]"
        />
        <input
          type="date"
          name="toDate"
          defaultValue={toDate?.slice(0, 10)}
          className="h-9 rounded-lg border border-cream/15 bg-[#15140F] px-2 text-xs text-cream outline-none focus:border-[#D97757]"
        />
        <button
          type="submit"
          className="h-9 rounded-lg bg-[#D97757] px-4 text-xs font-bold text-cream transition hover:brightness-110"
        >
          적용
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-cream/10 bg-[#1F1E1D]/80">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b border-cream/10 bg-[#15140F] text-[10px] uppercase tracking-[0.16em] text-cream/40">
              <tr>
                <th className="px-3 py-2.5">시각</th>
                <th className="px-3 py-2.5">액션</th>
                <th className="px-3 py-2.5">actor</th>
                <th className="px-3 py-2.5">대상</th>
                <th className="px-3 py-2.5">diff</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-cream/50">
                    조건에 맞는 로그가 없습니다.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="border-b border-cream/5 hover:bg-cream/5">
                    <td className="px-3 py-3 font-mono text-cream/70">
                      {formatKstDateTime(row.created_at)}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.16em] ${
                          ACTION_TONE[row.action] || "bg-cream/10 text-cream/70"
                        }`}
                      >
                        {ACTION_LABEL[row.action] || row.action}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono text-cream/70">
                      {row.actor_admin_email
                        ? `admin: ${row.actor_admin_email}`
                        : row.actor_user_provider
                          ? `${row.actor_user_provider}:${row.actor_user_provider_account_id}`
                          : "—"}
                    </td>
                    <td className="px-3 py-3 font-mono text-[#D97757]">
                      {row.target_review_id ? (
                        <Link
                          href={`/admin-panel/reviews/list?search=${encodeURIComponent(row.target_review_id)}`}
                          className="hover:brightness-125"
                        >
                          R · {row.target_review_id.slice(0, 8)}…
                        </Link>
                      ) : row.target_case_study_id ? (
                        <Link
                          href={`/admin-panel/case-studies/${row.target_case_study_id}`}
                          className="hover:brightness-125"
                        >
                          CS · {row.target_case_study_id.slice(0, 8)}…
                        </Link>
                      ) : (
                        <span className="text-cream/30">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <LogDiffViewer before={row.before_state} after={row.after_state} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {hrefFor(offset > 0 ? Math.max(0, offset - limit) : null) ? (
          <Link
            href={hrefFor(offset > 0 ? Math.max(0, offset - limit) : null) as string}
            className="rounded-xl border border-cream/15 bg-cream/5 px-4 py-2 text-xs font-bold text-cream transition hover:bg-cream/10"
          >
            ← 이전
          </Link>
        ) : (
          <span />
        )}
        <span className="font-mono text-xs text-cream/50">
          {total === 0
            ? "0 / 0"
            : `${offset + 1} – ${Math.min(offset + limit, total)} / ${total}`}
        </span>
        {hrefFor(offset + limit < total ? offset + limit : null) ? (
          <Link
            href={hrefFor(offset + limit < total ? offset + limit : null) as string}
            className="rounded-xl bg-[#D97757] px-4 py-2 text-xs font-bold text-cream transition hover:brightness-110"
          >
            다음 →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </div>
  );
}
