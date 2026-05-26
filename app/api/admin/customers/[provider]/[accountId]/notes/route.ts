import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin/audit";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PostSchema = z.object({
  body: z.string().trim().min(2).max(2000),
});

type Params = { params: { provider: string; accountId: string } };

export async function GET(req: NextRequest, { params }: Params) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
  }

  const provider = decodeURIComponent(params.provider);
  const accountId = decodeURIComponent(params.accountId);

  const { data, error } = await supabase
    .from("admin_customer_notes")
    .select("id,author_email,body,created_at,deleted_at,deleted_by_email")
    .eq("provider", provider)
    .eq("provider_account_id", accountId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  return NextResponse.json({ notes: data || [] });
}

export async function POST(req: NextRequest, { params }: Params) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
  }

  const provider = decodeURIComponent(params.provider);
  const accountId = decodeURIComponent(params.accountId);

  const { data, error } = await supabase
    .from("admin_customer_notes")
    .insert({
      provider,
      provider_account_id: accountId,
      author_email: guard.session.admin_email,
      body: parsed.data.body,
    })
    .select("id,author_email,body,created_at")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "CUSTOMER_NOTE_CREATE",
    targetType: "customer",
    targetId: `${provider}:${accountId}`,
    payload: { note_id: data.id, length: parsed.data.body.length },
    req,
  });

  return NextResponse.json({ note: data });
}
