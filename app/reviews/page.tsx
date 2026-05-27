import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewFilterBar } from "@/components/reviews/ReviewFilterBar";
import { RatingDistribution } from "@/components/reviews/RatingDistribution";
import { StarDisplay } from "@/components/reviews/StarDisplay";
import { getApprovedReviews, getReviewStats } from "@/lib/reviews/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "클코클라우드 | 실제 사용자 리뷰",
  description: "클로드코드 API 키를 실제로 사용한 분들의 후기를 모두 모았습니다. 별점·플랜·도움순으로 정렬해 비교하세요.",
  alternates: { canonical: "/reviews" },
};

const PAGE_SIZE = 24;

type SearchParams = {
  rating?: string;
  plan?: string;
  sort?: string;
  offset?: string;
};

function clampNumber(raw: string | undefined, fallback: number, min: number, max: number) {
  const n = Number(raw ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}

export default async function ReviewListPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const ratingRaw = searchParams?.rating ? Number(searchParams.rating) : null;
  const rating = ratingRaw && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
  const plan = searchParams?.plan?.trim() || null;
  const sort: "recent" | "helpful" = searchParams?.sort === "helpful" ? "helpful" : "recent";
  const offset = clampNumber(searchParams?.offset, 0, 0, 10_000);

  const [{ rows: reviews, total }, stats] = await Promise.all([
    getApprovedReviews({
      limit: PAGE_SIZE,
      offset,
      rating: rating ?? undefined,
      planCode: plan ?? undefined,
      sort,
    }),
    getReviewStats(),
  ]);

  const nextOffset = offset + PAGE_SIZE < total ? offset + PAGE_SIZE : null;
  const prevOffset = offset > 0 ? Math.max(0, offset - PAGE_SIZE) : null;

  const baseQuery = new URLSearchParams();
  if (rating) baseQuery.set("rating", String(rating));
  if (plan) baseQuery.set("plan", plan);
  if (sort !== "recent") baseQuery.set("sort", sort);
  const buildHref = (o: number | null) => {
    if (o === null) return null;
    const q = new URLSearchParams(baseQuery);
    if (o > 0) q.set("offset", String(o));
    return `/reviews${q.toString() ? `?${q.toString()}` : ""}`;
  };

  return (
    <main className="reviews-shell relative min-h-screen overflow-hidden bg-cream px-5 py-8 text-primary sm:py-10">
      <div className="pointer-events-none absolute -right-40 top-20 h-[560px] w-[560px] rounded-full bg-coral/10 blur-[190px]" />
      <div className="pointer-events-none absolute -bottom-52 left-[-16rem] h-[620px] w-[620px] rounded-full bg-peach/60 blur-[220px]" />
      <SiteHeader variant="floating" />

      <section className="container-cinematic relative z-[1] py-12">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,.36fr)_minmax(0,.64fr)]">
          <aside className="rounded-[32px] border border-[var(--border-subtle)] bg-cream/85 p-7 shadow-[0_24px_80px_rgba(31,30,29,.08)] backdrop-blur-sm">
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-coral/80">
              Reviews
            </p>
            <h1 className="mt-4 text-[clamp(36px,4.5vw,56px)] font-[680] leading-[1.04] tracking-[-0.04em]">
              실제 후기, <br />
              검열 없이 그대로.
            </h1>
            <p className="mt-5 break-keep text-[15px] leading-7 text-secondary">
              결제·키 발급·검토를 모두 통과한 후기만 노출됩니다.
            </p>

            <div className="mt-8 flex items-end gap-3">
              <span className="text-[64px] font-[720] leading-none tracking-[-0.04em] text-primary">
                {stats.avg_rating ?? 0}
              </span>
              <div className="pb-2">
                <StarDisplay rating={stats.avg_rating ?? 0} size="md" />
                <p className="mt-1 text-xs font-semibold text-secondary">
                  총 {stats.total_reviews_approved.toLocaleString()}개 리뷰
                </p>
              </div>
            </div>

            <div className="mt-6">
              <RatingDistribution
                distribution={stats.rating_distribution}
                total={stats.total_reviews_approved}
              />
            </div>
          </aside>

          <section>
            <ReviewFilterBar
              currentRating={rating}
              currentPlan={plan}
              currentSort={sort}
            />

            {reviews.length === 0 ? (
              <div className="mt-8 rounded-[28px] border border-dashed border-[var(--border-subtle)] bg-cream/60 px-6 py-16 text-center">
                <p className="text-lg font-bold text-primary">조건에 맞는 리뷰가 없습니다.</p>
                <p className="mt-2 text-sm text-secondary">필터를 조정해 다시 시도해보세요.</p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}

            {(prevOffset !== null || nextOffset !== null) && (
              <div className="mt-8 flex items-center justify-between">
                {buildHref(prevOffset) ? (
                  <Link
                    href={buildHref(prevOffset) as string}
                    className="inline-flex min-h-11 items-center rounded-2xl border border-[var(--border-subtle)] bg-cream px-5 text-sm font-bold text-secondary transition hover:border-coral/45 hover:text-coral"
                  >
                    ← 이전
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-xs font-mono text-secondary">
                  {offset + 1} – {Math.min(offset + PAGE_SIZE, total)} / {total}
                </span>
                {buildHref(nextOffset) ? (
                  <Link
                    href={buildHref(nextOffset) as string}
                    className="inline-flex min-h-11 items-center rounded-2xl bg-primary px-5 text-sm font-bold text-cream transition hover:bg-coral"
                  >
                    다음 →
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
