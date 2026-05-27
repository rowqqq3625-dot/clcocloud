import { NextRequest, NextResponse } from "next/server";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";
import { RevokeSchema } from "@/lib/vending/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/admin/vending/keys/:id/revoke
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = RevokeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) return NextResponse.json({ error: "supabase_unavailable" }, { status: 503 });

  const { error } = await supabase.rpc("revoke_key", {
    p_key_id: params.id,
    p_reason: parsed.data.reason,
    p_actor: null,
  });

  if (error) {
    if (error.message?.includes("KEY_NOT_FOUND")) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    console.error("[vending] revoke_key failed:", error);
    return NextResponse.json({ error: "revoke_failed", message: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
