import { AdminReviewActions } from "@/components/admin/AdminReviewActions";
import type { ReviewRecord } from "@/lib/supabase-admin";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function AdminReviewsTable({ reviews }: { reviews: ReviewRecord[] }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[var(--border-subtle)] bg-cream shadow-[0_24px_80px_rgba(31,30,29,.10)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead className="bg-cream-2 text-[11px] font-bold uppercase tracking-[0.14em] text-secondary">
            <tr>
              <th className="px-5 py-4">상태</th>
              <th className="px-5 py-4">보너스</th>
              <th className="px-5 py-4">별점</th>
              <th className="px-5 py-4">이름</th>
              <th className="px-5 py-4">후기</th>
              <th className="px-5 py-4">작성일</th>
              <th className="px-5 py-4">처리</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((review) => (
              <tr key={review.id} className="border-t border-[var(--border-subtle)]/70 align-top transition hover:bg-peach/25">
                <td className="px-5 py-4"><span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-bold text-coral">{review.status}</span></td>
                <td className="px-5 py-4"><span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-cream">{review.bonus_status}</span></td>
                <td className="px-5 py-4 font-mono text-coral">{"★".repeat(review.rating)}</td>
                <td className="px-5 py-4 text-sm font-semibold">{review.display_name}<br /><span className="text-xs text-secondary">공개: {review.masked_name}</span></td>
                <td className="max-w-[380px] px-5 py-4 text-sm leading-6 text-secondary">{review.body}</td>
                <td className="px-5 py-4 text-sm text-secondary">{formatDate(review.created_at)}</td>
                <td className="px-5 py-4"><AdminReviewActions review={review} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {reviews.length === 0 ? <p className="px-5 py-10 text-center text-sm text-secondary">아직 접수된 리뷰가 없습니다.</p> : null}
    </div>
  );
}
