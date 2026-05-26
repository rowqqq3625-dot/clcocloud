import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { logAdminAction, logAdminSecurityEvent } from "@/lib/admin/audit";
import { guardAdminApi } from "@/lib/admin/guard";
import { sendAlimtalk } from "@/lib/alimtalk";
import { getSupabaseAdminClient } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const BodySchema = z.object({
  reason: z.string().trim().min(4).max(1000),
});

type LogRow = {
  id: string;
  order_id: string | null;
  inquiry_id: string | null;
  template_code: string;
  recipient: "buyer" | "operator";
  phone: string;
  payload: Record<string, string> | null;
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await guardAdminApi(req);
  if (!guard.ok) return guard.response;

  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: "잠시 후 다시 시도해주세요." }, { status: 503 });
  }

  const { data: log, error: fetchError } = await supabase
    .from("alimtalk_logs")
    .select("id,order_id,inquiry_id,template_code,recipient,phone,payload")
    .eq("id", params.id)
    .maybeSingle();

  if (fetchError || !log) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  const row = log as LogRow;

  // Defensive: phone & template are required to replay; reject malformed rows
  // even though we'd in theory still try to send.
  if (!row.template_code || !row.phone) {
    await logAdminSecurityEvent({
      eventType: "ADMIN_API_DENIED",
      email: guard.session.admin_email,
      payload: { reason: "alimtalk_resend_malformed_source", source_log_id: row.id },
      req,
    });
    return NextResponse.json({ error: "invalid_source_log" }, { status: 409 });
  }

  const result = await sendAlimtalk({
    templateCode: row.template_code,
    phone: row.phone,
    variables: row.payload || {},
    orderId: row.order_id || undefined,
    inquiryId: row.inquiry_id || undefined,
    recipient: row.recipient,
  });

  await logAdminAction({
    email: guard.session.admin_email,
    action: result.success ? "ALIMTALK_RESEND" : "ALIMTALK_RESEND_FAILED",
    targetType: "alimtalk_log",
    targetId: row.id,
    payload: {
      template_code: row.template_code,
      recipient: row.recipient,
      order_id: row.order_id,
      reason: parsed.data.reason,
      success: result.success,
      error: result.error ?? null,
    },
    req,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error || "알림톡 발송 실패" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, messageId: result.messageId });
}
