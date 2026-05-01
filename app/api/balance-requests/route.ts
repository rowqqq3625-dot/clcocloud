import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/lib/auth-session";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

const balanceRequestSchema = z.object({
  contactEmail: z.string().email(),
  requestAmount: z.string().trim().min(1).max(80),
  message: z.string().trim().min(5).max(800)
});

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = balanceRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_balance_request" }, { status: 400 });

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });

  const { data, error } = await supabase
    .from("balance_requests")
    .insert({
      user_provider: session.provider,
      user_provider_account_id: session.providerAccountId,
      contact_email: parsed.data.contactEmail,
      request_amount: parsed.data.requestAmount,
      message: parsed.data.message,
      status: "pending"
    })
    .select("id,status,created_at")
    .single();

  if (error) return NextResponse.json({ error: "balance_request_insert_failed" }, { status: 500 });
  return NextResponse.json({ request: data }, { status: 201 });
}
