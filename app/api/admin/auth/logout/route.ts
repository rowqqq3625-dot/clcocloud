import { NextRequest, NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/admin/csrf";
import { logAdminAction } from "@/lib/admin/audit";
import {
  AdminAuthError,
  destroyAdminSession,
  requireAdminSession,
} from "@/lib/admin/session";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!verifyCsrf(req)) {
    return NextResponse.json({ error: "접근할 수 없습니다." }, { status: 401 });
  }

  try {
    const session = await requireAdminSession(req);
    const response = NextResponse.json({ ok: true });
    await destroyAdminSession(req, response, "MANUAL_LOGOUT");
    await logAdminAction({
      email: session.admin_email,
      action: "ADMIN_LOGOUT",
      targetType: "admin_session",
      targetId: session.id,
      req,
    });
    return response;
  } catch (err) {
    if (err instanceof AdminAuthError) {
      // Still clear the cookie defensively.
      const response = NextResponse.json({ error: "접근할 수 없습니다." }, { status: 401 });
      await destroyAdminSession(req, response, "LOGOUT_NO_SESSION");
      return response;
    }
    throw err;
  }
}
