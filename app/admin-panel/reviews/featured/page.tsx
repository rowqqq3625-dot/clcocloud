import { FeaturedReorderBoard } from "@/components/admin/reviews/FeaturedReorderBoard";
import { ReviewsSubNav } from "@/components/admin/reviews/ReviewsSubNav";
import { getFeaturedReviews } from "@/lib/reviews/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminFeaturedReviewsPage() {
  const items = await getFeaturedReviews(50);

  return (
    <div className="grid gap-5">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/40">
          Reviews
        </p>
        <h1 className="mt-1 text-2xl font-bold">추천 리뷰 큐레이션</h1>
        <p className="mt-2 text-sm text-cream/60">
          랜딩 슬라이더 상단에 노출될 순서를 지정합니다. featured = true 인 리뷰만 표시됩니다.
        </p>
      </header>

      <ReviewsSubNav />

      <FeaturedReorderBoard initialItems={items} />
    </div>
  );
}
