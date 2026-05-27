import { notFound } from "next/navigation";
import { CaseStudyEditor } from "@/components/admin/reviews/CaseStudyEditor";
import { getAdminCaseStudyById } from "@/lib/case-studies/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function EditCaseStudyPage({
  params,
}: {
  params: { id: string };
}) {
  const item = await getAdminCaseStudyById(params.id);
  if (!item) notFound();
  return <CaseStudyEditor mode="edit" initial={item} />;
}
