import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import type { CaseStudyRow } from "@/lib/reviews/types";

const PUBLIC_COLUMNS =
  "id, slug, review_id, title, summary, body_md, hero_image_url, customer_label, plan_code, metrics, published_at";
const ADMIN_COLUMNS = "*";

// ---------------------------------------------------------------------------
// Public reads
// ---------------------------------------------------------------------------

export async function getPublishedCaseStudies(
  limit = 24
): Promise<Array<Omit<CaseStudyRow, "published" | "created_by" | "updated_by" | "created_at" | "updated_at">>> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("case_studies")
    .select(PUBLIC_COLUMNS)
    .eq("published", true)
    .order("published_at", { ascending: false, nullsFirst: false })
    .limit(Math.min(Math.max(limit, 1), 200));
  if (error || !data) return [];
  return data as Array<Omit<CaseStudyRow, "published" | "created_by" | "updated_by" | "created_at" | "updated_at">>;
}

export async function getPublishedCaseStudyBySlug(slug: string): Promise<CaseStudyRow | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("case_studies")
    .select(ADMIN_COLUMNS)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as CaseStudyRow;
}

// ---------------------------------------------------------------------------
// Admin reads
// ---------------------------------------------------------------------------

export type AdminCaseStudyListParams = {
  published?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export async function getAdminCaseStudies(
  params: AdminCaseStudyListParams = {}
): Promise<{ rows: CaseStudyRow[]; total: number }> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { rows: [], total: 0 };

  const limit = Math.min(Math.max(params.limit ?? 25, 1), 200);
  const offset = Math.max(params.offset ?? 0, 0);

  let query = supabase.from("case_studies").select(ADMIN_COLUMNS, { count: "exact" });
  if (params.published !== undefined) query = query.eq("published", params.published);
  if (params.search) {
    const safe = params.search.replace(/[%_]/g, "");
    query = query.or(`title.ilike.%${safe}%,summary.ilike.%${safe}%,slug.ilike.%${safe}%`);
  }
  query = query.order("updated_at", { ascending: false });
  const { data, count, error } = await query.range(offset, offset + limit - 1);
  if (error || !data) return { rows: [], total: 0 };
  return { rows: data as CaseStudyRow[], total: count ?? 0 };
}

export async function getAdminCaseStudyById(id: string): Promise<CaseStudyRow | null> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("case_studies")
    .select(ADMIN_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return data as CaseStudyRow;
}

// ---------------------------------------------------------------------------
// Admin writes
// ---------------------------------------------------------------------------

export type UpsertCaseStudyInput = {
  slug: string;
  title: string;
  summary: string;
  bodyMd: string;
  reviewId?: string | null;
  heroImageUrl?: string | null;
  customerLabel?: string | null;
  planCode?: string | null;
  metrics?: Record<string, string | number>;
};

export type CaseStudyMutationResult =
  | { ok: true; caseStudy: CaseStudyRow }
  | {
      ok: false;
      code:
        | "supabase_not_configured"
        | "validation_failed"
        | "slug_taken"
        | "not_found"
        | "write_failed";
      message?: string;
    };

function validateInput(input: UpsertCaseStudyInput): string | null {
  if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(input.slug)) return "slug_invalid";
  if (!input.title || input.title.length > 120) return "title_invalid";
  if (!input.summary || input.summary.length > 200) return "summary_invalid";
  if (!input.bodyMd || input.bodyMd.length < 1) return "body_required";
  return null;
}

export async function createCaseStudy(
  input: UpsertCaseStudyInput,
  adminEmail: string
): Promise<CaseStudyMutationResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };

  const validationErr = validateInput(input);
  if (validationErr) return { ok: false, code: "validation_failed", message: validationErr };

  const { data: existing } = await supabase
    .from("case_studies")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();
  if (existing) return { ok: false, code: "slug_taken" };

  const { data, error } = await supabase
    .from("case_studies")
    .insert({
      slug: input.slug,
      title: input.title,
      summary: input.summary,
      body_md: input.bodyMd,
      review_id: input.reviewId ?? null,
      hero_image_url: input.heroImageUrl ?? null,
      customer_label: input.customerLabel ?? null,
      plan_code: input.planCode ?? null,
      metrics: input.metrics ?? {},
      published: false,
      created_by: adminEmail,
      updated_by: adminEmail,
    })
    .select("*")
    .single();
  if (error || !data) return { ok: false, code: "write_failed", message: error?.message };

  await supabase.from("review_action_logs").insert({
    actor_admin_email: adminEmail,
    action: "CASE_STUDY_CREATE",
    target_case_study_id: (data as CaseStudyRow).id,
    target_review_id: input.reviewId ?? null,
    after_state: { slug: input.slug, title: input.title, review_id: input.reviewId ?? null },
  });
  return { ok: true, caseStudy: data as CaseStudyRow };
}

