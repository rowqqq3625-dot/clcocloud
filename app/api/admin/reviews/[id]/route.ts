import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin/audit";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const adminReviewSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  bonusStatus: z.enum(["none", "pending", "paid"]).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = adminReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_review_update" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });

  const update: Record<string, string> = {};
  if (parsed.data.status) {
    update.status = parsed.data.status;
    update.reviewed_at = new Date().toISOString();
  }
  if (parsed.data.bonusStatus) update.bonus_status = parsed.data.bonusStatus;
  if (Object.keys(update).length === 0) return NextResponse.json({ error: "empty_update" }, { status: 400 });

  const { data, error } = await supabase
    .from("reviews")
    .update(update)
    .eq("id", params.id)
    .select("id,status,bonus_status,reviewed_at")
    .single();

  if (error) return NextResponse.json({ error: "review_update_failed" }, { status: 500 });

  await logAdminAction({
    email: guard.session.admin_email,
    action: "REVIEW_UPDATE",
    targetType: "review",
    targetId: params.id,
    payload: parsed.data,
    req: request,
  });

  return NextResponse.json({ review: data });
}
