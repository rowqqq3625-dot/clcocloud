import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-session";

export function GET(request: NextRequest) {
  const session = getSessionFromRequest(request);

  return NextResponse.json({
    authenticated: Boolean(session),
    user: session
      ? {
          provider: session.provider,
          email: session.email || null,
          name: session.name || null,
          image: session.image || null
        }
      : null
  });
}
