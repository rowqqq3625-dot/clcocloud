import { NextRequest, NextResponse } from "next/server";
import { getCurrentAdminSession } from "@/lib/admin/session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await getCurrentAdminSession(req);
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    expiresAt: session.expires_at,
    email: session.admin_email,
  });
}
