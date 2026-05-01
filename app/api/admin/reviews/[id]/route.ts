import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, isAdminSession } from "@/lib/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const adminReviewSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  bonusStatus: z.enum(["none", "pending", "paid"]).optional()
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!isAdminSession(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = adminReviewSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_review_update" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

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
  return NextResponse.json({ review: data });
}
