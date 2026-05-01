import { NextRequest, NextResponse } from "next/server";
import { AUTH_SESSION_COOKIE } from "@/lib/auth-session";

export function GET(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.delete(AUTH_SESSION_COOKIE);
  return response;
}
