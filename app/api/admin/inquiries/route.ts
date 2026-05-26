import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction } from "@/lib/admin/audit";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PutSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["open", "contacted", "completed", "closed"]),
  reason: z.string().trim().min(4).max(1000).optional(),
});

export async function GET(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("topup_inquiries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
    }

    return NextResponse.json({ success: true, inquiries: data || [] });
  } catch {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = PutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("topup_inquiries")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: "INQUIRY_STATUS_UPDATE",
    targetType: "topup_inquiry",
    targetId: parsed.data.id,
    payload: { status: parsed.data.status, reason: parsed.data.reason ?? null },
    req,
  });

  return NextResponse.json({ success: true, data });
}
