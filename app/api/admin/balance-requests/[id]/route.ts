import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin/audit";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const adminBalanceRequestSchema = z.object({
  status: z.enum(["pending", "answered", "fulfilled", "rejected"]),
  adminNote: z.string().trim().max(1000).optional(),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = adminBalanceRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_balance_request_update" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });

  const { data, error } = await supabase
    .from("balance_requests")
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.adminNote || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.id)
    .select("id,status,admin_note,updated_at")
    .single();

  if (error) return NextResponse.json({ error: "balance_request_update_failed" }, { status: 500 });

  await logAdminAction({
    email: guard.session.admin_email,
    action: "BALANCE_REQUEST_UPDATE",
    targetType: "balance_request",
    targetId: params.id,
    payload: parsed.data,
    req: request,
  });

  return NextResponse.json({ request: data });
}
