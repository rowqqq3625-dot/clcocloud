import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin/audit";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const DeleteSchema = z.object({
  reason: z.string().trim().min(4).max(1000),
});

type Params = { params: { provider: string; accountId: string; noteId: string } };

/**
 * Soft-delete a customer note. The DB row is preserved (deleted_at +
 * deleted_by_email get stamped) so audit history isn't lost; hard delete is
 * blocked by the migration's GRANT revoke.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = DeleteSchema.safeParse(await req.json().catch(() => null));
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
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by_email: guard.session.admin_email,
    })
    .eq("id", params.noteId)
    .eq("provider", provider)
    .eq("provider_account_id", accountId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "CUSTOMER_NOTE_DELETE",
    targetType: "customer_note",
    targetId: params.noteId,
    payload: {
      customer: `${provider}:${accountId}`,
      reason: parsed.data.reason,
    },
    req,
  });

  return NextResponse.json({ ok: true });
}
