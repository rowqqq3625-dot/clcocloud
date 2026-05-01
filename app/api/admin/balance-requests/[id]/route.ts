import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest, isAdminSession } from "@/lib/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const adminBalanceRequestSchema = z.object({
  status: z.enum(["pending", "answered", "fulfilled", "rejected"]),
  adminNote: z.string().trim().max(1000).optional()
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getSessionFromRequest(request);
  if (!isAdminSession(session)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const parsed = adminBalanceRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_balance_request_update" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("balance_requests")
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.adminNote || null,
      updated_at: new Date().toISOString()
    })
    .eq("id", params.id)
    .select("id,status,admin_note,updated_at")
    .single();

  if (error) return NextResponse.json({ error: "balance_request_update_failed" }, { status: 500 });
  return NextResponse.json({ request: data });
}
