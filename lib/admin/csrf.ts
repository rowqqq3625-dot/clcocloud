import "server-only";
import type { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_SECURE,
  ADMIN_CSRF_COOKIE,
  ADMIN_CSRF_HEADER,
  requireAdminEnv,
} from "./config";
import { hmacSign, hmacVerify, randomToken } from "./hash";

type ServerCookieJar = {
  get(name: string): { value: string } | undefined;
  set(name: string, value: string, options: {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
    path?: string;
    maxAge?: number;
  }): void;
};

const TOKEN_TTL_SECONDS = 60 * 60 * 6; // 6 hours

function sign(value: string): string {
  return `${value}.${hmacSign(value, requireAdminEnv("ADMIN_CSRF_SECRET"))}`;
}

function unwrap(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const lastDot = signed.lastIndexOf(".");
  if (lastDot < 1) return null;
  const value = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  if (!hmacVerify(value, sig, requireAdminEnv("ADMIN_CSRF_SECRET"))) return null;
  return value;
}

export function issueCsrfTokenOnResponse(response: NextResponse): string {
  const raw = randomToken(24);
  const signed = sign(raw);
  // Readable by client JS — required for double-submit (the matching value is
  // sent back via X-Admin-CSRF header). HMAC signature prevents forgery.
  response.cookies.set(ADMIN_CSRF_COOKIE, signed, {
    httpOnly: false,
    secure: ADMIN_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
  return signed;
}

/**
 * Server-component variant: writes the CSRF cookie via Next's mutable
 * cookies() jar instead of a NextResponse. Returns the signed token.
 */
export function issueCsrfTokenOnCookieJar(jar: ServerCookieJar): string {
  const raw = randomToken(24);
  const signed = sign(raw);
  jar.set(ADMIN_CSRF_COOKIE, signed, {
    httpOnly: false,
    secure: ADMIN_COOKIE_SECURE,
    sameSite: "strict",
    path: "/",
    maxAge: TOKEN_TTL_SECONDS,
  });
  return signed;
}

/**
 * Double-submit verification:
 *  - Cookie value must HMAC-verify against ADMIN_CSRF_SECRET.
 *  - Header X-Admin-CSRF must equal the cookie value byte-for-byte.
 */
export function verifyCsrf(req: NextRequest | Request): boolean {
  // NextRequest has cookies, plain Request does not — handle both.
  const cookieValue = "cookies" in req && (req as NextRequest).cookies
    ? (req as NextRequest).cookies.get(ADMIN_CSRF_COOKIE)?.value
    : parseCookie(req.headers.get("cookie"), ADMIN_CSRF_COOKIE);
  const headerValue = req.headers.get(ADMIN_CSRF_HEADER);
  if (!cookieValue || !headerValue) return false;
  if (cookieValue !== headerValue) return false;
  return unwrap(cookieValue) !== null;
}

function parseCookie(raw: string | null, name: string): string | undefined {
  if (!raw) return undefined;
  const parts = raw.split(/;\s*/);
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq) === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return undefined;
}
