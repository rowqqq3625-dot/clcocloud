import { CaseStudyEditor } from "@/components/admin/reviews/CaseStudyEditor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SearchParams = { reviewId?: string };

export default function NewCaseStudyPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  return (
    <CaseStudyEditor
      mode="create"
      prefillReviewId={searchParams?.reviewId || null}
    />
  );
}