export type UpdateCaseStudyInput = Partial<UpsertCaseStudyInput> & { id: string };

export async function updateCaseStudy(
  input: UpdateCaseStudyInput,
  adminEmail: string
): Promise<CaseStudyMutationResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };

  // Slug uniqueness check if changing.
  if (input.slug) {
    if (!/^[a-z0-9][a-z0-9-]{0,80}$/.test(input.slug)) {
      return { ok: false, code: "validation_failed", message: "slug_invalid" };
    }
    const { data: conflict } = await supabase
      .from("case_studies")
      .select("id")
      .eq("slug", input.slug)
      .neq("id", input.id)
      .maybeSingle();
    if (conflict) return { ok: false, code: "slug_taken" };
  }
  if (input.title !== undefined && (!input.title || input.title.length > 120)) {
    return { ok: false, code: "validation_failed", message: "title_invalid" };
  }
  if (input.summary !== undefined && (!input.summary || input.summary.length > 200)) {
    return { ok: false, code: "validation_failed", message: "summary_invalid" };
  }

  const { data: before } = await supabase
    .from("case_studies")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();
  if (!before) return { ok: false, code: "not_found" };

  const patch: Record<string, unknown> = { updated_by: adminEmail };
  if (input.slug !== undefined) patch.slug = input.slug;
  if (input.title !== undefined) patch.title = input.title;
  if (input.summary !== undefined) patch.summary = input.summary;
  if (input.bodyMd !== undefined) patch.body_md = input.bodyMd;
  if (input.reviewId !== undefined) patch.review_id = input.reviewId;
  if (input.heroImageUrl !== undefined) patch.hero_image_url = input.heroImageUrl;
  if (input.customerLabel !== undefined) patch.customer_label = input.customerLabel;
  if (input.planCode !== undefined) patch.plan_code = input.planCode;
  if (input.metrics !== undefined) patch.metrics = input.metrics;

  const { data, error } = await supabase
    .from("case_studies")
    .update(patch)
    .eq("id", input.id)
    .select("*")
    .single();
  if (error || !data) return { ok: false, code: "write_failed", message: error?.message };

  await supabase.from("review_action_logs").insert({
    actor_admin_email: adminEmail,
    action: "CASE_STUDY_UPDATE",
    target_case_study_id: input.id,
    target_review_id: (data as CaseStudyRow).review_id,
    before_state: before,
    after_state: patch,
  });

  return { ok: true, caseStudy: data as CaseStudyRow };
}

export async function setCaseStudyPublished(
  id: string,
  published: boolean,
  adminEmail: string
): Promise<CaseStudyMutationResult> {
  const supabase = getSupabaseAdminClient();
  if (!supabase) return { ok: false, code: "supabase_not_configured" };

  const { data: before } = await supabase
    .from("case_studies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!before) return { ok: false, code: "not_found" };

  const { data, error } = await supabase
    .from("case_studies")
    .update({
      published,
      published_at: published ? new Date().toISOString() : null,
      updated_by: adminEmail,
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error || !data) return { ok: false, code: "write_failed", message: error?.message };

  await supabase.from("review_action_logs").insert({
    actor_admin_email: adminEmail,
    action: published ? "CASE_STUDY_PUBLISH" : "CASE_STUDY_UNPUBLISH",
    target_case_study_id: id,
    target_review_id: (data as CaseStudyRow).review_id,
    before_state: { published: (before as CaseStudyRow).published },
    after_state: { published },
  });

  return { ok: true, caseStudy: data as CaseStudyRow };
}
