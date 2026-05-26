import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction, logAdminSecurityEvent } from "@/lib/admin/audit";
import { guardAdminApi } from "@/lib/admin/guard";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * Whitelist of allowed manual state transitions. Anything outside this map is
 * rejected on the server even if a malicious client crafts a request. We
 * intentionally do NOT allow:
 *   - any forward transition into `paid` (only the PG webhook may set that)
 *   - reversals out of `cancelled` or `refunded` (terminal)
 *   - changes to `paid_at` / `amount` (those are book-keeping invariants)
 *
 * The `refunded` transition here means "mark as refunded for book-keeping
 * only" — the actual PG refund call lives in a separate PR (B7).
 */
const ALLOWED_TRANSITIONS: Record<string, ReadonlyArray<string>> = {
  pending: ["cancelled"],
  paid: ["refunded"],
  paid_pending_key: ["cancelled", "refunded"],
  failed: ["cancelled"],
};

const BodySchema = z.object({
  status: z.enum(["cancelled", "refunded"]),
  reason: z.string().trim().min(8).max(2000),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(request);
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { status: nextStatus, reason } = parsed.data;

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
  }

  const { data: current, error: fetchError } = await supabase
    .from("orders")
    .select("id,status,amount,order_no")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError || !current) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const allowed = ALLOWED_TRANSITIONS[current.status] || [];
  if (!allowed.includes(nextStatus)) {
    await logAdminSecurityEvent({
      eventType: "ADMIN_API_DENIED",
      email: guard.session.admin_email,
      payload: {
        reason: "invalid_transition",
        order_id: current.id,
        from: current.status,
        to: nextStatus,
      },
      req: request,
    });
    return NextResponse.json(
      { error: `현재 상태(${current.status})에서 ${nextStatus} 로 변경할 수 없습니다.` },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("orders")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  if (updateError) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 500 });
  }

  await logAdminAction({
    email: guard.session.admin_email,
    action: nextStatus === "refunded" ? "ORDER_MARK_REFUNDED" : "ORDER_CANCEL",
    targetType: "order",
    targetId: current.id,
    payload: {
      order_no: current.order_no,
      amount: current.amount,
      from: current.status,
      to: nextStatus,
      reason,
    },
    req: request,
  });

  return NextResponse.json({ ok: true, status: nextStatus });
}
